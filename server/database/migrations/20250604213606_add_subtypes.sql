-- +goose Up
-- +goose StatementBegin
ALTER TABLE accounts ADD COLUMN subtype VARCHAR(50);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
SELECT 'down SQL query';
-- +goose StatementEnd
