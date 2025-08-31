import asyncio
from datetime import datetime
import logging
import grpc
from grpc_reflection.v1alpha import reflection

import db
import clusters
import heatmap
import testing
import llm

from generated import analytics_service_pb2, analytics_service_pb2_grpc, cluster_pb2, heatmap_pb2, reading_pb2


class AnalyticsService(analytics_service_pb2_grpc.AnalyticsService):
    async def InferSymptomsAndCause(
        self,
        request: analytics_service_pb2.InferSymptomsAndCauseRequest,
        context: grpc.aio.ServicerContext,
    ) -> analytics_service_pb2.InferSymptomsAndCauseResponse:
        # Implement your logic here
        inferred = llm.infer_symptoms_and_cause(request.text)
        return analytics_service_pb2.InferSymptomsAndCauseResponse(
            symptoms=inferred.symptoms,
            cause=inferred.cause,
            success=inferred.success
        )

    async def CalculateClusters(
        self,
        request: analytics_service_pb2.CalculateClustersRequest,
        context: grpc.aio.ServicerContext,
    ) -> analytics_service_pb2.CalculateClustersResponse:
        # First generate unsimilar disease clusters. (Similarity = null)
        
        # Fetch reports
        time = request.time
        similarity = request.similarity if isinstance(similarity, str) or (isinstance(similarity, list) and len(similarity) > 0) else None

        result = await db.fetch_reports(time=time, similarity=similarity)
        reports = result.data
        print("Fetched %d reports:" % len(reports))
        print(*reports, sep="\n")

        clusters: list[cluster_pb2.Cluster] = clusters.calculate_clusters(reports)
        heatmap_points: list[heatmap_pb2.HeatmapPoint] = []
        for cluster in clusters:
            heatmap_points = heatmap_points.extend(heatmap.generate_heatmap_points_for_cluster(cluster))

        reading = reading_pb2.Reading(
            created_at=datetime.now(datetime.timezone.utc),
            heatmap_points=heatmap_points,
            clusters=clusters,
            time=time,
            similarity=similarity
        ),

        # Push reading to database.
        success = await db.insert_reading(reading)

        return analytics_service_pb2.CalculateReadingResponse(success=success)

    async def FetchHeatmap(
        self,
        request: analytics_service_pb2.FetchHeatmapRequest,
        context: grpc.aio.ServicerContext,
    ) -> analytics_service_pb2.FetchHeatmapResponse:
        

        pass


async def serve() -> None:
    server = grpc.aio.server()
    analytics_service_pb2_grpc.add_AnalyticsServiceServicer_to_server(AnalyticsService(), server)

    # Enable gRPC reflection (especially for debugging).
    SERVICE_NAMES = (
        analytics_service_pb2.DESCRIPTOR.services_by_name["AnalyticsService"].full_name,
        reflection.SERVICE_NAME,
    )
    reflection.enable_server_reflection(SERVICE_NAMES, server)

    listen_addr = "[::]:50051"
    server.add_insecure_port(listen_addr)
    logging.info("Starting server on %s", listen_addr)
    await server.start()
    await server.wait_for_termination()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(serve())