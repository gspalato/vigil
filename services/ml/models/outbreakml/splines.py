import matplotlib.pyplot as plt
import numpy as np
import random
from shapely.geometry import Point
from shapely.ops import unary_union
from matplotlib.patches import Polygon as MplPolygon
from scipy.interpolate import splprep, splev
from scipy.ndimage import gaussian_filter
import math

def compute_hull_spline(snapshot) -> list[float]:
  points = [(r["lat"], r["lon"]) for r in snapshot.reports]

  radius_deg = 0.005
  circles = [Point(lon, lat).buffer(radius_deg) for lat, lon in points]
  unioned = unary_union(circles)
  hull = unioned.convex_hull

  x_hull, y_hull = hull.exterior.xy
  coords = np.array([x_hull, y_hull])
  tck, u = splprep(coords, s=0.001, per=True)
  spline_points = splev(np.linspace(0, 1, 200), tck)

  # Convert (x, y) arrays into list of [x, y] pairs
  return [[float(x), float(y)] for x, y in zip(*spline_points)]

def compute_hull_splines(snapshots):
  splines = []

  for snapshot in snapshots:
    points = [(r["lat"], r["lon"]) for r in snapshot.reports]

    radius_deg = 0.005
    circles = [Point(lon, lat).buffer(radius_deg) for lat, lon in points]
    unioned = unary_union(circles)
    hull = unioned.convex_hull

    x_hull, y_hull = hull.exterior.xy
    coords = np.array([x_hull, y_hull])
    tck, u = splprep(coords, s=0.001, per=True)
    spline_points = splev(np.linspace(0, 1, 200), tck)

    splines.append(spline_points)

  return splines

def compute_predicted_spline(p_snapshot, base_m=300.0, count_scale=120.0, intensity_weight=0.6, max_intensity=5.0, scaler="sqrt", n_points=200):
  """
    Returns an approximation of a predicted cluster snapshot.
    The radius is based on predicted intensity and report count.

    Report count typically grows area like sqrt(count) (area ∝ count → radius ∝ sqrt(count)),
    so we use sqrt(count) rather than linear to avoid huge radius for big counts.

    Intensity should scale the radius multiplicatively:
    a higher intensity increases the effective radius by some fraction.

    Args:
      p_snapshot: PredictedSnapshot
          centroid in degrees
      base_m : float
          minimum radius in meters.
      count_scale : float
          meters per sqrt(count) (or per log depending on scaler).
      intensity_weight : float
          how strongly intensity amplifies radius. 0 => intensity ignored.
      max_intensity : float
          saturation value for intensity normalization.
      scaler : "sqrt" | "log" | "linear"
          how to map report_count to a size factor.
      n_points : int
          number of polygon vertices.
  """


  def meters_to_deg_lat(meters):
    # approx: 1 deg latitude ≈ 111320 meters
    return meters / 111320.0

  def meters_to_deg_lon(meters, lat_deg):
    # 1 deg longitude ≈ 111320 * cos(lat) (meters) at given latitude
    return meters / (111320.0 * math.cos(math.radians(lat_deg)))

  report_count = p_snapshot.report_count
  intensity = p_snapshot.intensity

  lat = p_snapshot.centroid[1]
  lon = p_snapshot.centroid[0]

  # compute count factor
  if report_count <= 0:
    count_factor = 0.0
  else:
    if scaler == "sqrt":
      count_factor = math.sqrt(report_count)
    elif scaler == "log":
      count_factor = math.log1p(report_count)  # log(1+count)
    elif scaler == "linear":
      count_factor = float(report_count)
    else:
      raise ValueError("scaler must be 'sqrt', 'log' or 'linear'")

  # intensity factor normalized 0..1
  intensity_norm = max(0.0, min(float(intensity) / float(max_intensity), 1.0))
  intensity_factor = 1.0 + intensity_weight * intensity_norm

  # radius in meters
  radius_m = float(base_m) + float(count_scale) * count_factor * intensity_factor

  # convert radius to degrees (approx, small radii)
  deg_lat = meters_to_deg_lat(radius_m)
  deg_lon = meters_to_deg_lon(radius_m, lat)

  # build polygon points by sampling angles and offsetting by deg_lon/deg_lat
  angles = np.linspace(0, 2 * math.pi, n_points, endpoint=False)
  lat_coords = []
  lon_coords = []
  for theta in angles:
    dlat = deg_lat * math.sin(theta)
    dlon = deg_lon * math.cos(theta)
    lat_coords.append(lat + dlat)
    lon_coords.append(lon + dlon)

  # close polygon
  lat_coords.append(lat_coords[0])
  lon_coords.append(lon_coords[0])
  return lat_coords, lon_coords