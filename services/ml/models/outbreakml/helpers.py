from math import radians, sin, cos, sqrt, atan2
import numpy as np

def latlon_to_unit_sphere(lat, lon):
    """
    Convert lat/lon to 3D unit sphere coordinates
    """
    lat_rad = np.radians(lat)
    lon_rad = np.radians(lon)

    x = np.cos(lat_rad) * np.cos(lon_rad)
    y = np.cos(lat_rad) * np.sin(lon_rad)
    z = np.sin(lat_rad)

    return np.array([x, y, z])

def unit_sphere_to_latlon(x, y, z):
    lat = np.degrees(np.arcsin(z))
    lon = np.degrees(np.arctan2(y, x))
    return lat, lon

def geographic_centroid(latitudes, longitudes):
    # Convert all points to 3D Cartesian
    vectors = np.array([latlon_to_unit_sphere(lat, lon)
                        for lat, lon in zip(latitudes, longitudes)])
    # Average the vectors
    avg_vector = vectors.mean(axis=0)
    # Normalize the averaged vector
    avg_vector /= np.linalg.norm(avg_vector)
    # Convert back to lat/lon
    return unit_sphere_to_latlon(*avg_vector)

def km_to_chord_distance(d_km, R=6371):
    return 2 * np.sin(d_km / (2 * R))

def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371000  # Radius of Earth in meters
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat / 2)**2 + cos(lat1) * cos(lat2) * sin(dlon / 2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    distance = R * c
    return distance