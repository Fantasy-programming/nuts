-- +goose Up
-- +goose StatementBegin
ALTER TABLE transactions ADD COLUMN is_recurring BOOLEAN NOT NULL DEFAULT FALSE;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE transactions DROP COLUMN is_recurring;
-- +goose StatementEnd
