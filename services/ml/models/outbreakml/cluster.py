import numpy as np
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics.pairwise import cosine_similarity
from scipy.spatial.distance import cosine
from datetime import datetime
from typing import Dict, List, Tuple

from common.db import supabase

from models.outbreakml.embeddings import decode_embedding
from models.outbreakml.helpers import haversine_distance
from models.outbreakml.cluster_id_manager import ClusterIDManager


def create_feature_matrix(reports):
  """
  Create a feature matrix for clustering from reports.

  Args:
      reports (list): List of dicts with id, lat, lon, symptoms, embedding, utm_x, utm_y.

  Returns:
      tuple: (feature_matrix, scaler, report_ids)
          - feature_matrix: 2D NumPy array [n_reports, 2 + 768]
          - scaler: MinMaxScaler for UTM coordinates
          - report_ids: List of report IDs
  """

  utm_x = np.array([r["utm_x"] for r in reports])
  utm_y = np.array([r["utm_y"] for r in reports])

  embeddings = []
  for r in reports:
    embedding_str = r["embedding"]
    embeddings.append(decode_embedding(embedding_str) if isinstance(embedding_str, str) else embedding_str)

  embeddings = np.array(embeddings, dtype=np.float64)


  # Normalize UTM coords to [0,1]
  scaler = MinMaxScaler()
  coords = scaler.fit_transform(np.vstack([utm_x, utm_y]).T)  # Shape: [n_reports, 2]

  # Compute the range of each feature type and scale them for comparable distances.
  spatial_range = np.ptp(coords, axis=0).mean()  # average span in normalized units
  embedding_range = np.ptp(embeddings, axis=0).mean()
  weight = spatial_range / embedding_range  # scale embeddings to match spatial scale
  weighted_embeddings = embeddings * weight

  # Weight embeddings to balance with spatial (tune 0.001 for meters scale)
  """
  weighted_embeddings = embeddings * 0.001
  """

  # Combine into feature matrix
  feature_matrix = np.hstack([coords, weighted_embeddings])  # Shape: [n_reports, 2 + 768]
  return feature_matrix, scaler, [r["id"] for r in reports]


def cluster_reports(features, scaler, report_ids, eps_meters=5000, min_samples=3):
  """
    Clusters reports based on a feature matrix embedding.

    Args:
      features (list[list[float]]): The feature matrix.
      report_ids: (list[int]): A list of report IDs to include.
      eps_meters: The spatial component in meters to use for grouping.
      min_samples: Minimum amount of reports to form a cluster.
  """

  def sum_custom_metric(x, y):
    """
      A custom metric that uses a weighted sum to define distance.

      Use eps=0.1 * (eps_meters / 1000).
    """

    coord1, emb1 = x[:2], x[2:]
    coord2, emb2 = y[:2], y[2:]
    spatial_dist = np.sqrt(np.sum((coord1 - coord2) ** 2)) * scaler.data_range_[0]  # Denormalize to meters
    cosine_dist = cosine(emb1, emb2)
    return 0.1 * (spatial_dist / 1000) + 0.5 * cosine_dist

  # Define a custom distance metric for DBSCAN
  def rigid_custom_metric(x, y):
      """
        A custom metric that uses a more rigid relationship between the
        embedding similarity and spatial similarity.

        Use eps=1.
      """

      # x and y are 1D arrays: [embedding_dim1, ..., embedding_dimN, lat, lon]
      # Assuming embedding has a fixed dimension (e.g., 768 for typical sentence embeddings)
      # We need to know the embedding dimension to split x and y correctly.
      # Let's assume the embedding dimension is 768 based on common models.
      # If not, we'd need to determine it dynamically from the first embedding.
      embedding_dim = len(x) - 2 # Total length - lat - lon

      embedding_x = x[:embedding_dim]
      embedding_y = y[:embedding_dim]
      lat_x, lon_x = x[embedding_dim], x[embedding_dim + 1]
      lat_y, lon_y = y[embedding_dim], y[embedding_dim + 1]

      # Calculate cosine distance for embeddings (symptom similarity)
      # Add a small epsilon to avoid division by zero if embeddings are all zeros
      cosine_dist = 1 - cosine_similarity(embedding_x.reshape(1, -1), embedding_y.reshape(1, -1))[0][0]

      # Calculate Haversine distance for lat/lon (geographical proximity)
      geo_dist = haversine_distance(lat_x, lon_x, lat_y, lon_y)

      # Combine distances:
      # For location, 5000 meters is the threshold.
      # For symptom similarity, a threshold of 0.5 (meaning 50% dissimilarity) is chosen.
      # The combined distance is the maximum of the two normalized distances.
      # Normalize geo_dist to be in the range [0, 1] where 100m corresponds to 1.
      # So, geo_dist_normalized = geo_dist / 100.
      # The combined distance is the maximum of the two normalized distances.
      # This means that if either the geographical distance is greater than 100m OR the cosine distance is greater than 0.5,
      # the points will be considered too far apart.
      # The `eps` parameter for DBSCAN will then be 1.0.
      return max(geo_dist / 5000, cosine_dist / 0.5)

  db = DBSCAN(eps=0.1 * (eps_meters / 1000), min_samples=min_samples, metric=sum_custom_metric)

  return db.fit_predict(features)


def cluster_reports_with_id_management(
    reports: List[dict], 
    eps_meters: int = 5000, 
    min_samples: int = 3,
    max_time_gap_days: int = 14,
    previous_cluster_mapping: Dict[int, str] = None
) -> Tuple[List[int], Dict[int, str]]:
    """
    Cluster reports with persistent ID management across recalculations.
    
    This function:
    1. Creates clusters using DBSCAN
    2. Maps new clusters to existing cluster IDs based on report overlap
    3. Handles cluster splits while preserving original cluster ID for first segment
    4. Assigns new IDs to newly created clusters
    
    Args:
        reports: List of reports with 'id', 'lat', 'lon', 'timestamp', 'embedding', 'utm_x', 'utm_y'
        eps_meters: Spatial component in meters for DBSCAN
        min_samples: Minimum samples to form a cluster
        max_time_gap_days: Maximum time gap before splitting clusters
        previous_cluster_mapping: Previous mapping of labels to cluster IDs
        
    Returns:
        Tuple of (cluster_labels, cluster_id_mapping)
    """
    # Create feature matrix and cluster
    features, scaler, report_ids = create_feature_matrix(reports)
    labels = cluster_reports(features, scaler, report_ids, eps_meters, min_samples)
    
    # Initialize cluster ID manager
    id_manager = ClusterIDManager()
    
    # Map clusters to existing IDs
    cluster_id_mapping = id_manager.map_clusters_to_existing_ids(
        labels, reports, previous_cluster_mapping
    )
    
    # Handle cluster splits with ID preservation
    final_labels, final_cluster_id_mapping = id_manager.handle_cluster_splits(
        labels, reports, cluster_id_mapping, max_time_gap_days
    )
    
    # Save the mapping for future recalculations
    id_manager.save_cluster_mapping(final_cluster_id_mapping, final_labels, reports)
    
    return final_labels, final_cluster_id_mapping


def split_clusters_through_time(labels, reports, max_time_gap_days=14) -> list[int]:
  """
    Splits clusters if there are large time gaps between reports.

    Args:
      labels (list[int]): Cluster labels from DBSCAN.
      reports (list[dict]): List of reports with 'id' and 'time'
      max_time_gap_days (int): Maximum allowed gap in days before splitting a cluster.

    Returns:
      list[int]: Updated cluster labels with splits applied.
  """

  from collections import defaultdict
  from datetime import datetime, timedelta

  # Map report IDs to their timestamps
  id_to_time = {r['id']: datetime.fromisoformat(r['timestamp'].replace('Z', '+00:00')) for r in reports}

  # Group report times by cluster label
  cluster_times = defaultdict(list)
  for label, report in zip(labels, reports):
    if label != -1:  # Ignore noise points
      cluster_times[label].append(id_to_time[report['id']])

  new_labels = labels.copy()
  next_label = max(labels) + 1 if labels.size > 0 else 0

  for label, times in cluster_times.items():
    times.sort()
    split_indices = []
    for i in range(1, len(times)):
      if (times[i] - times[i - 1]).days > max_time_gap_days:
        split_indices.append(i)

    if split_indices:
      # Split the cluster at the identified indices
      start_idx = 0
      for split_idx in split_indices:
        for i in range(start_idx, split_idx):
          report_id = reports[i]['id']
          report_idx = reports.index(next(r for r in reports if r['id'] == report_id))
          new_labels[report_idx] = next_label
        next_label += 1
        start_idx = split_idx
      # Handle the last segment
      for i in range(start_idx, len(times)):
        report_id = reports[i]['id']
        report_idx = reports.index(next(r for r in reports if r['id'] == report_id))
        new_labels[report_idx] = next_label
      next_label += 1

  return new_labels