-- +goose Up
-- +goose StatementBegin
INSERT INTO currencies (code, name) VALUES
('USD', 'United States Dollar'),
('EUR', 'Euro'),
('JPY', 'Japanese Yen'),
('GBP', 'British Pound Sterling'),
('AUD', 'Australian Dollar'),
('CAD', 'Canadian Dollar'),
('CHF', 'Swiss Franc'),
('CNY', 'Chinese Yuan'),
('SEK', 'Swedish Krona'),
('NZD', 'New Zealand Dollar');
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DELETE FROM currencies
WHERE
    code IN ('USD', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'CHF', 'CNY', 'SEK', 'NZD');
-- +goose StatementEnd
