from datetime import datetime, timedelta
import math
from matplotlib.patches import Polygon as MplPolygon
import matplotlib.pyplot as plt
import numpy as np
import random
from scipy.interpolate import splprep, splev
from scipy.ndimage import gaussian_filter
from shapely.geometry import Point
from shapely.ops import unary_union

from common.db import supabase

from models.outbreakml.embeddings import decode_embedding
from models.outbreakml.structures import Report, ClusterSnapshot, TimedeltaSnapshot

def compute_snapshots_from_clusters(labels: list[int], reports: list[Report], cluster_id_mapping: dict = None, time_delta: int = 1) -> list[TimedeltaSnapshot]:
  """
    Computes snapshots given the reports and their cluster labels.
    Since clusters have reports that may span multiple time windows,
    we create cluster snapshots by grouping reports by their cluster labels
    and date.

    Args:
      labels (list): List of cluster labels for each report.
      reports (list): List of report dicts with id, lat, lon, symptoms, embedding, utm_x, utm_y.
      cluster_id_mapping (dict): Mapping of cluster labels to persistent cluster IDs.
      time_delta (int): Time window in days to group reports into snapshots.
  """

  # Group reports by (cluster_label, date)
  clusters_by_time = {}
  for report, label in zip(reports, labels):
    if label == -1:
      continue  # Ignore noise points
    report_time = datetime.fromisoformat(report["timestamp"])
    time_window_start = report_time.replace(minute=0, second=0, microsecond=0)
    time_window_end = time_window_start + timedelta(days=time_delta)
    key = (label, time_window_start.isoformat(), time_window_end.isoformat())
    if key not in clusters_by_time:
      clusters_by_time[key] = []
    clusters_by_time[key].append(report)
  
  snapshots = []
  for (label, start_iso, end_iso), cluster_reports in clusters_by_time.items():
    centroid = supabase.rpc("get_centroid", {"report_ids": [r["id"] for r in cluster_reports]}).execute().data[0]
    embeddings = np.array([ decode_embedding(r["embedding"]) for r in cluster_reports ])
    avg_embedding = np.mean(embeddings, axis=0).tolist()
  
    # Aggregate common symptoms
    symptom_sets = [set(r["symptoms"]) for r in cluster_reports]
    common_symptoms = list(symptom_sets[0].intersection(*symptom_sets[1:]))
  
    # Use persistent cluster ID if available, otherwise fall back to temp label
    persistent_cluster_id = cluster_id_mapping.get(label, f"temp_{label}") if cluster_id_mapping else f"temp_{label}"
    
    snapshots.append(ClusterSnapshot(
      cluster_id = persistent_cluster_id,
      centroid = [centroid["y"], centroid["x"]],
      common_symptoms = common_symptoms,
      report_ids = [r["id"] for r in cluster_reports],
      avg_embedding = avg_embedding,
      time_window_start = start_iso,
      time_window_end = end_iso,
      reports = cluster_reports
    ))
    
  # For each timedelta, create a TimedeltaSnapshot and fill with ClusterSnapshots from the same time window.
  timedelta_snapshots = []
  time_windows = {}
  for snapshot in snapshots:
    key = (snapshot.time_window_start, snapshot.time_window_end)
    if key not in time_windows:
      time_windows[key] = []
    time_windows[key].append(snapshot)
    
  for (start_iso, end_iso), cluster_snapshots in time_windows.items():
    timedelta_snapshots.append(TimedeltaSnapshot(
      timedelta= time_delta,
      time_window_start = start_iso,
      time_window_end = end_iso,
      snapshots = cluster_snapshots
    ))
  
  return timedelta_snapshots

def compute_snapshots(reports, labels):
  clusters = {}
  for i, (report, label) in enumerate(zip(reports, labels)):
      if label != -1:
          if label not in clusters:
              clusters[label] = {"ids": [], "lat": [], "lon": [], "symptoms": []}
          clusters[label]["ids"].append(report["id"])
          clusters[label]["lat"].append(report["lat"])
          clusters[label]["lon"].append(report["lon"])
          clusters[label]["symptoms"].append(report["symptoms"])

  snapshots = []
  for label, data in clusters.items():
      centroid = supabase.rpc("get_centroid", {"report_ids": data["ids"]}).execute().data[0]

      embeddings = np.array([ decode_embedding(r["embedding"]) for r in reports if r["id"] in data["ids"] ])

      avg_embedding = np.mean(embeddings, axis=0).tolist()

      # Aggregate common symptoms
      symptom_sets = [set(r["symptoms"]) for r in reports if r["id"] in data["ids"]]
      common_symptoms = list(symptom_sets[0].intersection(*symptom_sets[1:]))

      snapshots.append(ClusterSnapshot(
          cluster_id = f"temp_{label}",
          centroid = [centroid["y"], centroid["x"]],
          common_symptoms = common_symptoms,
          report_ids = data["ids"],
          avg_embedding = avg_embedding
      ))

  return snapshots