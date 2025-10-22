-- Enhanced schema for storing TimedeltaSnapshots with versioning
-- This extends the existing snapshot storage to handle TimedeltaSnapshot objects

-- Table to store clustering runs (metadata about each clustering calculation)
CREATE TABLE IF NOT EXISTS clustering_runs (
    run_id SERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total_reports INTEGER NOT NULL,
    total_clusters INTEGER NOT NULL,
    eps_meters INTEGER NOT NULL,
    min_samples INTEGER NOT NULL,
    max_time_gap_days INTEGER NOT NULL,
    parameters JSONB, -- Store any additional parameters
    status TEXT DEFAULT 'completed' -- 'running', 'completed', 'failed'
);

-- Enhanced snapshots table with run_id and timedelta information
CREATE TABLE IF NOT EXISTS snapshots (
    snapshot_id SERIAL PRIMARY KEY,
    run_id INTEGER REFERENCES clustering_runs(run_id) ON DELETE CASCADE,
    timedelta INTEGER NOT NULL, -- Days in the time window
    time_window_start TIMESTAMPTZ NOT NULL,
    time_window_end TIMESTAMPTZ NOT NULL,
    cluster_id TEXT NOT NULL,
    centroid GEOMETRY(Point, 4326),
    avg_embedding VECTOR(768),
    report_ids BIGINT[] NOT NULL,
    common_symptoms JSONB,
    report_count INTEGER GENERATED ALWAYS AS (array_length(report_ids, 1)) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table for predicted snapshots (future predictions)
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

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_snapshots_run_id ON snapshots(run_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_time_window ON snapshots(time_window_start, time_window_end);
CREATE INDEX IF NOT EXISTS idx_snapshots_cluster_id ON snapshots(cluster_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_timedelta ON snapshots(timedelta);

CREATE INDEX IF NOT EXISTS idx_predicted_snapshots_run_id ON predicted_snapshots(run_id);
CREATE INDEX IF NOT EXISTS idx_predicted_snapshots_time_window ON predicted_snapshots(time_window_start, time_window_end);
CREATE INDEX IF NOT EXISTS idx_predicted_snapshots_cluster_id ON predicted_snapshots(cluster_id);

CREATE INDEX IF NOT EXISTS idx_clustering_runs_created_at ON clustering_runs(created_at);

-- Function to get the latest clustering run
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

-- Function to get snapshots for a specific run
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
        s.report_count
    FROM snapshots s
    WHERE s.run_id = target_run_id
    ORDER BY s.time_window_start, s.cluster_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get latest snapshots (most recent completed run)
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

-- Function to clean up old runs (optional maintenance)
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
