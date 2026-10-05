-- Count Serper web-search calls in the per-student daily limit.
--
-- Why: /api/search/* spends paid Serper credits and could be called directly
-- by any logged-in student, independent of the analysis limit. Both search
-- routes share the single 'search' bucket.
--
-- Idempotent: the endpoint check is dropped and recreated with the new value.

DO $$
BEGIN
    ALTER TABLE ai_usage_daily DROP CONSTRAINT IF EXISTS ai_usage_daily_endpoint_check;
    ALTER TABLE ai_usage_daily
        ADD CONSTRAINT ai_usage_daily_endpoint_check
        CHECK (endpoint IN ('issues', 'topics', 'analysis', 'search'));
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '0007_add_search_to_ai_usage failed: %', SQLERRM;
END$$;
