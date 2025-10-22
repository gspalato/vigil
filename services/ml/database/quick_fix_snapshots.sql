-- Quick fix: Add missing columns to existing snapshots table
-- Run this if you just want to add the missing columns quickly

-- Add the missing columns
ALTER TABLE snapshots ADD COLUMN IF NOT EXISTS run_id INTEGER;
ALTER TABLE snapshots ADD COLUMN IF NOT EXISTS timedelta INTEGER DEFAULT 1;

-- Create clustering_runs table if it doesn't exist
CREATE TABLE IF NOT EXISTS clustering_runs (
    run_id SERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total_reports INTEGER NOT NULL,
    total_clusters INTEGER NOT NULL,
    eps_meters INTEGER NOT NULL,
    min_samples INTEGER NOT NULL,
    max_time_gap_days INTEGER NOT NULL,
    parameters JSONB,
    status TEXT DEFAULT 'completed'
);

-- Create a default run for existing data
INSERT INTO clustering_runs (
    total_reports,
    total_clusters,
    eps_meters,
    min_samples,
    max_time_gap_days,
    parameters,
    status
) VALUES (
    0,
    (SELECT COUNT(DISTINCT cluster_id) FROM snapshots),
    5000,
    3,
    14,
    '{"default": true}',
    'completed'
) ON CONFLICT DO NOTHING;

-- Update existing snapshots to use the default run
UPDATE snapshots 
SET run_id = (
    SELECT run_id FROM clustering_runs WHERE parameters->>'default' = 'true' LIMIT 1
),
timedelta = 1
WHERE run_id IS NULL;

-- Add foreign key constraint
ALTER TABLE snapshots 
ADD CONSTRAINT fk_snapshots_run_id 
FOREIGN KEY (run_id) REFERENCES clustering_runs(run_id) ON DELETE CASCADE;
