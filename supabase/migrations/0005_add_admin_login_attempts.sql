-- Brute-force protection for the admin password.
--
-- Why: the admin password is a 4-digit PIN (10,000 combinations) and login has
-- no other rate limit. Each admin login attempt reserves one slot in a 24-hour
-- window; after 5 attempts the account is locked until the window expires or
-- an operator resets it. Reserving before the password is checked bounds the
-- number of guesses even when requests arrive in parallel.

ALTER TABLE students
    ADD COLUMN IF NOT EXISTS admin_failed_attempts INTEGER NOT NULL DEFAULT 0;

ALTER TABLE students
    ADD COLUMN IF NOT EXISTS admin_attempt_window_start TIMESTAMP WITH TIME ZONE;

-- Atomically reserves one admin login attempt and returns the count within
-- the current window. Returns 0 when the ID is not an admin account.
CREATE OR REPLACE FUNCTION reserve_admin_login_attempt(p_student_id VARCHAR)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_attempts INTEGER;
BEGIN
    UPDATE students
       SET admin_failed_attempts = CASE
               WHEN admin_attempt_window_start IS NULL
                 OR admin_attempt_window_start < NOW() - INTERVAL '24 hours'
               THEN 1
               ELSE admin_failed_attempts + 1
           END,
           admin_attempt_window_start = CASE
               WHEN admin_attempt_window_start IS NULL
                 OR admin_attempt_window_start < NOW() - INTERVAL '24 hours'
               THEN NOW()
               ELSE admin_attempt_window_start
           END
     WHERE student_id = p_student_id
       AND role = 'admin'
    RETURNING admin_failed_attempts INTO v_attempts;

    RETURN COALESCE(v_attempts, 0);
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'reserve_admin_login_attempt failed: %', SQLERRM;
END;
$$;

-- Only the server (service_role) may call it; otherwise anyone with the public
-- key could lock the admin out.
REVOKE ALL ON FUNCTION reserve_admin_login_attempt(VARCHAR) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION reserve_admin_login_attempt(VARCHAR) TO service_role;
