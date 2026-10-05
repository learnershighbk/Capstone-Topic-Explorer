-- Close the Supabase Data API (PostgREST) to the browser-facing roles.
--
-- Why: RLS is disabled on every table by project policy, so table privileges
-- are the only barrier. Supabase grants `anon` and `authenticated` full table
-- privileges by default, which let anyone holding the public (publishable /
-- anon) key - shipped in every browser bundle - read and modify `students` and
-- `saved_analyses` directly, bypassing the app.
--
-- The app reads and writes these tables only from the server with the secret
-- (service_role) key, which keeps its own grants, so nothing in the app breaks.
-- Supabase Auth lives in the `auth` schema and is unaffected.
--
-- Idempotent: REVOKE on privileges that are already absent is a no-op.

DO $$
BEGIN
    REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
    REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

    -- Keep tables created later in this schema closed as well.
    ALTER DEFAULT PRIVILEGES IN SCHEMA public
        REVOKE ALL ON TABLES FROM anon, authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public
        REVOKE ALL ON SEQUENCES FROM anon, authenticated;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '0004_restrict_public_data_api failed: %', SQLERRM;
END$$;
