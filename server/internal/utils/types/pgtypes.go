package types

import (
	"database/sql"
	"fmt"
	"log"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

func ToPgNumeric(v *float64) pgtype.Numeric {
	var n pgtype.Numeric
	if v == nil {
		n = NumericNull()
	} else {
		n = Numeric(*v)
	}
	return n
}

// Convert a float64 into a postgres numeric type
func Numeric(number float64) (value pgtype.Numeric) {
	parse := strconv.FormatFloat(number, 'f', -1, 64)

	if err := value.Scan(parse); err != nil {
		log.Fatal(err)
	}

	return value
}

// Give out a null numeric
func NumericNull() pgtype.Numeric {
	return pgtype.Numeric{
		Int:              nil,
		Exp:              0,
		NaN:              false,
		InfinityModifier: 0,
		Valid:            false,
	}
}

func TimePtrToNullTime(t *time.Time) sql.NullTime {
	if t != nil {
		return sql.NullTime{Time: *t, Valid: true}
	}
	return sql.NullTime{Valid: false}
}

// NullTimeToTimePtr converts a sql.NullTime to *time.Time.
func NullTimeToTimePtr(t sql.NullTime) *time.Time {
	if t.Valid {
		return &t.Time
	}
	return nil
}

// uuidPtrToNullString converts a *uuid.UUID to sql.NullString.
func UUIDPtrToNullString(id *uuid.UUID) sql.NullString {
	if id != nil {
		return sql.NullString{String: id.String(), Valid: true}
	}
	return sql.NullString{Valid: false}
}

// NullStringToUUIDPtr converts a sql.NullString to *uuid.UUID.
func NullStringToUUIDPtr(s sql.NullString) *uuid.UUID {
	if s.Valid {
		parsedID := uuid.MustParse(s.String)
		return &parsedID
	}
	return nil
}

// StringPtrToNullString converts a *string to sql.NullString.
func StringPtrToNullString(s *string) sql.NullString {
	if s != nil {
		return sql.NullString{String: *s, Valid: true}
	}
	return sql.NullString{Valid: false}
}

// NullStringToStringPtr converts a sql.NullString to *string.
func NullStringToStringPtr(s sql.NullString) *string {
	if s.Valid {
		return &s.String
	}
	return nil
}

// Float64PtrToNullFloat64 converts a *float64 to sql.NullFloat64.
func Float64PtrToNullFloat64(f *float64) sql.NullFloat64 {
	if f != nil {
		return sql.NullFloat64{Float64: *f, Valid: true}
	}
	return sql.NullFloat64{Valid: false}
}

// NullFloat64ToFloat64Ptr converts a sql.NullFloat64 to *float64.
func NullFloat64ToFloat64Ptr(f sql.NullFloat64) *float64 {
	if f.Valid {
		return &f.Float64
	}
	return nil
}

// func ContainsUUID(s []uuid.UUID, e *uuid.UUID) bool {
//     if e == nil {
//         return false // Cannot contain a nil UUID in a slice of non-nil UUIDs
//     }
//     for _, a := range s {
//         if a == *e {
//             return true
//         }
//     }
//     return false
// }

// numericToFloat64 converts a pgtype.Numeric to a float64 using Float64Value().
func NumericToFloat64(n pgtype.Numeric) (float64, error) {
	f8, err := n.Float64Value()
	if err != nil {
		return 0, fmt.Errorf("error converting pgtype.Numeric to float64: %w", err)
	}
	if !f8.Valid {
		return 0, fmt.Errorf("numeric value is not valid")
	}
	return f8.Float64, nil
}
