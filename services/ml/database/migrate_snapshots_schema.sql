-- Migration script to update existing snapshots table for TimedeltaSnapshot storage
-- This script safely migrates your existing data to the new versioned schema

-- Step 1: Create the new clustering_runs table
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

-- Step 2: Add new columns to existing snapshots table
ALTER TABLE snapshots ADD COLUMN IF NOT EXISTS run_id INTEGER;
ALTER TABLE snapshots ADD COLUMN IF NOT EXISTS timedelta INTEGER DEFAULT 1;

-- Step 3: Create a migration run for existing data
-- This creates a "migration" run to represent all existing snapshots
INSERT INTO clustering_runs (
    total_reports,
    total_clusters,
    eps_meters,
    min_samples,
    max_time_gap_days,
    parameters,
    status
) VALUES (
    0, -- We don't know the original count
    (SELECT COUNT(DISTINCT cluster_id) FROM snapshots),
    5000, -- Default values
    3,
    14,
    '{"migrated": true, "note": "Existing data migrated to new schema"}',
    'completed'
) RETURNING run_id;

-- Step 4: Update existing snapshots with the migration run_id
-- We'll use a subquery to get the run_id we just created
UPDATE snapshots 
SET run_id = (
    SELECT run_id 
    FROM clustering_runs 
    WHERE parameters->>'migrated' = 'true' 
    ORDER BY created_at DESC 
    LIMIT 1
),
timedelta = 1
WHERE run_id IS NULL;

-- Step 5: Add foreign key constraint (after updating existing data)
ALTER TABLE snapshots 
ADD CONSTRAINT fk_snapshots_run_id 
FOREIGN KEY (run_id) REFERENCES clustering_runs(run_id) ON DELETE CASCADE;

-- Step 6: Create predicted_snapshots table
CREATE TABLE IF NOT EXISTS predicted_snapshots (
    prediction_id SERIAL PRIMARY KEY,
    run_id INTEGER REFERENCES clustering_runs(run_id) ON DELETE CASCADE,
    timedelta INTEGER NOT NULL,
    time_window_start TIMESTAMPTZ NOT NULL,
    time_window_end TIMESTAMPTZ NOT NULL,
    cluster_id TEXT NOT NULL,
    centroid GEOMETRY(Point, 4326),
    avg_embedding VECTOR(768),
    report_count INTEGER NOT NULL,
    common_symptoms JSONB,
    intensity FLOAT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 7: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_snapshots_run_id ON snapshots(run_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_time_window ON snapshots(time_window_start, time_window_end);
CREATE INDEX IF NOT EXISTS idx_snapshots_cluster_id ON snapshots(cluster_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_timedelta ON snapshots(timedelta);

CREATE INDEX IF NOT EXISTS idx_predicted_snapshots_run_id ON predicted_snapshots(run_id);
CREATE INDEX IF NOT EXISTS idx_predicted_snapshots_time_window ON predicted_snapshots(time_window_start, time_window_end);
CREATE INDEX IF NOT EXISTS idx_predicted_snapshots_cluster_id ON predicted_snapshots(cluster_id);

CREATE INDEX IF NOT EXISTS idx_clustering_runs_created_at ON clustering_runs(created_at);

-- Step 8: Create helper functions
CREATE OR REPLACE FUNCTION get_latest_clustering_run()
RETURNS INTEGER AS $$
DECLARE
    latest_run_id INTEGER;
BEGIN
    SELECT run_id INTO latest_run_id 
    FROM clustering_runs 
    WHERE status = 'completed'
    ORDER BY created_at DESC 
    LIMIT 1;
    
    RETURN latest_run_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_snapshots_for_run(target_run_id INTEGER)
RETURNS TABLE(
    snapshot_id INTEGER,
    timedelta INTEGER,
    time_window_start TIMESTAMPTZ,
    time_window_end TIMESTAMPTZ,
    cluster_id TEXT,
    centroid GEOMETRY(Point, 4326),
    avg_embedding VECTOR(768),
    report_ids BIGINT[],
    common_symptoms JSONB,
    report_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.snapshot_id,
        s.timedelta,
        s.time_window_start,
        s.time_window_end,
        s.cluster_id,
        s.centroid,
        s.avg_embedding,
        s.report_ids,
        s.common_symptoms,
        COALESCE(array_length(s.report_ids, 1), 0) as report_count
    FROM snapshots s
    WHERE s.run_id = target_run_id
    ORDER BY s.time_window_start, s.cluster_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_latest_snapshots()
RETURNS TABLE(
    snapshot_id INTEGER,
    timedelta INTEGER,
    time_window_start TIMESTAMPTZ,
    time_window_end TIMESTAMPTZ,
    cluster_id TEXT,
    centroid GEOMETRY(Point, 4326),
    avg_embedding VECTOR(768),
    report_ids BIGINT[],
    common_symptoms JSONB,
    report_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM get_snapshots_for_run(get_latest_clustering_run());
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_old_clustering_runs(keep_runs INTEGER DEFAULT 10)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH runs_to_delete AS (
        SELECT run_id 
        FROM clustering_runs 
        WHERE status = 'completed'
        ORDER BY created_at DESC 
        OFFSET keep_runs
    )
    DELETE FROM clustering_runs 
    WHERE run_id IN (SELECT run_id FROM runs_to_delete);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Verify the migration
DO $$
DECLARE
    migration_run_id INTEGER;
    snapshot_count INTEGER;
BEGIN
    -- Get the migration run ID
    SELECT run_id INTO migration_run_id 
    FROM clustering_runs 
    WHERE parameters->>'migrated' = 'true' 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Count snapshots in the migration run
    SELECT COUNT(*) INTO snapshot_count 
    FROM snapshots 
    WHERE run_id = migration_run_id;
    
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Migration run ID: %', migration_run_id;
    RAISE NOTICE 'Migrated snapshots: %', snapshot_count;
END;
$$;
