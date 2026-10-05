-- Keep the AI suggestions that web verification could not confirm.
--
-- Why: My Page showed only verified items, so a saved analysis lost every
-- suggestion the search step could not confirm. Students still need them as
-- leads to check by hand. Each column is a JSON array of display strings.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS. Rows saved earlier keep NULL, which the
-- app reads as "saved before this column existed".

DO $$
BEGIN
    ALTER TABLE saved_analyses ADD COLUMN IF NOT EXISTS unverified_data_sources JSONB;
    ALTER TABLE saved_analyses ADD COLUMN IF NOT EXISTS unverified_references JSONB;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '0008_add_unverified_sources_to_saved_analyses failed: %', SQLERRM;
END$$;
