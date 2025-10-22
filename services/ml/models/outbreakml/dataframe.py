import pandas as pd
import json

def prepare_report_dataframe(reports):
    """
    Prepare a pandas DataFrame from a list of report dictionaries.
    
    Args:
        reports (list): List of dicts with id, lat, lon, symptoms, embedding, utm_x, utm_y.

    Returns:
        pd.DataFrame: A DataFrame containing the report data.
    """
    df = pd.DataFrame(reports)

    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df['date'] = df['timestamp'].dt.date
    df['time'] = df['timestamp'].dt.time
    df['embedding'] = df['embedding'].apply(json.loads) # Convert JSON string to list

    return df

