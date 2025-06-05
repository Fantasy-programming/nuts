package jobs

import (
	"context"
	"fmt"
	"time"

	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/Fantasy-Programming/nuts/server/pkg/finance"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/riverqueue/river"
	"github.com/riverqueue/river/riverdriver/riverpgxv5"
	"github.com/rs/zerolog"
)

// Job Service
type Service struct {
	openfinance *finance.ProviderManager
	client      *river.Client[pgx.Tx]
	logger      *zerolog.Logger
}

func NewService(db *pgxpool.Pool, logger *zerolog.Logger, openfinance *finance.ProviderManager) (*Service, error) {
	workers := river.NewWorkers()

	queries := repository.New(db)

	// Register workers
	river.AddWorker(workers, &EmailWorker{logger: logger})
	river.AddWorker(workers, &BankSyncWorker{deps: &BankSyncWorkerDeps{DB: db, Queries: queries, FinanceManager: openfinance, Logger: logger}})
	river.AddWorker(workers, &ExportWorker{logger: logger})

	riverClient, err := river.NewClient(riverpgxv5.New(db), &river.Config{
		Queues: map[string]river.QueueConfig{
			river.QueueDefault: {MaxWorkers: 10},
			"emails":           {MaxWorkers: 5},
			"sync":             {MaxWorkers: 3}, // Limit sync jobs
			"exports":          {MaxWorkers: 2}, // Limit export jobs
		},
		Workers: workers,
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
func (s *Service) EnqueueEmail(ctx context.Context, userID int64, email, template string, variables map[string]interface{}) error {
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

// Schedule recurring jobs
// func (s *Service) ScheduleDailySync(ctx context.Context, userID int64) error {
// 	// Schedule daily sync at 2 AM
// 	_, err := s.client.PeriodicJobInsert(ctx, &river.PeriodicJobInsertOpts{
// 		PeriodicJob: &river.PeriodicJob{
// 			Cron:       "0 2 * * *", // 2 AM daily
// 			JobArgs:    BankSyncJob{UserID: userID, SyncType: "incremental"},
// 			InsertOpts: &river.InsertOpts{Queue: "sync"},
// 		},
// 	})
// 	return err
// }
