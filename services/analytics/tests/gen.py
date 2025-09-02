import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

import random
import uuid
from datetime import datetime, timedelta, timezone
import json
import matplotlib.pyplot as plt
import numpy as np
from google.protobuf.json_format import MessageToDict
import csv

import clusters
import heatmap

from generated import cluster_pb2, location_pb2, symptom_report_pb2

SYMPTOMS = ["fever", "cough", "headache", "nausea", "fatigue"]
REGIONS = [
    {"name": "North", "lat": -23.55, "lon": -46.63},
    {"name": "South", "lat": -30.03, "lon": -51.23},
    {"name": "East",  "lat": -22.90, "lon": -43.20},
    {"name": "West",  "lat": -19.92, "lon": -43.94}
]
CAUSES = ["flu", "covid", "dengue", "cold", None]

def generate_reports(n=50, days_back=1):
    now = datetime.now(timezone.utc)
    reports = []
    
    for _ in range(n):
        region = random.choice(REGIONS)
        # Random subset of symptoms with severity
        symptoms_dict = {s: random.randint(1, 3) for s in random.sample(SYMPTOMS, k=random.randint(1, 3))}
        report = symptom_report_pb2.SymptomReport(
            user_id="TESTDATA",
            timestamp=(now - timedelta(
                days=random.randint(0, days_back),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )),
            location=location_pb2.Location(
                lat=region["lat"] + random.uniform(-0.05, 0.05),
                lon=region["lon"] + random.uniform(-0.05, 0.05),
            ),
            symptoms=json.dumps(symptoms_dict),
            note=random.choice([None, "Patient reported mild discomfort", "No additional notes"]),
            cause=random.choice(CAUSES)
        )
        reports.append(report)
    
    return reports

def generate_reports_at(n=100, city_lat=-23.351, city_lon=-47.849, cluster_radius_m=500, days_back=1):
    now = datetime.now(timezone.utc)
    reports: list[symptom_report_pb2.SymptomReport] = []

    # Convert radius from meters to degrees
    lat_radius = cluster_radius_m / 111_000
    lon_radius = cluster_radius_m / (111_000 * np.cos(np.radians(city_lat)))

    for _ in range(n):
        lat_offset = np.random.uniform(-lat_radius, lat_radius)
        lon_offset = np.random.uniform(-lon_radius, lon_radius)
        report = symptom_report_pb2.SymptomReport(
            user_id="TESTDATA",
            timestamp=(now - timedelta(
                days=random.randint(0, days_back),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )),
            location=location_pb2.Location(
                lat=city_lat + lat_offset,
                lon=city_lon + lon_offset
            ),
            symptoms={"fever": np.random.randint(1, 4)},
            cause=random.choice(CAUSES)
        )
        reports.append(report)

    return reports

if __name__ == '__main__':
    REGIONS = [
        {"name": "Central Tatuí", "lat": -23.353, "lon": -47.848},
        {"name": "Tatuí North", "lat": -23.340, "lon": -47.848},
        {"name": "Tatuí South", "lat": -23.365, "lon": -47.848},
        {"name": "Tatuí East", "lat": -23.353, "lon": -47.830},
        {"name": "Tatuí West", "lat": -23.353, "lon": -47.865},
        {"name": "Tatuí Industrial Area", "lat": -23.358, "lon": -47.840},
        {"name": "Tatuí Residential Area", "lat": -23.348, "lon": -47.855},
    ]
    reports: list[symptom_report_pb2.SymptomReport] = []

    for region in REGIONS:
        print(f"Generating reports for region {region['name']}")
        reports.extend(generate_reports_at(n=10, city_lat=region['lat'], city_lon=region['lon'], days_back=10))

    # Convert to CSV (user_id, timestamp, lat, lon, symptoms, cause)
    dicts = [
        { 'user_id': r.user_id, 'timestamp': MessageToDict(r)['timestamp'], 'lat': r.location.lat, 'lon': r.location.lon, 'symptoms': json.dumps(MessageToDict(r)['symptoms']), 'cause': r.cause, 'notes': None } for r in reports
    ]
    fieldnames = ["user_id", "timestamp", "lat", "lon", "symptoms", "cause", "notes"]


    with open('testdata.csv', 'w', newline='') as output_file:
        dict_writer = csv.DictWriter(output_file, fieldnames=fieldnames)
        dict_writer.writeheader()
        dict_writer.writerows(dicts)