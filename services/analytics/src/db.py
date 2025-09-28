from datetime import datetime, timedelta, timezone
import logging
import os
from google.protobuf.json_format import MessageToDict
import json
from supabase import acreate_client, AsyncClient

from generated import heatmap_pb2, reading_pb2

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
client: AsyncClient = None

async def create_client() -> AsyncClient:
    global client
    if client is None:
        client = await acreate_client(url, key)
    return client

async def fetch_reports(timespan: reading_pb2.ReadingTimespan | None, similarity: str | list[str] | None) -> tuple[list, tuple[datetime, datetime]]:
    # Fetch reports from the database.
    # If no time is specified, filter for timestamps within 24h. Else, filter timestamps within the specified number of hours.
    if timespan is None:
        timespan = reading_pb2.ReadingTimespan.DAY
    time_diff = None
    match timespan:
        case reading_pb2.ReadingTimespan.HOUR:
            time_diff = timedelta(hours=1)
        case reading_pb2.ReadingTimespan.DAY:
            time_diff = timedelta(days=1)
        case reading_pb2.ReadingTimespan.WEEK:
            time_diff = timedelta(weeks=1)
        case reading_pb2.ReadingTimespan.MONTH:
            time_diff = timedelta(days=30)

    now = datetime.now(timezone.utc)

    time_threshold = now - time_diff

    query = client.table("reports").select("*")
    query = query.gte("timestamp", time_threshold.isoformat())

    # Filter by similarity if provided.
    # The similarity can either be the inferred cause, a symptom or a list of symptoms.
    # Helper to build the "or" filter
    or_filter = None

    if similarity:
        if isinstance(similarity, str):
            # Matching a single value
            json_array = json.dumps([similarity])
            or_filter = f"cause.eq.{similarity},symptoms.cs.{json_array}"
        elif isinstance(similarity, list):
            json_array = json.dumps(similarity)
            joined_causes = ",".join(similarity)
            or_filter = f"cause.in.({joined_causes}),symptoms.cs.{json_array}"


    query = query.or_(or_filter) if or_filter else query

    try: 
        result = await query.execute()
        reports = result.data

        logging.debug("Found %d reports" % len(reports))

        return reports, (time_threshold, now)
    except Exception as e:
        logging.error("Error fetching reports:", e)
        return [], (None, None)

async def fetch_heatmap_data(timespan: reading_pb2.ReadingTimespan | None, similarity: list[str] | None) -> list[heatmap_pb2.HeatmapPoint]:
    """
        Fetch heatmap data from the database.
        If no time is defined, fetch the data from the most recent reading.
    """

    query = client.table("readings").select("*")

    if timespan is not None:
        query = query.eq("timespan", reading_pb2.ReadingTimespan.Name(timespan))

    if similarity:
        json_array = json.dumps(similarity)
        query = query.or_(f"symptoms.cs.{json_array}")

    query = query.order("created_at", desc=True).maybe_single()

    try:
        result = await query.execute()
        logging.debug(f"Returned data: {result.data}")

        if result.data == None:
            logging.debug("No readings found matching query.")
            return []

        heatmap_points = result.data.get('heatmap_points', [])
        geojson_str = result.data.get('geojson', None)
        logging.debug("Found %d heatmap points" % len(heatmap_points))

        return (heatmap_points, geojson_str)
    except Exception as e:
        logging.error("Error fetching heatmap:", e)
        return ([], None)

async def insert_reading(reading: reading_pb2.Reading) -> bool:
    # Insert the reading into the database.
    try:
        await client.table("readings").insert(MessageToDict(reading, preserving_proto_field_name=True)).execute()
        logging.debug("Successfully inserted reading.")
        return True
    except Exception as e:
        logging.error("Failed to insert reading:", e)
        return False