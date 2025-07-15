-- +goose Up
-- name: add_color_icon_to_categories
ALTER TABLE categories
    ADD COLUMN color VARCHAR(7)    -- e.g. “#1A73E8”; adjust length if you prefer longer values
               CHECK (color ~ '^#[0-9A-Fa-f]{6}$') NULL,
    ADD COLUMN icon VARCHAR(100) NOT NULL DEFAULT 'Box';

-- +goose Down
ALTER TABLE categories
    DROP COLUMN icon,
    DROP COLUMN color;
