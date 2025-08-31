import os
from google.protobuf.json_format import MessageToDict
from supabase import create_client, Client

from generated import reading_pb2

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

def fetch_reports(time: int, similarity: str | list[str] | None) -> list:
    # Fetch reports from the database.
    # If no time is specified, filter for timestamps within 24h. Else, filter timestamps within the specified number of hours.
    time = time if time else 24

    query = supabase.table("reports").select("*")
    query = query.filter("timestamp", "gte", supabase.rpc("date_trunc", "hour", supabase.rpc("now") - supabase.rpc("interval", f"{time} hours")))

    # Filter by similarity if provided.
    # The similarity can either be the inferred cause, a symptom or a list of symptoms.
    # Helper to build the "or" filter
    or_filter = None
    if similarity:
        if isinstance(similarity, str):
            or_filter = f"cause.eq.{similarity},symptoms.cs.{{{similarity}}}"
        elif isinstance(similarity, list):
            # cause contained in similarity OR symptoms JSON has any key in similarity
            # For 'cs' you need a JSON-style array of keys
            keys_json = "{" + ",".join(f'"{s}"' for s in similarity) + "}"
            or_filter = f"cause.in.({','.join(similarity)}),symptoms.cs.{keys_json}"

    query = query.or_(or_filter) if or_filter else query

    result = query.execute()
    reports = result.data

    print("Found %d reports" % len(reports))

    return reports

def insert_reading(reading: reading_pb2.Reading) -> bool:
    # Insert the reading into the database.

    response = supabase.table("readings").insert(MessageToDict(reading)).execute()

    if response.status_code == 201:
        print("Successfully inserted reading.")
        return True
    else:
        print("Failed to insert reading:", response.error)
        return False