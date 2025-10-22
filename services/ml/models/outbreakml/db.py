from google import genai
from google.genai import types
import numpy as np
import ast

from common.db import supabase

import models.outbreakml.structures
from generated.symptom_report_pb2 import SymptomReport


def _convert_numpy_types(obj):
    """Convert numpy types to Python native types for JSON serialization."""
    if isinstance(obj, dict):
        return {str(k): _convert_numpy_types(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_convert_numpy_types(item) for item in obj]
    elif isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    else:
        return obj

def fetch_all_reports():
  """
    Fetches all reports in a special format.
  """

  response = supabase.rpc("fetch_all_reports").execute()
  return response.data

def fetch_reports_in_interval(start_timestamp: str, end_timestamp: str):
  # Fetch all current reports.
  response = supabase.rpc("fetch_reports", {
      "start_time": start_timestamp,
      "end_time": end_timestamp
  }).execute()
  return response.data

def save_report(report: SymptomReport):
  response = supabase.table("reports").insert(report).execute()
  return response.data

def fetch_reports_last_n(n: int, unit: str):
  """
  Fetch reports from the last n time units.

  Args:
      n (int): Number of time units (e.g., 24 for 24 hours).
      unit (str): Time unit ('hour', 'day', 'minute', etc.).

  Returns:
      list: List of reports with id, lat, lon, symptoms, embedding, utm_x, utm_y.
  """
  response = supabase.rpc("fetch_reports_last_n", {
      "n": n,
      "unit": unit
  }).execute()
  return response.data

def save_timedelta_snapshots(
    timedelta_snapshots, 
    eps_meters=5000, 
    min_samples=3, 
    max_time_gap_days=14,
    total_reports=0,
    parameters=None
):
    """
    Save TimedeltaSnapshot objects to the database with versioning.
    
    Args:
        timedelta_snapshots: List of TimedeltaSnapshot objects
        eps_meters: DBSCAN eps parameter used
        min_samples: DBSCAN min_samples parameter used
        max_time_gap_days: Maximum time gap for splitting clusters
        total_reports: Total number of reports processed
        parameters: Additional parameters as dict
    """
    from datetime import datetime
    
    # Create a new clustering run record
    run_data = {
        "total_reports": int(total_reports),
        "total_clusters": int(sum(len(ts.snapshots) for ts in timedelta_snapshots)),
        "eps_meters": int(eps_meters),
        "min_samples": int(min_samples),
        "max_time_gap_days": int(max_time_gap_days),
        "parameters": _convert_numpy_types(parameters or {}),
        "status": "completed"
    }
    
    run_response = supabase.table("clustering_runs").insert(run_data).execute()
    run_id = run_response.data[0]["run_id"]
    
    # Save all snapshots from all timedelta snapshots
    snapshot_data = []
    for timedelta_snapshot in timedelta_snapshots:
        for snapshot in timedelta_snapshot.snapshots:
            snapshot_data.append({
                "run_id": int(run_id),
                "timedelta": int(timedelta_snapshot.timedelta),
                "time_window_start": timedelta_snapshot.time_window_start,
                "time_window_end": timedelta_snapshot.time_window_end,
                "cluster_id": str(snapshot.cluster_id),
                "centroid": f"SRID=4326;POINT({float(snapshot.centroid[1])} {float(snapshot.centroid[0])})",
                "avg_embedding": _convert_numpy_types(snapshot.avg_embedding),
                "report_ids": [int(rid) for rid in snapshot.report_ids],
                "common_symptoms": _convert_numpy_types(snapshot.common_symptoms)
            })
    
    if snapshot_data:
        supabase.table("snapshots").insert(snapshot_data).execute()
    
    return run_id


def save_predicted_snapshots(predicted_snapshots, run_id):
    """
    Save PredictedSnapshot objects to the database.
    
    Args:
        predicted_snapshots: List of PredictedSnapshot objects
        run_id: ID of the clustering run these predictions belong to
    """
    prediction_data = []
    for prediction in predicted_snapshots:
        prediction_data.append({
            "run_id": int(run_id),
            "timedelta": 1,  # Assuming 1-day predictions
            "time_window_start": prediction.time_window_start,
            "time_window_end": prediction.time_window_end,
            "cluster_id": str(prediction.cluster_id),
            "centroid": f"SRID=4326;POINT({float(prediction.centroid[1])} {float(prediction.centroid[0])})",
            "avg_embedding": _convert_numpy_types(prediction.avg_embedding),
            "report_count": int(prediction.report_count),
            "common_symptoms": _convert_numpy_types(prediction.common_symptoms),
            "intensity": float(prediction.intensity)
        })
    
    if prediction_data:
        supabase.table("predicted_snapshots").insert(prediction_data).execute()


def fetch_latest_timedelta_snapshots():
    """
    Fetch the latest TimedeltaSnapshot objects from the database.
    
    Returns:
        List of TimedeltaSnapshot objects
    """
    from models.outbreakml.structures import TimedeltaSnapshot, ClusterSnapshot
    
    # Get latest snapshots
    response = supabase.rpc("get_latest_snapshots").execute()
    
    if not response.data:
        return []
    
    # Group snapshots by time window
    time_windows = {}
    for row in response.data:
        key = (row["time_window_start"], row["time_window_end"])
        if key not in time_windows:
            time_windows[key] = []
        
        # Convert database row to ClusterSnapshot
        cluster_snapshot = ClusterSnapshot(
            cluster_id=row["cluster_id"],
            time_window_start=row["time_window_start"],
            time_window_end=row["time_window_end"],
            centroid=[row["centroid"]["coordinates"][1], row["centroid"]["coordinates"][0]],  # Convert from PostGIS format
            avg_embedding=row["avg_embedding"],
            report_ids=row["report_ids"],
            common_symptoms=row["common_symptoms"],
            reports=row["reports"]
        )
        time_windows[key].append(cluster_snapshot)
    
    # Convert to TimedeltaSnapshot objects
    timedelta_snapshots = []
    for (start, end), snapshots in time_windows.items():
        timedelta_snapshots.append(TimedeltaSnapshot(
            timedelta=snapshots[0].timedelta if hasattr(snapshots[0], 'timedelta') else 1,
            time_window_start=start,
            time_window_end=end,
            snapshots=snapshots
        ))
    
    return timedelta_snapshots


def fetch_clustering_runs(limit=10):
    """
    Fetch recent clustering runs.
    
    Args:
        limit: Maximum number of runs to return
        
    Returns:
        List of clustering run records
    """
    response = supabase.table("clustering_runs").select("*").order("created_at", desc=True).limit(limit).execute()
    return response.data


def cleanup_old_clustering_runs(keep_runs=10):
    """
    Clean up old clustering runs, keeping only the most recent ones.
    
    Args:
        keep_runs: Number of recent runs to keep
        
    Returns:
        Number of runs deleted
    """
    response = supabase.rpc("cleanup_old_clustering_runs", {"keep_runs": keep_runs}).execute()
    return response.data[0] if response.data else 0


def backfill_all_reports(dry_run=False):
    """
    Process all existing reports by calling ProcessClusters.
    
    Args:
        dry_run: If True, only show what would be processed without saving
        
    Returns:
        run_id if successful, None if dry_run or failed
    """
    print("=== Backfill Processing ===\n")
    
    # Fetch all reports to show count
    print("📊 Fetching all reports...")
    reports = fetch_all_reports()
    
    if not reports:
        print("❌ No reports found in database")
        return None
    
    print(f"✅ Found {len(reports)} reports")
    
    if dry_run:
        print("\n🔍 DRY RUN MODE - No data will be saved")
        print("Would call ProcessClusters to process all reports")
        return None
    
    # Call ProcessClusters directly
    print("\n🔄 Calling ProcessClusters...")
    try:
        from generated.ml_service_pb2 import ProcessClustersRequest
        from services.ml.server import MLServicer
        
        # Create servicer and call ProcessClusters directly
        servicer = MLServicer()
        request = ProcessClustersRequest()
        
        # ProcessClusters doesn't use the context parameter
        response = servicer.ProcessClusters(request, None)
        
        if response.success:
            print("✅ ProcessClusters completed successfully")
            
            # Get the latest run ID
            runs = fetch_clustering_runs(limit=1)
            if runs:
                run_id = runs[0]['run_id']
                print(f"📊 Latest clustering run: {run_id}")
                return run_id
            else:
                print("⚠️ No clustering runs found after processing")
                return None
        else:
            print(f"❌ ProcessClusters failed: {response.error}")
            return None
            
    except Exception as e:
        print(f"❌ Error calling ProcessClusters: {e}")
        return None

