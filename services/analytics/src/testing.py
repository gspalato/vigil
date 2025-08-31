import random
import uuid
from datetime import datetime, timedelta
import json
import matplotlib.pyplot as plt
import numpy as np

import clusters
import heatmap

from generated import symptom_report_pb2

SYMPTOMS = ["fever", "cough", "headache", "nausea", "fatigue"]
REGIONS = [
    {"name": "North", "lat": -23.55, "lon": -46.63},
    {"name": "South", "lat": -30.03, "lon": -51.23},
    {"name": "East",  "lat": -22.90, "lon": -43.20},
    {"name": "West",  "lat": -19.92, "lon": -43.94}
]
CAUSES = ["flu", "covid", "dengue", "cold", None]

def generate_reports(n=50, days_back=30):
    now = datetime.utcnow()
    reports = []
    
    for _ in range(n):
        region = random.choice(REGIONS)
        # Random subset of symptoms with severity
        symptoms_dict = {s: random.randint(1, 3) for s in random.sample(SYMPTOMS, k=random.randint(1, 3))}
        report = {
            "id": random.randint(1, 1_000_000),
            "user_id": str(uuid.uuid4()),
            "timestamp": (now - timedelta(
                days=random.randint(0, days_back),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )).isoformat(),
            "lat": region["lat"] + random.uniform(-0.05, 0.05),
            "lon": region["lon"] + random.uniform(-0.05, 0.05),
            "symptoms": json.dumps(symptoms_dict),
            "note": random.choice([None, "Patient reported mild discomfort", "No additional notes"]),
            "cause": random.choice(CAUSES)
        }
        reports.append(report)
    
    return reports

def generate_reports_at(n_reports=100, city_lat=-23.351, city_lon=-47.849, cluster_radius_m=500):
    reports: list[symptom_report_pb2.SymptomReport] = []

    # Convert radius from meters to degrees
    lat_radius = cluster_radius_m / 111_000
    lon_radius = cluster_radius_m / (111_000 * np.cos(np.radians(city_lat)))

    for _ in range(n_reports):
        lat_offset = np.random.uniform(-lat_radius, lat_radius)
        lon_offset = np.random.uniform(-lon_radius, lon_radius)
        report = symptom_report_pb2.SymptomReport(
            timestamp=datetime.utcnow(),
            lat=city_lat + lat_offset,
            lon=city_lon + lon_offset,
            symptoms={"fever": np.random.randint(1, 4)},
            cause="flu"
        )
        reports.append(report)

    return reports

def plot_clusters_points(clusters):
    plt.figure(figsize=(8, 6))
    colors = plt.cm.tab20.colors  # Up to 20 distinct colors

    for cluster in clusters:
        cluster_id = cluster["cluster_id"]
        points = cluster["points"]
        coords = np.array([[r['lat'], r['lon']] for r in points])

        # Pick a color (cycling if more than 20 clusters)
        color = colors[cluster_id % len(colors)] if cluster_id != -1 else (0, 0, 0)

        plt.scatter(coords[:, 1], coords[:, 0],  # lon=x, lat=y
                    c=[color],
                    label=f"Cluster {cluster_id}" if cluster_id != -1 else "Noise",
                    s=50,
                    alpha=1 if cluster_id != -1 else 0.2,
                    edgecolor='k')

    plt.xlim(-180, 180)
    plt.ylim(-90, 90)

    plt.xlabel("Longitude")
    plt.ylabel("Latitude")
    plt.legend()
    plt.title("Clusters")
    plt.show()

if __name__ == "__main__":
    REGIONS = [
        {"name": "Central Tatuí", "lat": -23.353, "lon": -47.848},
        {"name": "Tatuí North", "lat": -23.340, "lon": -47.848},
        {"name": "Tatuí South", "lat": -23.365, "lon": -47.848},
        {"name": "Tatuí East", "lat": -23.353, "lon": -47.830},
        {"name": "Tatuí West", "lat": -23.353, "lon": -47.865},
        {"name": "Tatuí Industrial Area", "lat": -23.358, "lon": -47.840},
        {"name": "Tatuí Residential Area", "lat": -23.348, "lon": -47.855},
    ]
    reports = []

    for region in REGIONS:
        print(f"Generating reports for region {region['name']}")
        reports.extend(generate_reports(n=50, days_back=10))

    cl = clusters.calculate_clusters(reports)
    print("Cluster labels:")
    print(*cl)

    plot_clusters_points(cl)

    input()