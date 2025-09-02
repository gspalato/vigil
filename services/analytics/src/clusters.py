import logging
import numpy as np
from sklearn import metrics
from sklearn.cluster import DBSCAN
from google.protobuf.json_format import ParseDict
from collections import defaultdict
import uuid

import calcs

from generated import cluster_pb2, location_pb2

# Find clusters of reports based on location, time and similarity.
def calculate_clusters(reports: list) -> list[cluster_pb2.Cluster]:
    # Use DBSCAN to group clusters of reports.
    coords = np.array([ [r['lat'], r['lon']] for r in reports ])
    coords_rad = np.radians(coords)

    # Use epsilon as 500m to check for incidences in neighborhoods.
    eps_m = 500.0

    # Convert to radians
    earth_radius_m = 6_378_000
    eps_rad = eps_m / earth_radius_m

    dbscan = DBSCAN(eps=eps_rad, min_samples=3, metric="haversine").fit(coords_rad)
    labels = dbscan.labels_
    logging.debug(labels)

    # Number of clusters in labels, ignoring noise if present.
    n_clusters_ = len(set(labels)) - (1 if -1 in labels else 0)
    n_noise_ = list(labels).count(-1)

    logging.debug("Estimated number of clusters: %d" % n_clusters_)
    logging.debug("Estimated number of noise points: %d" % n_noise_)

    # Group reports by cluster
    clusters_dict = defaultdict(list)
    for report, label in zip(reports, labels):
        clusters_dict[label].append(report)
    
    # Convert to list of dicts
    clusters: list[cluster_pb2.Cluster] = []
    for cid, rls in clusters_dict.items():
        points = [location_pb2.Location(lat=rl['lat'], lon=rl['lon']) for rl in rls]
        (radius, (centroid_lat, centroid_lon)) = calcs.cluster_radius_max(points)
        density = calcs.cluster_density(len(rls), radius)
        centroid = location_pb2.Location(
            lat=centroid_lat,
            lon=centroid_lon
        )

        clusters.append(
            cluster_pb2.Cluster(
                cluster_id=str(uuid.uuid4()),
                points=points,
                centroid=centroid,
                radius=radius,
                density=density,
                is_noise=(cid == -1)
            )
        )

    return clusters