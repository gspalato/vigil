-- Database schema for cluster ID management system
-- This schema supports maintaining unique cluster IDs across recalculations

-- Table to store cluster ID mappings (label -> cluster_id)
CREATE TABLE IF NOT EXISTS cluster_mappings (
    id SERIAL PRIMARY KEY,
    label INTEGER NOT NULL,
    cluster_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(label, created_at)
);

-- Table to store cluster-to-reports mappings
CREATE TABLE IF NOT EXISTS cluster_reports (
    id SERIAL PRIMARY KEY,
    cluster_id TEXT NOT NULL,
    report_ids BIGINT[] NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(cluster_id, created_at)
);

-- Table to store cluster ID counter
CREATE TABLE IF NOT EXISTS cluster_id_counter (
    id SERIAL PRIMARY KEY,
    counter INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert initial counter if it doesn't exist
INSERT INTO cluster_id_counter (counter) VALUES (0) ON CONFLICT DO NOTHING;

-- Function to get the next cluster ID counter
CREATE OR REPLACE FUNCTION get_next_cluster_id_counter()
RETURNS INTEGER AS $$
DECLARE
    current_counter INTEGER;
BEGIN
    SELECT counter INTO current_counter FROM cluster_id_counter ORDER BY id DESC LIMIT 1;
    RETURN COALESCE(current_counter, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to update cluster ID counter
CREATE OR REPLACE FUNCTION update_cluster_id_counter(new_counter INTEGER)
RETURNS VOID AS $$
BEGIN
    INSERT INTO cluster_id_counter (counter) VALUES (new_counter);
END;
$$ LANGUAGE plpgsql;

-- Function to get the latest cluster mapping
CREATE OR REPLACE FUNCTION get_latest_cluster_mapping()
RETURNS TABLE(label INTEGER, cluster_id TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (cm.label) cm.label, cm.cluster_id
    FROM cluster_mappings cm
    ORDER BY cm.label, cm.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get the latest cluster reports mapping
CREATE OR REPLACE FUNCTION get_latest_cluster_reports()
RETURNS TABLE(cluster_id TEXT, report_ids BIGINT[]) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (cr.cluster_id) cr.cluster_id, cr.report_ids
    FROM cluster_reports cr
    ORDER BY cr.cluster_id, cr.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cluster_mappings_label ON cluster_mappings(label);
CREATE INDEX IF NOT EXISTS idx_cluster_mappings_created_at ON cluster_mappings(created_at);
CREATE INDEX IF NOT EXISTS idx_cluster_reports_cluster_id ON cluster_reports(cluster_id);
CREATE INDEX IF NOT EXISTS idx_cluster_reports_created_at ON cluster_reports(created_at);
