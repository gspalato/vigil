
from datetime import datetime
import math
from matplotlib.patches import Polygon as MplPolygon
import numpy as np
import pandas as pd
import plotly.graph_objects as go
import plotly.io as pio
from scipy.interpolate import splprep, splev
from scipy.ndimage import gaussian_filter
from scipy.spatial import ConvexHull
from shapely.geometry import Point, Polygon, LineString, MultiPolygon
from shapely.ops import unary_union
from sklearn.manifold import TSNE

from models.outbreakml.structures import Cluster, TimedeltaSnapshot, ClusterSnapshot, PredictedSnapshot

def compute_hull_spline(snapshot):
  points = [(r["lat"], r["lon"]) for r in snapshot.reports]

  radius_deg = 0.005
  circles = [Point(lon, lat).buffer(radius_deg) for lat, lon in points]
  unioned = unary_union(circles)
  hull = unioned.convex_hull

  x_hull, y_hull = hull.exterior.xy
  coords = np.array([x_hull, y_hull])
  tck, u = splprep(coords, s=0.001, per=True)
  spline_points = splev(np.linspace(0, 1, 200), tck)

  return spline_points

def compute_hull_spline2(snapshot):
    # Extract points
    points = [(r["lat"], r["lon"]) for r in snapshot.reports]
    if len(points) == 0:
        return np.array([[], []])
    
    # Buffer around each point to create small circles
    radius_deg = 0.005
    circles = [Point(lon, lat).buffer(radius_deg) for lat, lon in points]
    unioned = unary_union(circles)

    # Convex hull
    hull = unioned.convex_hull

    # If hull is a LineString (points are collinear), buffer it slightly
    if isinstance(hull, LineString):
        hull = hull.buffer(radius_deg)  # create a thin polygon around the line

    # If hull is a MultiPolygon (disconnected blobs), take the largest
    if isinstance(hull, MultiPolygon):
        hull = max(hull.geoms, key=lambda p: p.area)

    # Get boundary coords
    if isinstance(hull, Polygon):
        x_hull, y_hull = hull.exterior.xy
    else:
        # fallback (unlikely)
        x_hull, y_hull = [], []

    coords = np.array([x_hull, y_hull])
    if coords.shape[1] < 3:
        # not enough points for spline, just return coords
        return coords

    # Smooth spline
    tck, u = splprep(coords, s=0.001, per=True)
    spline_points = splev(np.linspace(0, 1, 200), tck)

    return spline_points


def compute_hull_splines(snapshots, reports):
  splines = []

  for snapshot in snapshots:
    points = [(r["lat"], r["lon"]) for r in reports if r["id"] in snapshot["report_ids"]]

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


def plot_ts(timedelta_snapshots: list[TimedeltaSnapshot]):
    """
    Plot snapshots per time range with a slider.
    """
    
    all_snapshots = []
    
    dates = []
    for ts in timedelta_snapshots:
        start_dt = datetime.fromisoformat(ts.time_window_start.replace("Z", "+00:00"))
        dates.append(start_dt.date())

        all_snapshots.extend(ts.snapshots)

    min_date = min(dates)
    max_date = max(dates)
    
    data = []
    for s in all_snapshots:
      avg_intensity = 0
      if isinstance(s, PredictedSnapshot):
        avg_intensity = s.intensity
      else:
        # Calculate average intensity by summing all symptom intensities from all reports in this snapshot.
        all_symptom_dicts = [ r["symptoms"] for r in s.reports ] # [ { "name": intensity } ]
        all_intensities = [ sum(symptom_dict.values()) for symptom_dict in all_symptom_dicts ]
        avg_intensity = sum(all_intensities) / len(all_intensities)

      start_dt = datetime.fromisoformat(s.time_window_start.replace("Z", "+00:00"))
      end_dt = datetime.fromisoformat(s.time_window_end.replace("Z", "+00:00"))

      start_date = start_dt.date()
      end_date = end_dt.date()

      data.append({
          "cluster_id": s.cluster_id,
          "latitude": s.centroid[1],  # lat
          "longitude": s.centroid[0],  # lon
          "report_count": s.report_count,
          "intensity": avg_intensity,
          "time_window_start": start_date,
          "time_window_end": end_date,
          "geojson_spline": compute_hull_spline2(s) if isinstance(s, ClusterSnapshot) else compute_predicted_spline(s),
          "predicted": isinstance(s, PredictedSnapshot)
      })

    df = pd.DataFrame(data)
    df['time_window_start'] = pd.to_datetime(df['time_window_start'])

    min_date = df["time_window_start"].min()
    max_date = df["time_window_start"].max()
    all_dates = pd.date_range(min_date, max_date, freq="D")

    # Carry forward last known snapshot for missing dates per cluster
    filled_rows = []
    last_seen = {}  # cluster_id -> last row dict

    for date in all_dates:
        df_date = df[df['time_window_start'] == date]
        if df_date.empty:
            # fill with last seen rows
            for cluster_id, row in last_seen.items():
                new_row = row.copy()
                new_row['time_window_start'] = date
                filled_rows.append(new_row)
        else:
            for _, row in df_date.iterrows():
                last_seen[row['cluster_id']] = row
                filled_rows.append(row)

    # Rebuild dataframe with missing dates inserted
    df = pd.DataFrame(filled_rows)

    # Create Plotly map with slider
    fig = go.Figure()

    # Group by date for slider
    dates = sorted(df["time_window_start"].unique())

    # Add traces for each date
    for date in dates:
        df_date = df[df["time_window_start"] == date]

        # --- polygon traces ---
        for _, row in df_date.iterrows():
            lon_spline, lat_spline = row["geojson_spline"]
            coords_lon, coords_lat = list(lon_spline), list(lat_spline)

            # close polygon if needed
            if coords_lon[0] != coords_lon[-1] or coords_lat[0] != coords_lat[-1]:
                coords_lon.append(coords_lon[0])
                coords_lat.append(coords_lat[0])

            linecolor = "orange" if row['predicted'] else "blue"
            fillcolor = "rgba(255,69,0,0.2)" if row['predicted'] else "rgba(0,0,255,0.2)"

            fig.add_trace(
                go.Scattermapbox(
                lon=coords_lon,
                lat=coords_lat,
                mode="lines",
                fill="toself",
                line=dict(color=linecolor),
                fillcolor=fillcolor,
                text=f"{row['cluster_id']}<br>Reports: {row['report_count']}<br>Average intensity: {row['intensity']}",
                hoverinfo="text",
                visible=False
                )
            )

    # Set first date visible
    fig.data[0].visible = True

    # Create slider steps
    steps = []
    trace_offset = 0
    for date in dates:
        df_date = df[df["time_window_start"] == date]
        n_traces_for_date = len(df_date)  # only polygons now

        step = dict(
        method="update",
        args=[{"visible": [False] * len(fig.data)},
                {"title": f"Outbreak Hotspots: {date.strftime("%Y-%m-%d")}"}],
        label=date.strftime("%Y-%m-%d")
        )

        # enable only this block of traces
        for j in range(trace_offset, trace_offset + n_traces_for_date):
            step["args"][0]["visible"][j] = True

        steps.append(step)
        trace_offset += n_traces_for_date

    sliders = [dict(
        active=0,
        currentvalue={"prefix": "Date: "},
        steps=steps
    )]


    # Update layout
    fig.update_layout(
        title="Outbreak hotspots",
        mapbox=dict(
            style="open-street-map",  # Free base map
            center=dict(lat=-23.361, lon=-47.863),  # São Paulo
            zoom=8  # ~100km radius
        ),
        sliders=sliders,
        showlegend=False,
        height=600
    )

    # Show plot
    fig.show()

def plot(snapshots: list[ClusterSnapshot]) -> None:
    """
        Plot snapshots per time range with a slider.
    """

    snapshots = sorted(snapshots, key=lambda s: s.time_window_start)

    start_dt = snapshots[0].time_window_start
    end_dt = snapshots[-1].time_window_end

    data = []
    for s in snapshots:
        avg_intensity = 0
        if isinstance(s, PredictedSnapshot):
            avg_intensity = s.intensity
        else:
            # Calculate average intensity by summing all symptom intensities from all reports in this snapshot.
            all_symptom_dicts = [ r["symptoms"] for r in s.reports ] # [ { "name": intensity } ]
            all_intensities = [ sum(symptom_dict.values()) for symptom_dict in all_symptom_dicts ]
            avg_intensity = sum(all_intensities) / len(all_intensities)

        start_dt = datetime.fromisoformat(s.time_window_start.replace("Z", "+00:00"))
        end_dt = datetime.fromisoformat(s.time_window_end.replace("Z", "+00:00"))

        start_date = start_dt.date()
        end_date = end_dt.date()

        data.append({
            "cluster_id": s.cluster_id,
            "latitude": s.centroid[1],  # lat
            "longitude": s.centroid[0],  # lon
            "report_count": s.report_count,
            "intensity": avg_intensity,
            "time_window_start": start_date,
            "time_window_end": end_date,
            "geojson_spline": compute_hull_spline2(s) if isinstance(s, ClusterSnapshot) else compute_predicted_spline(s),
            "predicted": isinstance(s, PredictedSnapshot),
            "reports": s.reports if isinstance(s, ClusterSnapshot) else []
        })

    df = pd.DataFrame(data)
    df['time_window_start'] = pd.to_datetime(df['time_window_start'])

    min_date = df["time_window_start"].min()
    max_date = df["time_window_start"].max()
    all_dates = pd.date_range(min_date, max_date, freq="D")

    # Carry forward last known snapshot for missing dates per cluster
    filled_rows = []
    last_seen = {}  # cluster_id -> last row dict

    for date in all_dates:
        df_date = df[df['time_window_start'] == date]
        if df_date.empty:
            # fill with last seen rows
            for cluster_id, row in last_seen.items():
                new_row = row.copy()
                new_row['time_window_start'] = date
                filled_rows.append(new_row)
        else:
            for _, row in df_date.iterrows():
                last_seen[row['cluster_id']] = row
                filled_rows.append(row)

    # Rebuild dataframe with missing dates inserted
    df = pd.DataFrame(filled_rows)

    # Create Plotly map with slider
    fig = go.Figure()

    # Group by date for slider
    dates = sorted(df["time_window_start"].unique())

    # Add traces for each date
    for date in dates:
        df_date = df[df["time_window_start"] == date]

        # --- polygon traces ---
        for _, row in df_date.iterrows():
            lon_spline, lat_spline = row["geojson_spline"]
            coords_lon, coords_lat = list(lon_spline), list(lat_spline)

            # close polygon if needed
            if coords_lon[0] != coords_lon[-1]:
                coords_lon.append(coords_lon[0])
            if coords_lat[0] != coords_lat[-1]:
                coords_lat.append(coords_lat[0])

            linecolor = "orange" if row['predicted'] else "blue"
            fillcolor = "rgba(255,69,0,0.2)" if row['predicted'] else "rgba(0,0,255,0.2)"

            fig.add_trace(
                go.Scattermapbox(
                    lon=coords_lon,
                    lat=coords_lat,
                    mode="lines",
                    fill="toself",
                    line=dict(color=linecolor),
                    fillcolor=fillcolor,
                    text=f"{row['cluster_id']}<br>Reports: {row['report_count']}<br>Average intensity: {row['intensity']}",
                    hoverinfo="text",
                    visible=False
                )
            )
            
        # --- point traces (reports) ---
        for _, row in df_date.iterrows():
            report_lons = [r['lon'] for r in row['reports']]
            report_lats = [r['lat'] for r in row['reports']]

            fig.add_trace(
                go.Scattermapbox(
                    lon=report_lons,
                    lat=report_lats,
                    mode="markers",
                    marker=dict(size=6, color="red"),
                    text=[f"{r['summary']}" for r in row['reports']],  # or some text per report
                    hoverinfo="text",
                    visible=False
                )
            )

    # Set first date visible
    fig.data[0].visible = True

    # Create slider steps
    steps = []
    trace_offset = 0
    for date in dates:
        df_date = df[df["time_window_start"] == date]
        n_traces_for_date = len(df_date)  # only polygons now

        step = dict(
        method="update",
        args=[{"visible": [False] * len(fig.data)},
                {"title": f"Outbreak Hotspots: {date.strftime("%Y-%m-%d")}"}],
        label=date.strftime("%Y-%m-%d")
        )

        # enable only this block of traces
        for j in range(trace_offset, trace_offset + n_traces_for_date):
            step["args"][0]["visible"][j] = True

        steps.append(step)
        trace_offset += n_traces_for_date

    sliders = [dict(
        active=0,
        currentvalue={"prefix": "Date: "},
        steps=steps
    )]


    # Update layout
    fig.update_layout(
        title="Outbreak hotspots",
        mapbox=dict(
            style="open-street-map",  # Free base map
            center=dict(lat=-23.361, lon=-47.863),  # São Paulo
            zoom=8  # ~100km radius
        ),
        sliders=sliders,
        showlegend=False,
        height=600
    )

    # Show plot
    fig.show()


def plot_tsne_embeddings(reports, labels, perplexity=30, max_iter=1000, max_lines_per_cluster=10, max_inter_cluster_lines=50):
    """
    Visualize clustered 768D embeddings in 3D using t-SNE.

    Args:
        reports: List of report dicts with 'embedding' and 'symptoms'.
        labels: DBSCAN cluster labels (array-like).
        perplexity: t-SNE perplexity (default 30).
        max_iter: t-SNE iterations (default 1000).
        max_lines_per_cluster: Maximum lines per cluster (default 10).
        max_inter_cluster_lines: Maximum inter-cluster lines (default 50).

    Returns:
        Plotly figure object.
    """

    from colorhash import ColorHash

    def haversine(lat1, lon1, lat2, lon2):
      """
      Calculate the geographic distance between two points in meters using the Haversine formula.

      Args:
          lat1, lon1: Latitude and longitude of first point (degrees).
          lat2, lon2: Latitude and longitude of second point (degrees).

      Returns:
          Distance in meters.
      """

      import math

      R = 6371000  # Earth's radius in meters
      lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
      dlat = lat2 - lat1
      dlon = lon2 - lon1
      a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
      c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
      return R * c

    # Extract embeddings
    embeddings = []
    valid_reports = []
    valid_labels = []
    for report, label in zip(reports, labels):
        emb = decode_embedding(report["embedding"]) if isinstance(report["embedding"], str) else report["embedding"]
        if emb is None or len(emb) != 768 or not all(isinstance(x, (int, float)) for x in emb):
            print(f"Skipping report {report.get('id')}: Invalid embedding")
            continue
        embeddings.append(emb)
        valid_reports.append(report)
        valid_labels.append(label)

    if not embeddings:
        print("No valid embeddings for visualization")
        return None

    embeddings = np.array(embeddings, dtype=np.float64)

    # Apply t-SNE
    tsne = TSNE(n_components=3, perplexity=min(perplexity, len(embeddings)-1), max_iter=max_iter, random_state=42)
    embeddings_3d = tsne.fit_transform(embeddings)

    # Prepare data for plotting
    x, y, z = embeddings_3d[:, 0], embeddings_3d[:, 1], embeddings_3d[:, 2]

    colors = []
    hover_texts = []
    color_map = {}
    for label in valid_labels:
      if label == -1:
        color_map[label] = "black"
      else:
        color_map[label] = tuple(np.random.random(size=3) * 256)

    for idx, (report, label) in enumerate(zip(valid_reports, valid_labels)):
      color = color_map[label]
      colors.append(color)
      hover_text = f"Noise @ {report['lat'], report['lon']}: {report.get('summary', 'No summary')}" if label == -1 else \
                   f"Cluster {label} @ {report['lat'], report['lon']}: {report.get('summary', 'No summary')}"
      hover_texts.append(hover_text)

    """
    colors = [
      'black'
      if l == -1 else f"rgb({np.random.randint(0,255)},{np.random.randint(0,255)},{np.random.randint(0,255)})"
      for l in valid_labels
    ]

    hover_texts = [
      f"Cluster {l} @ ({r["lat"]:.4f},{r["lon"]:.4f})<br>Summary: {r["summary"] or 'N/A'}"
      if l != -1 else f"Noise @ ({r["lat"]:.4f},{r.lon:.4f})<br>Summary: {r["summary"] or 'N/A'}"
      for r, l in zip(valid_reports, valid_labels)
    ]
    """

    # Create 3D scatter plot
    fig = go.Figure(data=[go.Scatter3d(
        x=x,
        y=y,
        z=z,
        mode='markers',
        marker=dict(size=5, color=colors),
        text=hover_texts,
        hoverinfo='text'
    )])

    # Draw intra-cluster lines
    from itertools import combinations
    cluster_indices = {}
    for idx, l in enumerate(valid_labels):
      if l != -1:
        cluster_indices.setdefault(l, []).append(idx)

    for label, indices in cluster_indices.items():
      for i, j in list(combinations(indices, 2))[:max_lines_per_cluster]:
        r1, r2 = valid_reports[i], valid_reports[j]
        ts1, ts2 = datetime.fromisoformat(r1["timestamp"]), datetime.fromisoformat(r2["timestamp"])
        t_diff = ts2 - ts1
        hover = (
          f"Intra-cluster {label}<br>"
          f"Distance: {haversine(r1['lat'], r1['lon'], r2['lat'], r2['lon']):.1f} m<br>"
          f"Time distance: {str(t_diff)}"
          f"Reports: {r1['id']} & {r2['id']}"
        )

        fig.add_trace(go.Scatter3d(
            x=[x[i], x[j]],
            y=[y[i], y[j]],
            z=[z[i], z[j]],
            mode='lines',
            line=dict(color='blue', width=3),
            text=[hover, hover],
            hoverinfo='text'
        ))

    # Draw some inter-cluster lines (optional)
    inter_cluster_pairs = list(combinations(range(len(valid_reports)), 2))
    np.random.shuffle(inter_cluster_pairs)
    for i,j in inter_cluster_pairs[:max_inter_cluster_lines]:
      if valid_labels[i] == valid_labels[j]:  # skip same cluster
        continue

      r1, r2 = valid_reports[i], valid_reports[j]
      ts1, ts2 = datetime.fromisoformat(r1["timestamp"]), datetime.fromisoformat(r2["timestamp"])
      t_diff = ts2 - ts1

      hover = (
        f"Inter-cluster {valid_labels[i]}-{valid_labels[j]}<br>"
        f"Distance: {haversine(r1['lat'],r1['lon'],r2['lat'],r2['lon']):.1f} m<br>"
        f"Time distance: {str(t_diff)}"
        f"Reports: {r1['id']} & {r2['id']}"
      )

      fig.add_trace(go.Scatter3d(
          x=[x[i], x[j]],
          y=[y[i], y[j]],
          z=[z[i], z[j]],
          mode='lines',
          line=dict(color='red', width=1),
          text=[hover, hover],
          hoverinfo='text'
      ))

    fig.update_layout(
        title="3D t-SNE Visualization of Symptom Embeddings",
        scene=dict(xaxis_title="t-SNE 1", yaxis_title="t-SNE 2", zaxis_title="t-SNE 3"),
        width=1000,
        height=800
    )

    fig.show()

    return fig