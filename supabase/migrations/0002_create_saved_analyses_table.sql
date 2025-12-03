-- Create saved_analyses table for My Page feature
CREATE TABLE IF NOT EXISTS saved_analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id VARCHAR(9) NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,

    -- Step 1: Scope
    country VARCHAR(100) NOT NULL,
    interest VARCHAR(500) NOT NULL,

    -- Step 2: Selected Issue
    selected_issue TEXT NOT NULL,
    issue_importance_score DECIMAL(3,1),
    issue_frequency_score DECIMAL(3,1),

    -- Step 3 & 4: Selected Topic and Analysis
    topic_title TEXT NOT NULL,
    analysis_data JSONB NOT NULL,

    -- Verified Sources (anti-hallucination)
    verified_data_sources JSONB,
    verified_references JSONB,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_saved_analyses_student_id ON saved_analyses(student_id);
CREATE INDEX IF NOT EXISTS idx_saved_analyses_created_at ON saved_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_analyses_country ON saved_analyses(country);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_saved_analyses_updated_at ON saved_analyses;
CREATE TRIGGER update_saved_analyses_updated_at
    BEFORE UPDATE ON saved_analyses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Disable RLS as per project guidelines
ALTER TABLE saved_analyses DISABLE ROW LEVEL SECURITY;
