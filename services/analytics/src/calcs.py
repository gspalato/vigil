import math

import numpy as np
from scipy.spatial import ConvexHull
from shapely.geometry import Point
from shapely.ops import unary_union
from shapely.geometry.polygon import Polygon
from scipy.interpolate import splprep, splev
from pyproj import Transformer

from generated import location_pb2

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000.0  # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def calculate_polygon_area(vertices: np.ndarray) -> float:
    """
    Calculate the area of a polygon using the shoelace formula.
    Vertices should be in order (as returned by ConvexHull).
    """
    if len(vertices) < 3:
        return 0.0
    
    # Shoelace formula
    x = vertices[:, 0]
    y = vertices[:, 1]
    
    area = 0.5 * abs(sum(x[i] * y[i + 1] - x[i + 1] * y[i] 
                        for i in range(-1, len(x) - 1)))
    
    return area

def cluster_area(points: list[location_pb2.Location]):
    """
    Calculate the area of a cluster in km² using the convex hull of lat/lon points.
    
    Uses EPSG:6933 (World Cylindrical Equal Area) projection for accurate area calculation.
    
    Args:
        locations: List of Location objects with lat and lon attributes
        
    Returns:
        Area in square kilometers (km²)
        
    Raises:
        ValueError: If less than 3 points are provided (minimum for area calculation)
    """
    if len(points) < 3:
        raise ValueError("At least 3 points are required to calculate an area")
    
    # Create transformer from WGS84 (EPSG:4326) to World Cylindrical Equal Area (EPSG:6933)
    transformer = Transformer.from_crs("EPSG:4326", "EPSG:6933", always_xy=True)
    
    # Transform lat/lon coordinates to equal area projection (in meters)
    projected_points = []
    for p in points:
        x, y = transformer.transform(p.lon, p.lat)  # Note: lon, lat order for always_xy=True
        projected_points.append([x, y])
    
    projected_points = np.array(projected_points)
    
    # Handle edge case of duplicate points
    unique_points = np.unique(projected_points, axis=0)
    if len(unique_points) < 3:
        raise ValueError("At least 3 unique points are required to calculate an area")
    
    #  Get smoothed convex hull of the points.
    hull_vertices = spline_smooth_cluster_region(unique_points)
    
    # Calculate area using shoelace formula (result in m²)
    area_m2 = calculate_polygon_area(hull_vertices)
    
    # Convert from m² to km²
    area_km2 = area_m2 / 1_000_000

    # Calculate centroid of the hull (geometric centroid of the polygon)
    centroid_x = np.mean(hull_vertices[:, 0])
    centroid_y = np.mean(hull_vertices[:, 1])
    
    # Transform centroid back to lat/lon
    inverse_transformer = Transformer.from_crs("EPSG:6933", "EPSG:4326", always_xy=True)
    centroid_lon, centroid_lat = inverse_transformer.transform(centroid_x, centroid_y)
    centroid_location = location_pb2.Location(lat=centroid_lat, lon=centroid_lon)

    return area_km2, centroid_location

def spline_smooth_cluster_region(points: list[location_pb2.Location], num_points: int = 200) -> list[location_pb2.Location]:
    """
    Given a list of lat/lon points, return a smoothed polygon using spline interpolation.
    
    Args:
        points: List of Location objects with lat and lon attributes
        num_points: Number of points to generate along the smoothed curve
    
    Returns:
        List of Location objects representing the smoothed polygon
    """

    # Create buffered circles around points
    radius_deg = 0.005
    circles = [Point(p.lon, p.lat).buffer(radius_deg) for p in points]
    unioned = unary_union(circles)
    hull: Polygon = unioned.convex_hull

    # Extract hull coordinates
    x, y = hull.exterior.xy
    coords = np.array([x, y])

    # Spline smoothing
    tck, u = splprep(coords, s=0.001, per=True)
    spline_points = splev(np.linspace(0, 1, 200), tck)  # 200 points along curve

    smoothed_locations = [location_pb2.Location(lat=lat, lon=lon) for lon, lat in zip(spline_points[0], spline_points[1])]
    return smoothed_locations