-- Per-student daily limit on AI generation calls.
--
-- Why: AI endpoints spend paid API credits on every call and login is
-- student-ID only, so one account (or a leaked ID) could drain the budget.
-- Each call reserves one slot for (student, KST date, endpoint) before the AI
-- is called; when the limit is reached the reservation is refused. The day
-- rolls over at midnight Asia/Seoul. Admin accounts are exempt in the app.

CREATE TABLE IF NOT EXISTS ai_usage_daily (
    student_id VARCHAR(9) NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    usage_date DATE NOT NULL,
    endpoint VARCHAR(20) NOT NULL,
    call_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    PRIMARY KEY (student_id, usage_date, endpoint),
    CONSTRAINT ai_usage_daily_endpoint_check CHECK (endpoint IN ('issues', 'topics', 'analysis')),
    CONSTRAINT ai_usage_daily_call_count_check CHECK (call_count >= 0)
);

-- Admin dashboard / operators query usage by day.
CREATE INDEX IF NOT EXISTS idx_ai_usage_daily_usage_date ON ai_usage_daily(usage_date);

DROP TRIGGER IF EXISTS update_ai_usage_daily_updated_at ON ai_usage_daily;
CREATE TRIGGER update_ai_usage_daily_updated_at
    BEFORE UPDATE ON ai_usage_daily
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Disable RLS as per project guidelines; 0004's default privileges keep the
-- table closed to anon/authenticated. Revoke explicitly in case 0004 was not run.
ALTER TABLE ai_usage_daily DISABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE ai_usage_daily FROM anon, authenticated;

-- Atomically reserves one call. Returns the new count for today, or 0 when the
-- limit is already reached. The conditional upsert makes parallel requests
-- unable to exceed the limit.
CREATE OR REPLACE FUNCTION reserve_ai_call(p_student_id VARCHAR, p_endpoint VARCHAR, p_limit INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    INSERT INTO ai_usage_daily (student_id, usage_date, endpoint, call_count)
    VALUES (p_student_id, (NOW() AT TIME ZONE 'Asia/Seoul')::DATE, p_endpoint, 1)
    ON CONFLICT (student_id, usage_date, endpoint)
    DO UPDATE SET call_count = ai_usage_daily.call_count + 1
        WHERE ai_usage_daily.call_count < p_limit
    RETURNING call_count INTO v_count;

    RETURN COALESCE(v_count, 0);
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'reserve_ai_call failed: %', SQLERRM;
END;
$$;

-- Gives back a reserved call when the AI request failed, so students are not
-- charged for server-side errors.
CREATE OR REPLACE FUNCTION release_ai_call(p_student_id VARCHAR, p_endpoint VARCHAR)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE ai_usage_daily
       SET call_count = call_count - 1
     WHERE student_id = p_student_id
       AND usage_date = (NOW() AT TIME ZONE 'Asia/Seoul')::DATE
       AND endpoint = p_endpoint
       AND call_count > 0;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'release_ai_call failed: %', SQLERRM;
END;
$$;

-- Only the server (service_role) may call these.
REVOKE ALL ON FUNCTION reserve_ai_call(VARCHAR, VARCHAR, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION reserve_ai_call(VARCHAR, VARCHAR, INTEGER) TO service_role;
REVOKE ALL ON FUNCTION release_ai_call(VARCHAR, VARCHAR) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION release_ai_call(VARCHAR, VARCHAR) TO service_role;
