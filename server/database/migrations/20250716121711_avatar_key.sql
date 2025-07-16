-- +goose Up
-- +goose StatementBegin
ALTER TABLE users ADD COLUMN avatar_key TEXT;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE users DROP COLUMN avatar_key;
-- +goose StatementEnd
