# Cluster ID Management System

This system provides persistent cluster IDs across recalculations, ensuring that clusters can be tracked over time even when they split or merge.

## Key Features

1. **Persistent Cluster IDs**: Each cluster gets a unique, persistent ID that survives recalculations
2. **Smart Mapping**: New clusters are mapped to existing IDs based on report overlap
3. **Split Handling**: When clusters split due to time gaps, the first segment keeps the original ID
4. **Automatic ID Generation**: New clusters get automatically generated IDs

## How It Works

### 1. Initial Clustering

When clustering is first performed, each cluster gets a unique ID like `cluster_0`, `cluster_1`, etc.

### 2. Recalculation Mapping

When clusters are recalculated:

- The system compares new clusters with previous clusters based on report overlap
- Clusters with >30% report overlap are considered the same cluster
- The original cluster ID is preserved for matching clusters
- New clusters get new IDs

### 3. Cluster Splitting

When a cluster is split due to time gaps:

- The first time segment keeps the original cluster ID
- Subsequent segments get new cluster IDs
- This ensures continuity while allowing for temporal evolution

## Usage

### Basic Usage

```python
from models.outbreakml.cluster import cluster_reports_with_id_management

# Cluster reports with ID management
labels, cluster_id_mapping = cluster_reports_with_id_management(
    reports,
    eps_meters=5000,
    min_samples=3,
    max_time_gap_days=14
)

# Use the mapping in snapshots
from models.outbreakml.snapshots import compute_snapshots_from_clusters
snapshots = compute_snapshots_from_clusters(labels, reports, cluster_id_mapping)
```

### Advanced Usage

```python
from models.outbreakml.cluster_id_manager import ClusterIDManager

# Create ID manager
id_manager = ClusterIDManager()

# Load previous mapping
previous_mapping = id_manager._load_previous_cluster_mapping()

# Map new clusters to existing IDs
cluster_id_mapping = id_manager.map_clusters_to_existing_ids(
    labels, reports, previous_mapping
)

# Handle splits with ID preservation
final_labels, final_mapping = id_manager.handle_cluster_splits(
    labels, reports, cluster_id_mapping, max_time_gap_days=14
)

# Save for future recalculations
id_manager.save_cluster_mapping(final_mapping, final_labels, reports)
```

## Database Schema

The system uses three main tables:

1. **cluster_mappings**: Maps cluster labels to persistent cluster IDs
2. **cluster_reports**: Maps cluster IDs to their report IDs
3. **cluster_id_counter**: Tracks the next available cluster ID number

## Example Scenarios

### Scenario 1: Stable Clusters

```
Initial calculation:
- Cluster 0: reports [1, 2, 3] → cluster_0
- Cluster 1: reports [4, 5, 6] → cluster_1

Recalculation:
- Cluster 0: reports [1, 2, 3, 7] → cluster_0 (preserved)
- Cluster 1: reports [4, 5, 6] → cluster_1 (preserved)
- Cluster 2: reports [8, 9] → cluster_2 (new)
```

### Scenario 2: Cluster Split

```
Initial calculation:
- Cluster 0: reports [1, 2, 3] → cluster_0

Recalculation with time gap:
- Cluster 0: reports [1, 2] (earlier) → cluster_0 (preserved)
- Cluster 1: reports [3] (later) → cluster_1 (new)
```

### Scenario 3: Cluster Merge

```
Initial calculation:
- Cluster 0: reports [1, 2] → cluster_0
- Cluster 1: reports [3, 4] → cluster_1

Recalculation:
- Cluster 0: reports [1, 2, 3, 4] → cluster_0 (merged, keeps first ID)
```

## Configuration

### Overlap Threshold

The system uses a 30% overlap threshold to determine if clusters are the same. This can be adjusted in the `_find_best_cluster_match` method.

### Time Gap Threshold

The default time gap for splitting clusters is 14 days. This can be configured in the `cluster_reports_with_id_management` function.

### ID Format

Cluster IDs follow the format `cluster_{counter}` where counter is an incrementing integer. This can be customized in the `_generate_cluster_id` method.

## Benefits

1. **Consistency**: Cluster IDs remain stable across recalculations
2. **Traceability**: Easy to track cluster evolution over time
3. **Flexibility**: Handles splits, merges, and new clusters automatically
4. **Performance**: Efficient overlap calculation and mapping
5. **Reliability**: Database-backed persistence ensures data integrity
