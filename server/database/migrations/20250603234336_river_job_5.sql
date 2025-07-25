-- +goose Up
-- River main migration 006 [up]

-- +goose StatementBegin
CREATE OR REPLACE FUNCTION  river_job_state_in_bitmask(bitmask BIT(8), state  river_job_state)
RETURNS boolean
LANGUAGE SQL
IMMUTABLE
AS $$
    SELECT CASE state
        WHEN 'available' THEN get_bit(bitmask, 7)
        WHEN 'cancelled' THEN get_bit(bitmask, 6)
        WHEN 'completed' THEN get_bit(bitmask, 5)
        WHEN 'discarded' THEN get_bit(bitmask, 4)
        WHEN 'pending' THEN get_bit(bitmask, 3)
        WHEN 'retryable' THEN get_bit(bitmask, 2)
        WHEN 'running' THEN get_bit(bitmask, 1)
        WHEN 'scheduled' THEN get_bit(bitmask, 0)
        ELSE 0
    END = 1;
$$;
-- +goose StatementEnd

--
-- Add `river_job.unique_states` and bring up an index on it.
--
-- This column may exist already if users manually created the column and index
-- as instructed in the changelog so the index could be created `CONCURRENTLY`.
--
ALTER TABLE  river_job ADD COLUMN IF NOT EXISTS unique_states BIT(8);

-- This statement uses `IF NOT EXISTS` to allow users with a `river_job` table
-- of non-trivial size to build the index `CONCURRENTLY` out of band of this
-- migration, then follow by completing the migration.
CREATE UNIQUE INDEX IF NOT EXISTS river_job_unique_idx ON  river_job (unique_key)
    WHERE unique_key IS NOT NULL
      AND unique_states IS NOT NULL
      AND  river_job_state_in_bitmask(unique_states, state);

-- Remove the old unique index. Users who are actively using the unique jobs
-- feature and who wish to avoid deploy downtime may want od drop this in a
-- subsequent migration once all jobs using the old unique system have been
-- completed (i.e. no more rows with non-null unique_key and null
-- unique_states).
DROP INDEX  river_job_kind_unique_key_idx;

-- +goose Down
-- River main migration 006 [down]
--
-- Drop `river_job.unique_states` and its index.
--

DROP INDEX river_job_unique_idx;

ALTER TABLE river_job
    DROP COLUMN unique_states;

CREATE UNIQUE INDEX IF NOT EXISTS river_job_kind_unique_key_idx ON  river_job (kind, unique_key) WHERE unique_key IS NOT NULL;

--
-- Drop `river_job_state_in_bitmask` function.
--
DROP FUNCTION  river_job_state_in_bitmask;
