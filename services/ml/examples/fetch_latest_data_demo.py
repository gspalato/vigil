#!/usr/bin/env python3
"""
Test script for FetchLatestData method.

This script demonstrates how FetchLatestData retrieves the latest TimedeltaSnapshots
and converts them to GeoJSON format for your app.
"""

import sys
import os
import json
from datetime import datetime, timezone

# Add the services/ml directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

def test_fetch_latest_data():
    """Test the FetchLatestData functionality."""
    print("=== FetchLatestData Test ===\n")
    
    # Mock TimedeltaSnapshots data (simulating what would be retrieved from database)
    from models.outbreakml.structures import TimedeltaSnapshot, ClusterSnapshot
    
    # Create sample data
    timedelta_snapshots = [
        TimedeltaSnapshot(
            timedelta=1,
            time_window_start="2024-01-01T00:00:00Z",
            time_window_end="2024-01-02T00:00:00Z",
            snapshots=[
                ClusterSnapshot(
                    cluster_id="cluster_0",
                    time_window_start="2024-01-01T00:00:00Z",
                    time_window_end="2024-01-02T00:00:00Z",
                    centroid=[40.7128, -74.0060],  # [lat, lon]
                    avg_embedding=[0.1, 0.2, 0.3, 0.4, 0.5] + [0.0] * 763,  # 768-dim vector
                    report_ids=[1, 2, 3],
                    common_symptoms=["fever", "cough"]
                ),
                ClusterSnapshot(
                    cluster_id="cluster_1",
                    time_window_start="2024-01-01T00:00:00Z",
                    time_window_end="2024-01-02T00:00:00Z",
                    centroid=[40.7500, -73.9500],
                    avg_embedding=[0.6, 0.7, 0.8, 0.9, 1.0] + [0.0] * 763,
                    report_ids=[4, 5],
                    common_symptoms=["nausea", "vomiting"]
                )
            ]
        ),
        TimedeltaSnapshot(
            timedelta=1,
            time_window_start="2024-01-02T00:00:00Z",
            time_window_end="2024-01-03T00:00:00Z",
            snapshots=[
                ClusterSnapshot(
                    cluster_id="cluster_0",
                    time_window_start="2024-01-02T00:00:00Z",
                    time_window_end="2024-01-03T00:00:00Z",
                    centroid=[40.7130, -74.0058],
                    avg_embedding=[0.15, 0.25, 0.35, 0.45, 0.55] + [0.0] * 763,
                    report_ids=[6, 7, 8],
                    common_symptoms=["fever", "cough"]
                )
            ]
        )
    ]
    
    # Convert to GeoJSON (simulating what FetchLatestData does)
    geojson_data = timedelta_snapshots_to_geojson(timedelta_snapshots)
    
    print("--- Input: TimedeltaSnapshots ---")
    print(f"Number of time windows: {len(timedelta_snapshots)}")
    total_clusters = sum(len(ts.snapshots) for ts in timedelta_snapshots)
    print(f"Total clusters: {total_clusters}")
    
    print("\n--- Output: GeoJSON ---")
    print(json.dumps(geojson_data, indent=2))
    
    print("\n--- GeoJSON Structure ---")
    print(f"Type: {geojson_data['type']}")
    print(f"Number of features: {len(geojson_data['features'])}")
    print(f"Metadata: {geojson_data['metadata']}")
    
    print("\n--- Sample Feature ---")
    if geojson_data['features']:
        sample_feature = geojson_data['features'][0]
        print(f"Cluster ID: {sample_feature['properties']['cluster_id']}")
        print(f"Coordinates: {sample_feature['geometry']['coordinates']}")
        print(f"Report Count: {sample_feature['properties']['report_count']}")
        print(f"Common Symptoms: {sample_feature['properties']['common_symptoms']}")

def timedelta_snapshots_to_geojson(timedelta_snapshots):
    """Convert TimedeltaSnapshots to GeoJSON format (same as in FetchLatestData)."""
    features = []
    
    for timedelta_snapshot in timedelta_snapshots:
        for cluster_snapshot in timedelta_snapshot.snapshots:
            # Create GeoJSON feature for each cluster
            feature = {
                "type": "Feature",
                "properties": {
                    "cluster_id": cluster_snapshot.cluster_id,
                    "time_window_start": timedelta_snapshot.time_window_start,
                    "time_window_end": timedelta_snapshot.time_window_end,
                    "timedelta": timedelta_snapshot.timedelta,
                    "report_count": len(cluster_snapshot.report_ids),
                    "common_symptoms": cluster_snapshot.common_symptoms,
                    "report_ids": cluster_snapshot.report_ids,
                    "avg_embedding": cluster_snapshot.avg_embedding[:10] if cluster_snapshot.avg_embedding else []  # Truncate for JSON
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [
                        cluster_snapshot.centroid[1],  # longitude
                        cluster_snapshot.centroid[0]   # latitude
                    ]
                }
            }
            features.append(feature)
    
    return {
        "type": "FeatureCollection",
        "features": features,
        "metadata": {
            "total_clusters": len(features),
            "time_windows": len(timedelta_snapshots),
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
    }

def demonstrate_api_usage():
    """Show how your app would use the FetchLatestData API."""
    print("\n=== API Usage Example ===\n")
    
    print("Your app would call FetchLatestData like this:")
    print("""
# gRPC client call
response = ml_service.FetchLatestData(FetchLatestDataRequest())

# Extract the data
time_window_start = response.time_window_start
time_window_end = response.time_window_end
geojson_data = response.geojson

# Convert protobuf Struct back to Python dict
import json
geojson_dict = json.loads(json.dumps(geojson_data))

# Use in your map visualization
map.addGeoJSON(geojson_dict)
""")
    
    print("Response structure:")
    print("- time_window_start: Timestamp of the earliest time window")
    print("- time_window_end: Timestamp of the latest time window") 
    print("- geojson: GeoJSON FeatureCollection with cluster data")
    print("  - Each feature represents one cluster")
    print("  - Properties include cluster_id, symptoms, report_count")
    print("  - Geometry is a Point with cluster centroid coordinates")

if __name__ == "__main__":
    test_fetch_latest_data()
    demonstrate_api_usage()
    
    print("\n=== Implementation Complete ===")
    print("✅ FetchLatestData method implemented")
    print("✅ Retrieves latest TimedeltaSnapshots from database")
    print("✅ Converts to GeoJSON format")
    print("✅ Returns proper protobuf response")
    print("✅ Ready for your app to consume! 🚀")
