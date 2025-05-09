-- +goose Up
ALTER TABLE preferences
ADD COLUMN timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
ADD COLUMN time_format VARCHAR(5) NOT NULL DEFAULT '24h',  -- Values can be '12h' or '24h'
ADD COLUMN date_format VARCHAR(10) NOT NULL DEFAULT 'dd/mm/yyyy',  -- Can be 'dd/mm/yyyy', 'mm/dd/yyyy', 'yyyy/mm/dd'
ADD COLUMN start_week_on_monday BOOLEAN NOT NULL DEFAULT true,  -- true for Monday, false for Sunday
ADD COLUMN dark_sidebar BOOLEAN NOT NULL DEFAULT false;  -- true for dark sidebar, false for light

-- +goose Down
ALTER TABLE preferences
DROP COLUMN IF EXISTS timezone,
DROP COLUMN IF EXISTS time_format,
DROP COLUMN IF EXISTS date_format,
DROP COLUMN IF EXISTS start_week_on_monday,
DROP COLUMN IF EXISTS dark_sidebar;
