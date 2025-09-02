import sys

import asyncio
from datetime import datetime, timezone
import logging
import grpc
from grpc_reflection.v1alpha import reflection

import db
import clusters
import heatmap
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

    async def CalculateReading(
        self,
        request: analytics_service_pb2.CalculateReadingRequest,
        context: grpc.aio.ServicerContext,
    ) -> analytics_service_pb2.CalculateReadingResponse:
        # Fetch reports
        time = request.time
        similarity = request.similarity if isinstance(request.similarity, str) or (isinstance(request.similarity, list) and len(request.similarity) > 0) else None

        reports = await db.fetch_reports(time=time, similarity=similarity)

        if len(reports) == 0:
            logging.debug("No reports found matching query.")
            return analytics_service_pb2.CalculateReadingResponse(success=False, error="No reports found matching query.")
        elif len(reports) > 0:
            logging.debug(f"Processing {len(reports)} reports:\n{reports}")

        cls: list[cluster_pb2.Cluster] = clusters.calculate_clusters(reports)
        heatmap_points: list[heatmap_pb2.HeatmapPoint] = []
        for cluster in cls:
            heatmap_points += heatmap.generate_heatmap_points_for_cluster(cluster.points)

        reading = reading_pb2.Reading(
            created_at=datetime.now(timezone.utc),
            heatmap_points=heatmap_points,
            clusters=cls,
            time=time,
            similarity=similarity
        )

        # Push reading to database.
        success = await db.insert_reading(reading)

        return analytics_service_pb2.CalculateReadingResponse(
            success=success,
            reading=reading if success else None,
            error=None if success else "Failed to insert reading into database."
        )

    async def FetchHeatmap(
        self,
        request: analytics_service_pb2.FetchHeatmapRequest,
        context: grpc.aio.ServicerContext,
    ) -> analytics_service_pb2.FetchHeatmapResponse:
        """
            Fetches the heatmap data for the specified time and similarity.
            If no time is specified, fetches the heatmap from the most recent reading.
            If no similarity is specified, fetches the general incidence of symptoms.
        """

        points = await db.fetch_heatmap(
            time=request.time,
            similarity=request.similarity
        )

        if not points:
            logging.debug("No heatmap points found.")
            return analytics_service_pb2.FetchHeatmapResponse(heatmapPoints=[])

        return analytics_service_pb2.FetchHeatmapResponse(
            heatmapPoints=points
        );


async def serve() -> None:
    await db.create_client()

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
    logging.basicConfig(level=logging.DEBUG)
    asyncio.run(serve())