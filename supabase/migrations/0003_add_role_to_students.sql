-- Add role column to students table for admin dashboard
ALTER TABLE students
    ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'student' NOT NULL;

-- Check constraint for valid roles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'students_role_check'
    ) THEN
        ALTER TABLE students ADD CONSTRAINT students_role_check CHECK (role IN ('student', 'admin'));
    END IF;
END$$;

-- Index for role-based queries
CREATE INDEX IF NOT EXISTS idx_students_role ON students(role);

-- Index for last_login_at (admin dashboard: today's login count)
CREATE INDEX IF NOT EXISTS idx_students_last_login_at ON students(last_login_at);

-- Set admin role for the designated admin account
-- Insert if not exists, update if exists
INSERT INTO students (student_id, role)
VALUES ('321000059', 'admin')
ON CONFLICT (student_id)
DO UPDATE SET role = 'admin';
