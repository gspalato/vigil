from dataclasses import dataclass
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
import plotly.graph_objects as go
import pytz
from statsmodels.tsa.vector_ar.var_model import VAR

from models.outbreakml.structures import ClusterSnapshot, PredictedSnapshot

def predict_future_snapshots(snapshots: list[ClusterSnapshot], forecast_steps=1, max_lags=1, min_observations=5):
  """
    Predicts forecast_steps future snapshots based on historical data.

    Args:
        snapshots (list[ClusterSnapshot])
        forecast_steps (float): Number of future steps to predict, in days.
        max_lags (int): Maximum number of lags to consider in VAR model.
        min_observations (int): Minimum number of observations required to fit VAR model.

    Returns:
        list[ClusterSnapshot]
  """

  data = []
  for s in snapshots:
    # Calculate average intensity by summing all symptom intensities from all reports in this snapshot.
    all_symptom_dicts = [ r["symptoms"] for r in s.reports ] # [ { "name": intensity } ]
    all_intensities = [ sum(symptom_dict.values()) for symptom_dict in all_symptom_dicts ]
    avg_intensity = sum(all_intensities) / len(all_intensities)

    data.append({
      "cluster_id": s.cluster_id,
      "time": datetime.fromisoformat(s.time_window_start.replace('Z', '+00:00')),
      "report_count": len(s.report_ids),
      "latitude": s.centroid[1],
      "longitude": s.centroid[0],
      "intensity": avg_intensity,
      "avg_embedding": s.avg_embedding,
      "common_symptoms": s.common_symptoms
    })

  df = pd.DataFrame(data)

  # Group by cluster_id
  clusters = df["cluster_id"].unique()
  predicted_snapshots = []

  # Fit VAR and predict for each cluster
  utc = pytz.UTC
  for cluster_id in clusters:
    cluster_df = df[df["cluster_id"] == cluster_id].set_index("time")

    # Ensure daily continuity with interpolation
    date_range = pd.date_range(start=cluster_df.index.min(), end=cluster_df.index.max(), freq='D')
    cluster_df = cluster_df.reindex(date_range)
    cluster_df[["report_count", "latitude", "longitude", "intensity"]] = cluster_df[["report_count", "latitude", "longitude", "intensity"]].interpolate(method='linear')
    cluster_df["avg_embedding"] = cluster_df["avg_embedding"].ffill()  # Forward fill for embeddings
    cluster_df["common_symptoms"] = cluster_df["common_symptoms"].ffill() # Forward fill for common_symptoms

    # Store last snapshot for fallback
    last_row = cluster_df.iloc[-1] if not cluster_df.empty else None
    last_embedding = cluster_df["avg_embedding"].iloc[-1] if not cluster_df.empty else [0] * 768
    last_common_symptoms = cluster_df["common_symptoms"].iloc[-1] if not cluster_df.empty else {}

    # Fit VAR model, if enough observations
    if len(cluster_df.dropna()) >= min_observations:
      try:
        model = VAR(cluster_df[["report_count", "latitude", "longitude", "intensity"]])
        results = model.fit(maxlags=max_lags, ic='aic')

        # Forecast n days
        forecast = results.forecast(cluster_df[["report_count", "latitude", "longitude", "intensity"]].values, steps=forecast_steps)
        forecast_index = pd.date_range(start=cluster_df.index[-1] + timedelta(days=1), periods=forecast_steps, freq='D')
        forecast_df = pd.DataFrame(forecast, index=forecast_index, columns=["report_count", "latitude", "longitude", "intensity"])

        # Convert to PredictedSnapshot
        for idx, row in forecast_df.iterrows():
          time_start = idx.replace(tzinfo=utc)
          time_end = (idx + timedelta(days=1)).replace(tzinfo=utc)
          predicted_snapshots.append(PredictedSnapshot(
            cluster_id=cluster_id,
            centroid=[row["latitude"], row["longitude"]],
            common_symptoms={"overall": {"intensity": max(0, row["intensity"]), "count": int(max(0, row["report_count"]))}},
            report_count=int(max(0, row["report_count"])),
            intensity=max(0, row["intensity"]),
            avg_embedding=last_embedding,
            time_window_start=time_start.isoformat(),
            time_window_end=time_end.isoformat()
          ))
      except Exception as e:
        print(f"Error fitting VAR for cluster {cluster_id}: {e}.")
    else:
        print(f"Skipping VAR for cluster {cluster_id}: too few observations ({len(cluster_df.dropna())})")
        # Fallback: Use last snapshot values
        if last_row is not None:
          for i in range(1, forecast_steps + 1):
            time_start = (cluster_df.index[-1] + timedelta(days=i)).replace(tzinfo=utc)
            time_end = (time_start + timedelta(days=1)).replace(tzinfo=utc)
            predicted_snapshots.append(PredictedSnapshot(
              cluster_id=cluster_id,
              centroid=[last_row["latitude"], last_row["longitude"]],
              common_symptoms=last_common_symptoms,
              avg_embedding=last_embedding,
              report_count=last_row["report_count"],
              intensity=last_row["intensity"],
              time_window_start=time_start.isoformat(),
              time_window_end=time_end.isoformat()
            ))

  return predicted_snapshots