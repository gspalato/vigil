#!/usr/bin/env python3
"""
Example usage of TimedeltaSnapshot storage system.

This script demonstrates how to save and retrieve TimedeltaSnapshots
with versioning and historical tracking.
"""

import sys
import os
from datetime import datetime, timedelta

# Add the services/ml directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

def demonstrate_timedelta_snapshot_storage():
    """Demonstrate the TimedeltaSnapshot storage system."""
    print("=== TimedeltaSnapshot Storage System Demo ===\n")
    
    # Mock TimedeltaSnapshot data (simulating what you'd get from clustering)
    from models.outbreakml.structures import TimedeltaSnapshot, ClusterSnapshot
    
    # Create sample ClusterSnapshots
    cluster_snapshots_1 = [
        ClusterSnapshot(
            cluster_id="cluster_0",
            time_window_start="2024-01-01T00:00:00Z",
            time_window_end="2024-01-02T00:00:00Z",
            centroid=[40.7128, -74.0060],
            avg_embedding=[0.1] * 768,
            report_ids=[1, 2, 3],
            common_symptoms=["fever", "cough"]
        ),
        ClusterSnapshot(
            cluster_id="cluster_1",
            time_window_start="2024-01-01T00:00:00Z",
            time_window_end="2024-01-02T00:00:00Z",
            centroid=[40.7500, -73.9500],
            avg_embedding=[0.2] * 768,
            report_ids=[4, 5],
            common_symptoms=["nausea", "vomiting"]
        )
    ]
    
    cluster_snapshots_2 = [
        ClusterSnapshot(
            cluster_id="cluster_0",
            time_window_start="2024-01-02T00:00:00Z",
            time_window_end="2024-01-03T00:00:00Z",
            centroid=[40.7130, -74.0058],
            avg_embedding=[0.15] * 768,
            report_ids=[6, 7, 8],
            common_symptoms=["fever", "cough"]
        )
    ]
    
    # Create TimedeltaSnapshots
    timedelta_snapshots = [
        TimedeltaSnapshot(
            timedelta=1,
            time_window_start="2024-01-01T00:00:00Z",
            time_window_end="2024-01-02T00:00:00Z",
            snapshots=cluster_snapshots_1
        ),
        TimedeltaSnapshot(
            timedelta=1,
            time_window_start="2024-01-02T00:00:00Z",
            time_window_end="2024-01-03T00:00:00Z",
            snapshots=cluster_snapshots_2
        )
    ]
    
    print("--- Sample TimedeltaSnapshots ---")
    for i, ts in enumerate(timedelta_snapshots):
        print(f"TimedeltaSnapshot {i+1}:")
        print(f"  Time window: {ts.time_window_start} to {ts.time_window_end}")
        print(f"  Clusters: {len(ts.snapshots)}")
        for snapshot in ts.snapshots:
            print(f"    - {snapshot.cluster_id}: {len(snapshot.report_ids)} reports")
    
    print("\n--- Storage Strategy ---")
    print("✅ Versioned Storage: Each clustering run gets a unique run_id")
    print("✅ Historical Tracking: Previous runs are preserved")
    print("✅ Easy Retrieval: Get latest or specific run results")
    print("✅ Automatic Cleanup: Optional maintenance to remove old runs")
    print("✅ Metadata Storage: Parameters and statistics saved with each run")
    
    print("\n--- Database Schema ---")
    print("📊 clustering_runs: Metadata about each clustering calculation")
    print("📊 snapshots: Individual cluster snapshots with run_id")
    print("📊 predicted_snapshots: Future predictions linked to runs")
    
    print("\n--- Usage Examples ---")
    print("""
# Save TimedeltaSnapshots
run_id = db.save_timedelta_snapshots(
    timedelta_snapshots,
    eps_meters=5000,
    min_samples=3,
    max_time_gap_days=14,
    total_reports=100,
    parameters={"custom_param": "value"}
)

# Retrieve latest results
latest_snapshots = db.fetch_latest_timedelta_snapshots()

# Get specific run
runs = db.fetch_clustering_runs(limit=5)
specific_run_id = runs[0]['run_id']

# Cleanup old runs (keep last 10)
deleted_count = db.cleanup_old_clustering_runs(keep_runs=10)
""")

def demonstrate_versioning_benefits():
    """Show the benefits of versioned storage."""
    print("\n=== Versioning Benefits ===\n")
    
    scenarios = [
        {
            "title": "Parameter Tuning",
            "description": "Compare clustering results with different parameters",
            "benefit": "Keep multiple runs to find optimal settings"
        },
        {
            "title": "Debugging Issues",
            "description": "Investigate why clustering results changed",
            "benefit": "Compare current vs previous runs to identify causes"
        },
        {
            "title": "Rollback Capability",
            "description": "Revert to a previous clustering if needed",
            "benefit": "Quick recovery from problematic clustering runs"
        },
        {
            "title": "Historical Analysis",
            "description": "Track how clusters evolve over time",
            "benefit": "Understand long-term trends and patterns"
        },
        {
            "title": "A/B Testing",
            "description": "Test different clustering algorithms",
            "benefit": "Compare results side-by-side"
        }
    ]
    
    for scenario in scenarios:
        print(f"🎯 {scenario['title']}")
        print(f"   {scenario['description']}")
        print(f"   💡 {scenario['benefit']}\n")

def show_storage_comparison():
    """Compare different storage approaches."""
    print("=== Storage Approach Comparison ===\n")
    
    approaches = [
        {
            "name": "❌ Clear Table Approach",
            "pros": ["Simple implementation", "Always current data"],
            "cons": ["No history", "No rollback", "No debugging", "No comparison"],
            "verdict": "Not recommended"
        },
        {
            "name": "✅ Versioned Storage (Recommended)",
            "pros": ["Full history", "Easy rollback", "Parameter comparison", "Debugging support", "Audit trail"],
            "cons": ["Slightly more complex", "More storage space"],
            "verdict": "Best for production systems"
        },
        {
            "name": "⚠️ Append-Only",
            "pros": ["Simple", "Full history"],
            "cons": ["No cleanup", "Storage grows indefinitely", "Hard to find latest"],
            "verdict": "Good for small systems"
        }
    ]
    
    for approach in approaches:
        print(f"{approach['name']}")
        print(f"  Pros: {', '.join(approach['pros'])}")
        print(f"  Cons: {', '.join(approach['cons'])}")
        print(f"  Verdict: {approach['verdict']}\n")

if __name__ == "__main__":
    demonstrate_timedelta_snapshot_storage()
    demonstrate_versioning_benefits()
    show_storage_comparison()
    
    print("=== Implementation Steps ===")
    print("1. Run the database schema: database/timedelta_snapshots_schema.sql")
    print("2. Use db.save_timedelta_snapshots() to save your clustering results")
    print("3. Use db.fetch_latest_timedelta_snapshots() to get the most recent results")
    print("4. Optionally use db.cleanup_old_clustering_runs() for maintenance")
    print("5. Enjoy versioned, trackable clustering results! 🚀")
