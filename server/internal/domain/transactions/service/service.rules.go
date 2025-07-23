package service

import (
	"context"
	"fmt"

	"github.com/Fantasy-Programming/nuts/server/internal/domain/transactions"
	"github.com/Fantasy-Programming/nuts/server/internal/domain/transactions/repository"
	internalRepo "github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/repository/dto"
	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

func (s *TransactionService) CreateRule(ctx context.Context, req transactions.CreateTransactionRuleRequest, userID uuid.UUID) (*transactions.TransactionRule, error) {
	params := repository.CreateRuleParams{
		Name:       req.Name,
		IsActive:   req.IsActive,
		Priority:   req.Priority,
		Conditions: req.Conditions,
		Actions:    req.Actions,
		CreatedBy:  userID,
	}

	rule, err := s.trscRepo.CreateRule(ctx, params)
	if err != nil {
		s.logger.Error().Err(err).Msg("Failed to create rule")
		return nil, fmt.Errorf("failed to create rule: %w", err)
	}

	return rule, nil
}

func (s *TransactionService) GetRule(ctx context.Context, id uuid.UUID) (*transactions.TransactionRule, error) {
	rule, err := s.trscRepo.GetRuleByID(ctx, id)
	if err != nil {
		s.logger.Error().Err(err).Str("rule_id", id.String()).Msg("Failed to get rule")
		return nil, fmt.Errorf("failed to get rule: %w", err)
	}

	return rule, nil
}

func (s *TransactionService) ListRules(ctx context.Context, userID uuid.UUID) ([]transactions.TransactionRule, error) {
	rules, err := s.trscRepo.ListRules(ctx, userID)
	if err != nil {
		s.logger.Error().Err(err).Str("user_id", userID.String()).Msg("Failed to list rules")
		return nil, fmt.Errorf("failed to list rules: %w", err)
	}

	return rules, nil
}

func (s *TransactionService) UpdateRule(ctx context.Context, id uuid.UUID, req transactions.UpdateTransactionRuleRequest, userID uuid.UUID) (*transactions.TransactionRule, error) {
	params := repository.UpdateRuleParams{
		ID:         id,
		Name:       req.Name,
		IsActive:   req.IsActive,
		Priority:   req.Priority,
		Conditions: req.Conditions,
		Actions:    req.Actions,
		UpdatedBy:  userID,
	}

	rule, err := s.trscRepo.UpdateRule(ctx, params)
	if err != nil {
		s.logger.Error().Err(err).Str("rule_id", id.String()).Msg("Failed to update rule")
		return nil, fmt.Errorf("failed to update rule: %w", err)
	}

	return rule, nil
}

func (s *TransactionService) DeleteRule(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	err := s.trscRepo.DeleteRule(ctx, id, userID)
	if err != nil {
		s.logger.Error().Err(err).Str("rule_id", id.String()).Msg("Failed to delete rule")
		return fmt.Errorf("failed to delete rule: %w", err)
	}

	return nil
}

func (s *TransactionService) ToggleRuleActive(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*transactions.TransactionRule, error) {
	rule, err := s.trscRepo.ToggleRuleActive(ctx, id, userID)
	if err != nil {
		s.logger.Error().Err(err).Str("rule_id", id.String()).Msg("Failed to toggle rule")
		return nil, fmt.Errorf("failed to toggle rule: %w", err)
	}

	return rule, nil
}

func (s *TransactionService) ApplyRulesToTransaction(ctx context.Context, transactionID uuid.UUID, userID uuid.UUID) ([]transactions.RuleMatch, error) {
	// Get the transaction data
	transaction, err := s.trscRepo.GetTransaction(ctx, transactionID)
	if err != nil {
		s.logger.Error().Err(err).Str("transaction_id", transactionID.String()).Msg("Failed to get transaction")
		return nil, fmt.Errorf("failed to get transaction: %w", err)
	}

	// Convert transaction to TransactionData
	transactionData := s.convertToTransactionData(transaction)

	// Get active rules for the user
	rules, err := s.trscRepo.ListActiveRules(ctx, userID)
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

func (s *TransactionService) convertToTransactionData(transaction internalRepo.Transaction) *transactions.TransactionData {
	// Convert amount to decimal
	amount, _ := transaction.Amount.Float64Value()

	return &transactions.TransactionData{
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
func (s *TransactionService) applyActionsToTransaction(ctx context.Context, transactionID uuid.UUID, userID uuid.UUID, actions []transactions.transactions.RuleAction) error {
	updateParams := internalRepo.UpdateTransactionParams{
		ID:        transactionID,
		UpdatedBy: &userID,
	}

	var needsUpdate bool
	var details *dto.Details

	for _, action := range actions {
		switch action.Type {
		case transactions.ActionTypeSetCategory:
			if categoryIDStr, ok := action.Value.(string); ok {
				if categoryID, err := uuid.Parse(categoryIDStr); err == nil {
					updateParams.CategoryID = &categoryID
					needsUpdate = true
				}
			}
		case transactions.ActionTypeSetDescription:
			if description, ok := action.Value.(string); ok {
				updateParams.Description = &description
				needsUpdate = true
			}
		case transactions.ActionTypeSetNote:
			if note, ok := action.Value.(string); ok {
				if details == nil {
					details = &dto.Details{}
				}
				details.Note = &note
				needsUpdate = true
			}
		case transactions.ActionTypeSetTags:
			// Tags would be stored in the details field
			// This would require additional implementation based on how tags are stored
			s.logger.Debug().Str("action_type", string(action.Type)).Msg("Tag setting not implemented yet")
		}
	}

	if details != nil {
		updateParams.Details = details
	}

	if needsUpdate {
		_, err := s.trscRepo.UpdateTransaction(ctx, updateParams)
		if err != nil {
			return fmt.Errorf("failed to update transaction: %w", err)
		}
	}

	return nil
}

// AutoApplyRulesToNewTransaction automatically applies rules to a newly created transaction
func (s *TransactionService) AutoApplyRulesToNewTransaction(ctx context.Context, transactionID uuid.UUID, userID uuid.UUID) error {
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
