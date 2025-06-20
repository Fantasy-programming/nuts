-- +goose Up
ALTER TABLE tags
  ALTER COLUMN color TYPE VARCHAR(7),
  ALTER COLUMN color SET DEFAULT '#0000FF';

ALTER TABLE accounts
  DROP COLUMN IF EXISTS color;

DROP TYPE IF EXISTS "COLOR_ENUM";

-- +goose Down
CREATE TYPE "COLOR_ENUM" AS ENUM ('blue', 'red', 'green'); -- add back actual values

ALTER TABLE accounts
  ADD COLUMN color "COLOR_ENUM";

ALTER TABLE tags
  ALTER COLUMN color TYPE "COLOR_ENUM" USING color::"COLOR_ENUM",
  ALTER COLUMN color SET DEFAULT 'blue';
