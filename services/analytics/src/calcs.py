import math

from generated import location_pb2

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000.0  # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def cluster_radius_max(points: list[location_pb2.Location]):
    n = len(points)
    centroid_lat = sum(p.lat for p in points) / n
    centroid_lon = sum(p.lon for p in points) / n

    distances = [haversine(p.lat, p.lon, centroid_lat, centroid_lon) for p in points]
    return max(distances), (centroid_lat, centroid_lon)


def cluster_density(size, radius_m):
    # area in m²
    area = math.pi * (radius_m ** 2)
    if area == 0:
        return float('inf')  # all reports collapsed at one point
    return size / area