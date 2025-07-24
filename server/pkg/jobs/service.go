package jobs

import (
	"context"
	"fmt"
	"time"

	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/utils/encrypt"
	"github.com/Fantasy-Programming/nuts/server/pkg/finance"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/riverqueue/river"
	"github.com/riverqueue/river/riverdriver/riverpgxv5"
	"github.com/robfig/cron/v3"
	"github.com/rs/zerolog"
)

// Job Service
type Service struct {
	openfinance *finance.ProviderManager
	client      *river.Client[pgx.Tx]
	logger      *zerolog.Logger
}

func NewService(db *pgxpool.Pool, logger *zerolog.Logger, openfinance *finance.ProviderManager, encryptionKey string) (*Service, error) {
	workers := river.NewWorkers()

	queries := repository.New(db)
	encrypter, err := encrypt.NewEncrypter(encryptionKey)
	if err != nil {
		return nil, fmt.Errorf("failed to setup encrypter for bank sync jobs: %w", err)
	}

	// Register workers
	river.AddWorker(workers, &EmailWorker{logger: logger})
	river.AddWorker(workers, &BankSyncWorker{deps: &BankSyncWorkerDeps{DB: db, Queries: queries, FinanceManager: openfinance, Logger: logger, encrypt: encrypter}})
	river.AddWorker(workers, &ExportWorker{logger: logger})

	river.AddWorker(workers, &ExchangeRatesSyncWorker{deps: &ExchangeRatesWorkerDeps{DB: db, Queries: queries, Logger: logger}})
	river.AddWorker(workers, &HistoricalExchangeRateWorker{deps: &ExchangeRatesWorkerDeps{DB: db, Queries: queries, Logger: logger}})
	
	// Add recurring transaction workers
	river.AddWorker(workers, &RecurringTransactionWorker{deps: &RecurringTransactionWorkerDeps{DB: db, Queries: queries, Logger: logger}})
	river.AddWorker(workers, &DailyRecurringProcessorWorker{deps: &RecurringTransactionWorkerDeps{DB: db, Queries: queries, Logger: logger}})

	// Parse cron schedule for 6 AM UTC daily
	schedule, err := cron.ParseStandard("0 6 * * *")
	if err != nil {
		return nil, fmt.Errorf("failed to parse cron schedule: %w", err)
	}

	// Parse cron schedule for daily recurring transaction processing at 2 AM UTC
	recurringSchedule, err := cron.ParseStandard("0 2 * * *")
	if err != nil {
		return nil, fmt.Errorf("failed to parse recurring transaction cron schedule: %w", err)
	}

	periodicJobs := []*river.PeriodicJob{
		river.NewPeriodicJob(
			schedule,
			func() (river.JobArgs, *river.InsertOpts) {
				return ExchangeRatesSyncJob{
						JobDate: time.Now().UTC().Truncate(24 * time.Hour),
					}, &river.InsertOpts{
						Queue: "exchange_rates",
						UniqueOpts: river.UniqueOpts{
							ByArgs:   true,
							ByPeriod: 24 * time.Hour,
						},
					}
			},
			&river.PeriodicJobOpts{
				RunOnStart: true,
			},
		),
		river.NewPeriodicJob(
			recurringSchedule,
			func() (river.JobArgs, *river.InsertOpts) {
				return DailyRecurringProcessorJob{
						ProcessDate: time.Now().UTC().Truncate(24 * time.Hour),
					}, &river.InsertOpts{
						Queue: "recurring",
						UniqueOpts: river.UniqueOpts{
							ByArgs:   true,
							ByPeriod: 24 * time.Hour,
						},
					}
			},
			&river.PeriodicJobOpts{
				RunOnStart: false, // Don't run on startup
			},
		),
	}

	riverClient, err := river.NewClient(riverpgxv5.New(db), &river.Config{
		Queues: map[string]river.QueueConfig{
			river.QueueDefault: {MaxWorkers: 10},
			"emails":           {MaxWorkers: 5},
			"sync":             {MaxWorkers: 3},
			"exports":          {MaxWorkers: 2},
			"exchange_rates":   {MaxWorkers: 1},
			"recurring":        {MaxWorkers: 5}, // Queue for recurring transaction jobs
		},
		PeriodicJobs: periodicJobs,
		Workers:      workers,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create river client: %w", err)
	}

	return &Service{
		client:      riverClient,
		openfinance: openfinance,
		logger:      logger,
	}, nil
}

func (s *Service) Start(ctx context.Context) error {
	s.logger.Info().Msg("Starting River job processor")
	return s.client.Start(ctx)
}

func (s *Service) Stop(ctx context.Context) error {
	s.logger.Info().Msg("Stopping River job processor")
	return s.client.Stop(ctx)
}

// Job enqueueing methods
func (s *Service) EnqueueEmail(ctx context.Context, userID int64, email, template string, variables map[string]any) error {
	_, err := s.client.Insert(ctx, EmailJob{
		UserID:    userID,
		Email:     email,
		Template:  template,
		Variables: variables,
	}, &river.InsertOpts{
		Queue: "emails",
	})
	return err
}

func (s *Service) EnqueueBankSync(ctx context.Context, userID, connectionID uuid.UUID, syncType string) error {
	_, err := s.client.Insert(ctx, BankSyncJob{
		UserID:       userID,
		ConnectionID: connectionID,
		SyncType:     syncType,
	}, &river.InsertOpts{
		Queue: "sync",
	})
	return err
}

func (s *Service) EnqueueExport(ctx context.Context, userID int64, exportType string, from, to time.Time) error {
	job := ExportJob{
		UserID:     userID,
		ExportType: exportType,
	}
	job.DateRange.From = from
	job.DateRange.To = to

	_, err := s.client.Insert(ctx, job, &river.InsertOpts{
		Queue: "exports",
	})
	return err
}

func (s *Service) EnqueueHistoricalExchangeRateUpdate(ctx context.Context, baseCurrency string, startDate, endDate time.Time) error {
	_, err := s.client.Insert(ctx, HistoricalExchangeRateJob{
		BaseCurrency: baseCurrency,
		StartDate:    startDate,
		EndDate:      endDate,
	}, &river.InsertOpts{
		Queue: "exchange_rates",
	})
	return err
}

// Bulk exchange rate sync methods
func (s *Service) EnqueueExchangeRatesSync(ctx context.Context, jobDate time.Time) error {
	_, err := s.client.Insert(ctx, ExchangeRatesSyncJob{
		JobDate: jobDate,
	}, &river.InsertOpts{
		Queue: "exchange_rates",
		UniqueOpts: river.UniqueOpts{
			ByArgs:   true,
			ByPeriod: 24 * time.Hour,
		},
	})
	return err
}

// Method to trigger immediate exchange rate update for all currencies
func (s *Service) UpdateAllExchangeRates(ctx context.Context) error {
	today := time.Now().UTC().Truncate(24 * time.Hour)
	return s.EnqueueExchangeRatesSync(ctx, today)
}

// Enqueue recurring transaction job
func (s *Service) EnqueueRecurringTransaction(ctx context.Context, userID, recurringTransactionID uuid.UUID, dueDate time.Time) error {
	_, err := s.client.Insert(ctx, RecurringTransactionJob{
		UserID:                 userID,
		RecurringTransactionID: recurringTransactionID,
		DueDate:                dueDate,
	}, &river.InsertOpts{
		Queue: "recurring",
	})
	return err
}

// Enqueue daily recurring processor job (can be triggered manually)
func (s *Service) EnqueueDailyRecurringProcessor(ctx context.Context, processDate time.Time) error {
	_, err := s.client.Insert(ctx, DailyRecurringProcessorJob{
		ProcessDate: processDate,
	}, &river.InsertOpts{
		Queue: "recurring",
		UniqueOpts: river.UniqueOpts{
			ByArgs:   true,
			ByPeriod: 24 * time.Hour,
		},
	})
	return err
}
