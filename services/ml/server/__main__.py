import json
import logging
from grpc_reflection.v1alpha import reflection
from dotenv import load_dotenv

import argparse
import asyncio
from datetime import datetime, timezone
from functools import partial
import grpc
from pathlib import Path
import pprint
import pytz

# Load the .env file from the project root
env_path = Path(__file__).resolve().parents[1] / '.env'
load_dotenv(dotenv_path=env_path)

import models.outbreakml.db as db
import models.outbreakml.embeddings as embeddings
import models.outbreakml.cluster as cluster
import models.outbreakml.predict as predict
import models.outbreakml.snapshots as snapshots
from models.outbreakml.structures import TimedeltaSnapshot
import models.outbreakml.visualize as visualize

from generated.symptom_report_pb2 import SymptomReport
from generated.ml_service_pb2 import FetchLatestDataRequest, FetchLatestDataResponse, GenerateSnapshotsRequest, GenerateSymptomReportRequest, GenerateSymptomReportResponse, ProcessClustersRequest, ProcessClustersResponse
from generated import ml_service_pb2, ml_service_pb2_grpc

class MLServicer(ml_service_pb2_grpc.MLServiceServicer):
    def GenerateSymptomReport(self,
                         request: GenerateSymptomReportRequest,
                         context: grpc.aio.ServicerContext):
        try:
            partial_symptom_report: SymptomReport = embeddings.infer_symptoms_and_cause(request.text)
        except Exception as e:
            return GenerateSymptomReportRequest(
                success = False,
                error = "Failed to infer symptoms and cause.",
                report = None
            )
        
        summary = embeddings.generate_summary(partial_symptom_report.symptoms, partial_symptom_report.cause)
        
        try:
            embedding = embeddings.generate_embeddings(summary)
        except Exception as e:
            return GenerateSymptomReportRequest(
                success = False,
                error = "Failed to generate embeddings.",
                report = None
            )
            
        
        complete_symptom_report = SymptomReport(
            timestamp = datetime.now(timezone.utc),
            lat = request.lat,
            lon = request.lon,
            summary = summary,
            embedding = embedding,
        )
        
        return GenerateSymptomReportResponse(
            success = True,
            error = None,
            report = complete_symptom_report
        )
    
    
    def ProcessClusters(self,
                        request: ProcessClustersRequest,
                        context: grpc.aio.ServicerContext):  
        # Execute the pipeline for clustering and snapshot generation.
        # Fetch all reports
        reports = db.fetch_all_reports()
        
        # Cluster the reports
        labels, cluster_id_mapping = cluster.cluster_reports_with_id_management(
            reports, 
            eps_meters=5000, 
            min_samples=3, 
            max_time_gap_days=14
        )
        
        print(f"Clustered {len(reports)} reports into {len(set(labels))} clusters.")
        for report_id, label in zip([r['id'] for r in reports], labels):
            cluster_id = cluster_id_mapping.get(label, f"temp_{label}")
            print(f"Report ID: {report_id}, Label: {label}, Cluster ID: {cluster_id}")
        
        # Generate timedelta snapshots
        timedelta_snapshots = snapshots.compute_snapshots_from_clusters(labels, reports, cluster_id_mapping)
        pprint.pprint(timedelta_snapshots)
        
        # Save TimedeltaSnapshots to database with versioning
        run_id = db.save_timedelta_snapshots(
            timedelta_snapshots,
            eps_meters=5000,
            min_samples=3,
            max_time_gap_days=14,
            total_reports=len(reports),
            parameters={"cluster_id_mapping": cluster_id_mapping}
        )   
        
        print(f"\nSaved clustering run {run_id} with {len(timedelta_snapshots)} timedelta snapshots")
        print(f"Total clusters: {sum(len(ts.snapshots) for ts in timedelta_snapshots)}")
        
        return ProcessClustersResponse(
            success = True,
            error = None,
        )
    
    
    def FetchLatestData(self,
                        request: FetchLatestDataRequest,
                        context: grpc.aio.ServicerContext):
       
        try:
            # Fetch the latest TimedeltaSnapshots from the database
            timedelta_snapshots = db.fetch_latest_timedelta_snapshots()
            print("Found timedelta snapshots:")
            print(timedelta_snapshots)
            
            if not timedelta_snapshots:
                return FetchLatestDataResponse(
                    time_window_start=None,
                    time_window_end=None,
                    geojson=None
                )
            
            # Convert TimedeltaSnapshots to GeoJSON
            geojson_data = json.dumps(self._timedelta_snapshots_to_geojson(timedelta_snapshots))
            print(geojson_data)
            
            # Get the time window from the latest snapshot
            latest_snapshot = timedelta_snapshots[0]  # Assuming they're ordered by time
            time_window_start = latest_snapshot.time_window_start
            time_window_end = latest_snapshot.time_window_end
            
            # Convert timestamps to protobuf format
            from google.protobuf.timestamp_pb2 import Timestamp
            from datetime import datetime
            
            start_timestamp = Timestamp()
            end_timestamp = Timestamp()
            
            # Parse ISO format timestamps
            start_dt = datetime.fromisoformat(time_window_start.replace('Z', '+00:00'))
            end_dt = datetime.fromisoformat(time_window_end.replace('Z', '+00:00'))
            
            start_timestamp.FromDatetime(start_dt)
            end_timestamp.FromDatetime(end_dt)
            
            print("Sending FetchLatestDataResponse...")
            return FetchLatestDataResponse(
                time_window_start=start_timestamp,
                time_window_end=end_timestamp,
                geojson=geojson_data
            )
            
        except Exception as e:
            print(f"Error in FetchLatestData: {e}")
            return FetchLatestDataResponse(
                time_window_start=None,
                time_window_end=None,
                geojson=None
            )
    
    def _timedelta_snapshots_to_geojson(self, timedelta_snapshots: TimedeltaSnapshot):
        """Convert TimedeltaSnapshot to GeoJSON format with spline boundaries."""
        from models.outbreakml.splines import compute_hull_spline
        
        features = []
        
        for timedelta_snapshot in timedelta_snapshots:
            for cluster_snapshot in timedelta_snapshot.snapshots:
                # Create spline boundary for the cluster
                try:
                    spline_points = compute_hull_spline(cluster_snapshot)
                    
                    geometry = {
                        "type": "Polygon",
                        "coordinates": spline_points
                    }
                        
                except Exception as e:
                    # Fallback to point if spline computation fails
                    print(f"Warning: Could not compute spline for cluster {cluster_snapshot.cluster_id}: {e}")
                    
                # Create GeoJSON feature for each cluster
                feature = {
                    "type": "Feature",
                    "properties": {
                        "cluster_id": cluster_snapshot.cluster_id,
                        "time_window_start": timedelta_snapshot.time_window_start,
                        "time_window_end": timedelta_snapshot.time_window_end,
                        "timedelta": timedelta_snapshot.timedelta,
                        "report_count": len(cluster_snapshot.report_ids),
                        "common_symptoms": cluster_snapshot.common_symptoms,
                        "centroid": cluster_snapshot.centroid,
                    },
                    "geometry": geometry
                }
                    
                features.append(feature)
        
        return {
            "type": "FeatureCollection",
            "features": features,
            "metadata": {
                "total_clusters": len(features),
                "generated_at": datetime.now(timezone.utc).isoformat()
            }
        }

async def main(args):
    if args.plot:
        reports = db.fetch_all_reports()

        # Use the new cluster ID management system
        labels, cluster_id_mapping = cluster.cluster_reports_with_id_management(
            reports, 
            eps_meters=5000, 
            min_samples=3, 
            max_time_gap_days=14
        )

        print(f"Clustered {len(reports)} reports into {len(set(labels))} clusters.")
        for report_id, label in zip([r['id'] for r in reports], labels):
            cluster_id = cluster_id_mapping.get(label, f"temp_{label}")
            print(f"Report ID: {report_id}, Label: {label}, Cluster ID: {cluster_id}")
            
        timedelta_snapshots = snapshots.compute_snapshots_from_clusters(labels, reports, cluster_id_mapping)
        pprint.pprint(timedelta_snapshots)

        computed_snapshots = [ s for ts in timedelta_snapshots for s in ts.snapshots ]
        predicted_snapshots = predict.predict_future_snapshots(computed_snapshots)
        pprint.pprint(predicted_snapshots)

        all_snapshots = computed_snapshots + predicted_snapshots
        visualize.plot(all_snapshots)
        
        # Save TimedeltaSnapshots to database with versioning
        run_id = db.save_timedelta_snapshots(
            timedelta_snapshots,
            eps_meters=5000,
            min_samples=3,
            max_time_gap_days=14,
            total_reports=len(reports),
            parameters={"cluster_id_mapping": cluster_id_mapping}
        )
        
        # Save predicted snapshots
        db.save_predicted_snapshots(predicted_snapshots, run_id)
        
        print(f"\nSaved clustering run {run_id} with {len(timedelta_snapshots)} timedelta snapshots")
        print(f"Total clusters: {sum(len(ts.snapshots) for ts in timedelta_snapshots)}")
        print(f"Predicted snapshots: {len(predicted_snapshots)}")
        
        return
    
    if args.process:
        res = MLServicer().ProcessClusters(ProcessClustersRequest(), None)
        return
    
    print("Initializing VigilML service...")
    
    server = grpc.aio.server()
    ml_service_pb2_grpc.add_MLServiceServicer_to_server(MLServicer(), server)
    
    # Enable gRPC reflection (especially for debugging).
    SERVICE_NAMES = (
        ml_service_pb2.DESCRIPTOR.services_by_name["MLService"].full_name,
        reflection.SERVICE_NAME,
    )
    reflection.enable_server_reflection(SERVICE_NAMES, server)
    
    listen_addr = "[::]:50051"
    server.add_insecure_port(listen_addr)
    logging.info("Starting server on %s", listen_addr)
    await server.start()
    await server.wait_for_termination()
    
def parse_args():
    parser = argparse.ArgumentParser(description="ML Service")
    
    parser.add_argument('--plot', action='store_true', help='Show a plot of the clusters and snapshots.')
    parser.add_argument('--process', action='store_true', help='Process the clusters and snapshots.')
    
    return parser.parse_args()

if __name__ == "__main__":
    asyncio.run(main(parse_args()))