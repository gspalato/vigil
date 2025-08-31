import random
import numpy as np
from shapely.geometry import Point, Polygon
from scipy.spatial import ConvexHull

from generated import heatmap_pb2, location_pb2

def generate_heatmap_points_for_cluster(cluster_points, max_points=10) -> list[heatmap_pb2.HeatmapPoint]:
    """
    Generate a small number of heatmap points that approximate the shape of the cluster,
    with automatically calculated intensity and radius.
    
    Args:
        cluster_points: list of dicts with 'lat' and 'lon'
        max_points: maximum number of heat points for the cluster
    Returns:
        List of dicts: { location: {lat, lon}, intensity, radius }
    """
    n_reports = len(cluster_points)
    points = np.array([[r['lat'], r['lon']] for r in cluster_points])
    
    # Compute cluster extent
    lat_min, lon_min = points.min(axis=0)
    lat_max, lon_max = points.max(axis=0)
    lat_range = lat_max - lat_min
    lon_range = lon_max - lon_min

    # Define polygon around cluster (convex hull)
    if len(points) >= 3:
        hull = ConvexHull(points)
        polygon = Polygon(points[hull.vertices])
        cluster_area = polygon.area
    else:
        polygon = None
        cluster_area = lat_range * lon_range  # fallback for tiny clusters

    # Automatically calculate radius and intensity
    # Larger clusters → bigger radius, more reports → higher intensity
    radius = max(lat_range, lon_range) * 50000  # rough scaling factor to meters for heatmap
    intensity = 1 # n_reports / max_points  # normalize to approx number of points

    heatmap_points = []

    for _ in range(min(max_points, n_reports)):
        # Pick a random report as a center
        r = random.choice(cluster_points)
        lat = r['lat']
        lon = r['lon']

        # Small random offset to approximate shape
        lat_offset = random.uniform(-lat_range * 0.2, lat_range * 0.2)
        lon_offset = random.uniform(-lon_range * 0.2, lon_range * 0.2)
        candidate_lat = lat + lat_offset
        candidate_lon = lon + lon_offset

        # Only keep points inside polygon if exists
        if polygon and not polygon.contains(Point(candidate_lat, candidate_lon)):
            continue

        heatmap_points.append(heatmap_pb2.HeatmapPoint(
            location=location_pb2.Location(lat=candidate_lat, lon=candidate_lon),
            intensity=intensity,
            radius=radius
        ))

    return heatmap_points

def cluster_to_polygon(cluster_points):
    """
    Returns a list of lat/lon points representing the convex hull of a cluster.
    """
    if len(cluster_points) < 3:
        # Not enough points for a polygon; just return the points themselves
        return [(r['lat'], r['lon']) for r in cluster_points]

    points = np.array([[r['lat'], r['lon']] for r in cluster_points])
    hull = ConvexHull(points)
    polygon_points = [(points[v][0], points[v][1]) for v in hull.vertices]
    
    # Optional: close the polygon by repeating the first point
    polygon_points.append(polygon_points[0])
    return polygon_points
