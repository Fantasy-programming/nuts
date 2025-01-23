package types

import (
	"log"
	"strconv"

	"github.com/jackc/pgx/v5/pgtype"
)

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
