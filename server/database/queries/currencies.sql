-- name: GetCurrencies :many
SELECT
    code,
    name
FROM currencies;
