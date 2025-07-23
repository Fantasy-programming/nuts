package accounts

import (
	"time"

	"github.com/Fantasy-Programming/nuts/server/internal/repository"
	"github.com/Fantasy-Programming/nuts/server/internal/repository/dto"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type AccountWithTrend struct {
	ID                uuid.UUID              `json:"id"`
	Name              string                 `json:"name"`
	Type              repository.ACCOUNTTYPE `json:"type"`
	Balance           pgtype.Numeric         `json:"balance"`
	Currency          string                 `json:"currency"`
	Meta              dto.AccountMeta        `json:"meta"`
	UpdatedAt         time.Time              `json:"updated_at"`
	Trend             pgtype.Numeric         `json:"trend"`
	BalanceTimeseries []BalancePoint         `json:"balance_timeseries"`
	IsExternal        bool                   `json:"is_external"`
}

type BalancePoint struct {
	Date    time.Time `json:"date"`
	Balance float64   `json:"balance"`
}

// We need to split those i guess

type UserFinancialConnection struct {
	ID                   uuid.UUID  `json:"id" db:"id"`
	UserID               uuid.UUID  `json:"user_id" db:"user_id"`
	ProviderName         string     `json:"provider_name" db:"provider_name"`
	AccessTokenEncrypted string     `json:"-" db:"access_token_encrypted"` // Never expose in JSON
	ItemID               *string    `json:"item_id" db:"item_id"`
	InstitutionID        *string    `json:"institution_id" db:"institution_id"`
	InstitutionName      *string    `json:"institution_name" db:"institution_name"`
	Status               string     `json:"status" db:"status"`
	LastSyncAt           *time.Time `json:"last_sync_at" db:"last_sync_at"`
	ExpiresAt            *time.Time `json:"expires_at" db:"expires_at"`
	CreatedAt            time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt            time.Time  `json:"updated_at" db:"updated_at"`
}
