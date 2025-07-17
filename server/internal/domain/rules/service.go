package rules

import (
	"context"
	"fmt"

	"github.com/Fantasy-Programming/nuts/server/internal/domain/transactions"
	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/repository/dto"
	"github.com/google/uuid"
	"github.com/rs/zerolog"
	"github.com/shopspring/decimal"
)

// Service handles business logic for transaction rules
type Service struct {
	repo       Repository
	evaluator  *RuleEvaluator
	transRepo  transactions.Repository
	logger     *zerolog.Logger
}

// NewService creates a new rules service
func NewService(repo Repository, transRepo transactions.Repository, logger *zerolog.Logger) *Service {
	return &Service{
		repo:       repo,
		evaluator:  NewRuleEvaluator(),
		transRepo:  transRepo,
		logger:     logger,
	}
}

// CreateRule creates a new transaction rule
func (s *Service) CreateRule(ctx context.Context, req CreateTransactionRuleRequest, userID uuid.UUID) (*TransactionRule, error) {
	params := CreateRuleParams{
		Name:       req.Name,
		IsActive:   req.IsActive,
		Priority:   req.Priority,
		Conditions: req.Conditions,
		Actions:    req.Actions,
		CreatedBy:  userID,
	}

	rule, err := s.repo.CreateRule(ctx, params)
	if err != nil {
		s.logger.Error().Err(err).Msg("Failed to create rule")
		return nil, fmt.Errorf("failed to create rule: %w", err)
	}

	return rule, nil
}

// GetRule retrieves a rule by ID
func (s *Service) GetRule(ctx context.Context, id uuid.UUID) (*TransactionRule, error) {
	rule, err := s.repo.GetRuleByID(ctx, id)
	if err != nil {
		s.logger.Error().Err(err).Str("rule_id", id.String()).Msg("Failed to get rule")
		return nil, fmt.Errorf("failed to get rule: %w", err)
	}

	return rule, nil
}

// ListRules retrieves all rules for a user
func (s *Service) ListRules(ctx context.Context, userID uuid.UUID) ([]TransactionRule, error) {
	rules, err := s.repo.ListRules(ctx, userID)
	if err != nil {
		s.logger.Error().Err(err).Str("user_id", userID.String()).Msg("Failed to list rules")
		return nil, fmt.Errorf("failed to list rules: %w", err)
	}

	return rules, nil
}

// UpdateRule updates an existing rule
func (s *Service) UpdateRule(ctx context.Context, id uuid.UUID, req UpdateTransactionRuleRequest, userID uuid.UUID) (*TransactionRule, error) {
	params := UpdateRuleParams{
		ID:         id,
		Name:       req.Name,
		IsActive:   req.IsActive,
		Priority:   req.Priority,
		Conditions: req.Conditions,
		Actions:    req.Actions,
		UpdatedBy:  userID,
	}

	rule, err := s.repo.UpdateRule(ctx, params)
	if err != nil {
		s.logger.Error().Err(err).Str("rule_id", id.String()).Msg("Failed to update rule")
		return nil, fmt.Errorf("failed to update rule: %w", err)
	}

	return rule, nil
}

// DeleteRule deletes a rule
func (s *Service) DeleteRule(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	err := s.repo.DeleteRule(ctx, id, userID)
	if err != nil {
		s.logger.Error().Err(err).Str("rule_id", id.String()).Msg("Failed to delete rule")
		return fmt.Errorf("failed to delete rule: %w", err)
	}

	return nil
}

// ToggleRuleActive toggles the active status of a rule
func (s *Service) ToggleRuleActive(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*TransactionRule, error) {
	rule, err := s.repo.ToggleRuleActive(ctx, id, userID)
	if err != nil {
		s.logger.Error().Err(err).Str("rule_id", id.String()).Msg("Failed to toggle rule")
		return nil, fmt.Errorf("failed to toggle rule: %w", err)
	}

	return rule, nil
}

// ApplyRulesToTransaction applies all active rules to a transaction
func (s *Service) ApplyRulesToTransaction(ctx context.Context, transactionID uuid.UUID, userID uuid.UUID) ([]RuleMatch, error) {
	// Get the transaction data
	transaction, err := s.transRepo.GetTransaction(ctx, transactionID)
	if err != nil {
		s.logger.Error().Err(err).Str("transaction_id", transactionID.String()).Msg("Failed to get transaction")
		return nil, fmt.Errorf("failed to get transaction: %w", err)
	}

	// Convert transaction to TransactionData
	transactionData := s.convertToTransactionData(transaction)

	// Get active rules for the user
	rules, err := s.repo.ListActiveRules(ctx, userID)
	if err != nil {
		s.logger.Error().Err(err).Str("user_id", userID.String()).Msg("Failed to get active rules")
		return nil, fmt.Errorf("failed to get active rules: %w", err)
	}

	// Evaluate rules
	matches, err := s.evaluator.EvaluateRules(rules, transactionData)
	if err != nil {
		s.logger.Error().Err(err).Str("transaction_id", transactionID.String()).Msg("Failed to evaluate rules")
		return nil, fmt.Errorf("failed to evaluate rules: %w", err)
	}

	// Apply the actions from the first matching rule (highest priority)
	if len(matches) > 0 {
		firstMatch := matches[0]
		err = s.applyActionsToTransaction(ctx, transactionID, userID, firstMatch.Actions)
		if err != nil {
			s.logger.Error().Err(err).Str("transaction_id", transactionID.String()).Str("rule_id", firstMatch.RuleID.String()).Msg("Failed to apply rule actions")
			return matches, fmt.Errorf("failed to apply rule actions: %w", err)
		}
	}

	return matches, nil
}

// convertToTransactionData converts a repository transaction to TransactionData
func (s *Service) convertToTransactionData(transaction repository.Transaction) *TransactionData {
	// Convert amount to decimal
	amount, _ := transaction.Amount.Float64Value()
	
	return &TransactionData{
		ID:                   transaction.ID,
		Amount:               decimal.NewFromFloat(amount.Float64),
		Type:                 transaction.Type,
		AccountID:            transaction.AccountID,
		AccountName:          "", // This would need to be populated with a join
		CategoryID:           transaction.CategoryID,
		CategoryName:         "", // This would need to be populated with a join
		DestinationAccountID: transaction.DestinationAccountID,
		Description:          transaction.Description,
		TransactionDatetime:  transaction.TransactionDatetime,
		TransactionCurrency:  transaction.TransactionCurrency,
		IsExternal:           transaction.IsExternal != nil && *transaction.IsExternal,
		Tags:                 []string{}, // This would need to be populated based on details
	}
}

// applyActionsToTransaction applies rule actions to a transaction
func (s *Service) applyActionsToTransaction(ctx context.Context, transactionID uuid.UUID, userID uuid.UUID, actions []RuleAction) error {
	updateParams := repository.UpdateTransactionParams{
		ID:        transactionID,
		UpdatedBy: &userID,
	}

	var needsUpdate bool
	var details *dto.Details

	for _, action := range actions {
		switch action.Type {
		case ActionTypeSetCategory:
			if categoryIDStr, ok := action.Value.(string); ok {
				if categoryID, err := uuid.Parse(categoryIDStr); err == nil {
					updateParams.CategoryID = &categoryID
					needsUpdate = true
				}
			}
		case ActionTypeSetDescription:
			if description, ok := action.Value.(string); ok {
				updateParams.Description = &description
				needsUpdate = true
			}
		case ActionTypeSetNote:
			if note, ok := action.Value.(string); ok {
				if details == nil {
					details = &dto.Details{}
				}
				details.Note = &note
				needsUpdate = true
			}
		case ActionTypeSetTags:
			// Tags would be stored in the details field
			// This would require additional implementation based on how tags are stored
			s.logger.Debug().Str("action_type", string(action.Type)).Msg("Tag setting not implemented yet")
		}
	}

	if details != nil {
		updateParams.Details = details
	}

	if needsUpdate {
		_, err := s.transRepo.UpdateTransaction(ctx, updateParams)
		if err != nil {
			return fmt.Errorf("failed to update transaction: %w", err)
		}
	}

	return nil
}

// AutoApplyRulesToNewTransaction automatically applies rules to a newly created transaction
func (s *Service) AutoApplyRulesToNewTransaction(ctx context.Context, transactionID uuid.UUID, userID uuid.UUID) error {
	matches, err := s.ApplyRulesToTransaction(ctx, transactionID, userID)
	if err != nil {
		return err
	}

	if len(matches) > 0 {
		s.logger.Info().
			Str("transaction_id", transactionID.String()).
			Int("matches", len(matches)).
			Str("applied_rule", matches[0].RuleName).
			Msg("Applied rule to transaction")
	}

	return nil
}