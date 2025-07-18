package types

import (
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/shopspring/decimal"
)

// FloatToNullDecimal converts a float64 into a decimal.NullDecimal.
// The resulting NullDecimal will always be Valid.
func FloatToNullDecimal(f float64) decimal.NullDecimal {
	return decimal.NullDecimal{
		Decimal: decimal.NewFromFloat(f),
		Valid:   true,
	}
}

// --- Helper Function 2: decimal.NullDecimal -> decimal.Decimal ---
// (This is the corrected version)

// NullDecimalToDecimal safely converts a decimal.NullDecimal to a decimal.Decimal.
// If the NullDecimal is not Valid (representing a NULL value from the database),
// this function returns decimal.Zero. Otherwise, it returns the contained decimal.
func NullDecimalToDecimal(nd decimal.NullDecimal) decimal.Decimal {
	if !nd.Valid {
		return decimal.Zero
	}
	return nd.Decimal
}

func PgtypeNumericToDecimal(n pgtype.Numeric) decimal.Decimal {
	// If the numeric value is NULL in the database
	if !n.Valid {
		return decimal.Zero
	}

	// Create a new decimal from the big.Int value and the exponent.
	// n.Int is the integer value, n.Exp is the number of digits after the decimal point (as a negative power of 10).
	// For example, for 123.45, n.Int would be 12345 and n.Exp would be -2.
	return decimal.NewFromBigInt(n.Int, n.Exp)
}

// DecimalToPgtypeNumeric converts a decimal.Decimal to pgtype.Numeric
func DecimalToPgtypeNumeric(d decimal.Decimal) pgtype.Numeric {
	// Extract coefficient and exponent from the decimal
	coeff := d.Coefficient()
	exp := d.Exponent()
	
	return pgtype.Numeric{
		Int:   coeff,
		Exp:   exp,
		Valid: true,
	}
}

// NullDecimalToPgtypeNumeric converts a decimal.NullDecimal to pgtype.Numeric
func NullDecimalToPgtypeNumeric(nd decimal.NullDecimal) pgtype.Numeric {
	if !nd.Valid {
		return pgtype.Numeric{Valid: false}
	}
	
	return DecimalToPgtypeNumeric(nd.Decimal)
}
