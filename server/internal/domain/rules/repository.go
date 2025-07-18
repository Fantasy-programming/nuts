package rules

import (
	"context"
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Repository interface for transaction rules
type Repository interface {
	CreateRule(ctx context.Context, params CreateRuleParams) (*TransactionRule, error)
	GetRuleByID(ctx context.Context, id uuid.UUID) (*TransactionRule, error)
	ListRules(ctx context.Context, userID uuid.UUID) ([]TransactionRule, error)
	ListActiveRules(ctx context.Context, userID uuid.UUID) ([]TransactionRule, error)
	UpdateRule(ctx context.Context, params UpdateRuleParams) (*TransactionRule, error)
	DeleteRule(ctx context.Context, id uuid.UUID, userID uuid.UUID) error
	ToggleRuleActive(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*TransactionRule, error)
}

// Repository implementation
type rulesRepository struct {
	db *pgxpool.Pool
}

// NewRepository creates a new rule repository
func NewRepository(db *pgxpool.Pool) Repository {
	return &rulesRepository{db: db}
}

// CreateRuleParams represents the parameters for creating a rule
type CreateRuleParams struct {
	Name       string          `json:"name"`
	IsActive   bool            `json:"is_active"`
	Priority   int             `json:"priority"`
	Conditions []RuleCondition `json:"conditions"`
	Actions    []RuleAction    `json:"actions"`
	CreatedBy  uuid.UUID       `json:"created_by"`
}

// UpdateRuleParams represents the parameters for updating a rule
type UpdateRuleParams struct {
	ID         uuid.UUID        `json:"id"`
	Name       *string          `json:"name,omitempty"`
	IsActive   *bool            `json:"is_active,omitempty"`
	Priority   *int             `json:"priority,omitempty"`
	Conditions *[]RuleCondition `json:"conditions,omitempty"`
	Actions    *[]RuleAction    `json:"actions,omitempty"`
	UpdatedBy  uuid.UUID        `json:"updated_by"`
}

// ConditionsJSON is a helper type for JSON marshaling/unmarshaling
type ConditionsJSON []RuleCondition

func (c ConditionsJSON) Value() (driver.Value, error) {
	return json.Marshal(c)
}

func (c *ConditionsJSON) Scan(value interface{}) error {
	if value == nil {
		*c = nil
		return nil
	}
	
	bytes, ok := value.([]byte)
	if !ok {
		return fmt.Errorf("cannot scan %T into ConditionsJSON", value)
	}
	
	return json.Unmarshal(bytes, c)
}

// ActionsJSON is a helper type for JSON marshaling/unmarshaling
type ActionsJSON []RuleAction

func (a ActionsJSON) Value() (driver.Value, error) {
	return json.Marshal(a)
}

func (a *ActionsJSON) Scan(value interface{}) error {
	if value == nil {
		*a = nil
		return nil
	}
	
	bytes, ok := value.([]byte)
	if !ok {
		return fmt.Errorf("cannot scan %T into ActionsJSON", value)
	}
	
	return json.Unmarshal(bytes, a)
}

// CreateRule creates a new transaction rule
func (r *rulesRepository) CreateRule(ctx context.Context, params CreateRuleParams) (*TransactionRule, error) {
	conditionsJSON, err := json.Marshal(params.Conditions)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal conditions: %w", err)
	}

	actionsJSON, err := json.Marshal(params.Actions)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal actions: %w", err)
	}

	query := `
		INSERT INTO transaction_rules (
			name, is_active, priority, conditions, actions, created_by
		) VALUES (
			$1, $2, $3, $4, $5, $6
		) RETURNING id, name, is_active, priority, conditions, actions, created_by, updated_by, created_at, updated_at, deleted_at
	`

	var rule TransactionRule
	var conditionsRaw []byte
	var actionsRaw []byte

	err = r.db.QueryRow(ctx, query, params.Name, params.IsActive, params.Priority, conditionsJSON, actionsJSON, params.CreatedBy).Scan(
		&rule.ID, &rule.Name, &rule.IsActive, &rule.Priority, &conditionsRaw, &actionsRaw, &rule.CreatedBy, &rule.UpdatedBy, &rule.CreatedAt, &rule.UpdatedAt, &rule.DeletedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create rule: %w", err)
	}

	// Unmarshal JSON fields
	if err := json.Unmarshal(conditionsRaw, &rule.Conditions); err != nil {
		return nil, fmt.Errorf("failed to unmarshal conditions: %w", err)
	}
	if err := json.Unmarshal(actionsRaw, &rule.Actions); err != nil {
		return nil, fmt.Errorf("failed to unmarshal actions: %w", err)
	}

	return &rule, nil
}

// GetRuleByID retrieves a rule by its ID
func (r *rulesRepository) GetRuleByID(ctx context.Context, id uuid.UUID) (*TransactionRule, error) {
	query := `
		SELECT id, name, is_active, priority, conditions, actions, created_by, updated_by, created_at, updated_at, deleted_at
		FROM transaction_rules
		WHERE id = $1 AND deleted_at IS NULL
	`

	var rule TransactionRule
	var conditionsRaw []byte
	var actionsRaw []byte

	err := r.db.QueryRow(ctx, query, id).Scan(
		&rule.ID, &rule.Name, &rule.IsActive, &rule.Priority, &conditionsRaw, &actionsRaw, &rule.CreatedBy, &rule.UpdatedBy, &rule.CreatedAt, &rule.UpdatedAt, &rule.DeletedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("rule not found")
		}
		return nil, fmt.Errorf("failed to get rule: %w", err)
	}

	// Unmarshal JSON fields
	if err := json.Unmarshal(conditionsRaw, &rule.Conditions); err != nil {
		return nil, fmt.Errorf("failed to unmarshal conditions: %w", err)
	}
	if err := json.Unmarshal(actionsRaw, &rule.Actions); err != nil {
		return nil, fmt.Errorf("failed to unmarshal actions: %w", err)
	}

	return &rule, nil
}

// ListRules retrieves all rules for a user
func (r *rulesRepository) ListRules(ctx context.Context, userID uuid.UUID) ([]TransactionRule, error) {
	query := `
		SELECT id, name, is_active, priority, conditions, actions, created_by, updated_by, created_at, updated_at, deleted_at
		FROM transaction_rules
		WHERE created_by = $1 AND deleted_at IS NULL
		ORDER BY priority DESC, created_at DESC
	`

	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to list rules: %w", err)
	}
	defer rows.Close()

	var rules []TransactionRule
	for rows.Next() {
		var rule TransactionRule
		var conditionsRaw []byte
		var actionsRaw []byte

		err := rows.Scan(
			&rule.ID, &rule.Name, &rule.IsActive, &rule.Priority, &conditionsRaw, &actionsRaw, &rule.CreatedBy, &rule.UpdatedBy, &rule.CreatedAt, &rule.UpdatedAt, &rule.DeletedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan rule: %w", err)
		}

		// Unmarshal JSON fields
		if err := json.Unmarshal(conditionsRaw, &rule.Conditions); err != nil {
			return nil, fmt.Errorf("failed to unmarshal conditions: %w", err)
		}
		if err := json.Unmarshal(actionsRaw, &rule.Actions); err != nil {
			return nil, fmt.Errorf("failed to unmarshal actions: %w", err)
		}

		rules = append(rules, rule)
	}

	return rules, nil
}

// ListActiveRules retrieves all active rules for a user
func (r *rulesRepository) ListActiveRules(ctx context.Context, userID uuid.UUID) ([]TransactionRule, error) {
	query := `
		SELECT id, name, is_active, priority, conditions, actions, created_by, updated_by, created_at, updated_at, deleted_at
		FROM transaction_rules
		WHERE created_by = $1 AND is_active = TRUE AND deleted_at IS NULL
		ORDER BY priority DESC, created_at DESC
	`

	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to list active rules: %w", err)
	}
	defer rows.Close()

	var rules []TransactionRule
	for rows.Next() {
		var rule TransactionRule
		var conditionsRaw []byte
		var actionsRaw []byte

		err := rows.Scan(
			&rule.ID, &rule.Name, &rule.IsActive, &rule.Priority, &conditionsRaw, &actionsRaw, &rule.CreatedBy, &rule.UpdatedBy, &rule.CreatedAt, &rule.UpdatedAt, &rule.DeletedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan rule: %w", err)
		}

		// Unmarshal JSON fields
		if err := json.Unmarshal(conditionsRaw, &rule.Conditions); err != nil {
			return nil, fmt.Errorf("failed to unmarshal conditions: %w", err)
		}
		if err := json.Unmarshal(actionsRaw, &rule.Actions); err != nil {
			return nil, fmt.Errorf("failed to unmarshal actions: %w", err)
		}

		rules = append(rules, rule)
	}

	return rules, nil
}

// UpdateRule updates an existing rule
func (r *rulesRepository) UpdateRule(ctx context.Context, params UpdateRuleParams) (*TransactionRule, error) {
	setParts := []string{}
	args := []interface{}{}
	argIndex := 1

	if params.Name != nil {
		setParts = append(setParts, fmt.Sprintf("name = $%d", argIndex))
		args = append(args, *params.Name)
		argIndex++
	}

	if params.IsActive != nil {
		setParts = append(setParts, fmt.Sprintf("is_active = $%d", argIndex))
		args = append(args, *params.IsActive)
		argIndex++
	}

	if params.Priority != nil {
		setParts = append(setParts, fmt.Sprintf("priority = $%d", argIndex))
		args = append(args, *params.Priority)
		argIndex++
	}

	if params.Conditions != nil {
		conditionsJSON, err := json.Marshal(*params.Conditions)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal conditions: %w", err)
		}
		setParts = append(setParts, fmt.Sprintf("conditions = $%d", argIndex))
		args = append(args, conditionsJSON)
		argIndex++
	}

	if params.Actions != nil {
		actionsJSON, err := json.Marshal(*params.Actions)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal actions: %w", err)
		}
		setParts = append(setParts, fmt.Sprintf("actions = $%d", argIndex))
		args = append(args, actionsJSON)
		argIndex++
	}

	if len(setParts) == 0 {
		return r.GetRuleByID(ctx, params.ID)
	}

	setParts = append(setParts, fmt.Sprintf("updated_by = $%d", argIndex))
	args = append(args, params.UpdatedBy)
	argIndex++

	setParts = append(setParts, fmt.Sprintf("updated_at = $%d", argIndex))
	args = append(args, time.Now())
	argIndex++

	args = append(args, params.ID)

	query := fmt.Sprintf(`
		UPDATE transaction_rules
		SET %s
		WHERE id = $%d AND deleted_at IS NULL
		RETURNING id, name, is_active, priority, conditions, actions, created_by, updated_by, created_at, updated_at, deleted_at
	`, strings.Join(setParts, ", "), argIndex)

	var rule TransactionRule
	var conditionsRaw []byte
	var actionsRaw []byte

	err := r.db.QueryRow(ctx, query, args...).Scan(
		&rule.ID, &rule.Name, &rule.IsActive, &rule.Priority, &conditionsRaw, &actionsRaw, &rule.CreatedBy, &rule.UpdatedBy, &rule.CreatedAt, &rule.UpdatedAt, &rule.DeletedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("rule not found")
		}
		return nil, fmt.Errorf("failed to update rule: %w", err)
	}

	// Unmarshal JSON fields
	if err := json.Unmarshal(conditionsRaw, &rule.Conditions); err != nil {
		return nil, fmt.Errorf("failed to unmarshal conditions: %w", err)
	}
	if err := json.Unmarshal(actionsRaw, &rule.Actions); err != nil {
		return nil, fmt.Errorf("failed to unmarshal actions: %w", err)
	}

	return &rule, nil
}

// DeleteRule soft deletes a rule
func (r *rulesRepository) DeleteRule(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	query := `
		UPDATE transaction_rules
		SET deleted_at = current_timestamp
		WHERE id = $1 AND created_by = $2 AND deleted_at IS NULL
	`

	result, err := r.db.Exec(ctx, query, id, userID)
	if err != nil {
		return fmt.Errorf("failed to delete rule: %w", err)
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("rule not found or already deleted")
	}

	return nil
}

// ToggleRuleActive toggles the active status of a rule
func (r *rulesRepository) ToggleRuleActive(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*TransactionRule, error) {
	query := `
		UPDATE transaction_rules
		SET
			is_active = NOT is_active,
			updated_by = $1,
			updated_at = current_timestamp
		WHERE id = $2 AND created_by = $1 AND deleted_at IS NULL
		RETURNING id, name, is_active, priority, conditions, actions, created_by, updated_by, created_at, updated_at, deleted_at
	`

	var rule TransactionRule
	var conditionsRaw []byte
	var actionsRaw []byte

	err := r.db.QueryRow(ctx, query, userID, id).Scan(
		&rule.ID, &rule.Name, &rule.IsActive, &rule.Priority, &conditionsRaw, &actionsRaw, &rule.CreatedBy, &rule.UpdatedBy, &rule.CreatedAt, &rule.UpdatedAt, &rule.DeletedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("rule not found")
		}
		return nil, fmt.Errorf("failed to toggle rule: %w", err)
	}

	// Unmarshal JSON fields
	if err := json.Unmarshal(conditionsRaw, &rule.Conditions); err != nil {
		return nil, fmt.Errorf("failed to unmarshal conditions: %w", err)
	}
	if err := json.Unmarshal(actionsRaw, &rule.Actions); err != nil {
		return nil, fmt.Errorf("failed to unmarshal actions: %w", err)
	}

	return &rule, nil
}