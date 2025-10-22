import ast
import json
import numpy as np
from google.genai import types

from common.ai import gemini_client
from generated.symptom_report_pb2 import SymptomReport

# Preprocess reports into a symptom summary text for embedding.
intensityLevels = {
    1: "mild",
    2: "moderate",
    3: "severe",
}

def map_intensity(intensity: int) -> str:
  return intensityLevels.get(intensity, "")

def infer_symptoms_and_cause(text: str) -> SymptomReport:
    """Uses Gemini to infer symptoms and their likely cause from free-text input."""
    model = "gemini-2.5-pro"
    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text=text),
            ],
        ),
    ]
    response = gemini_client.models.generate_content(
        model=model,
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=(
                "Infer the reported symptoms from this brief report. "
                "The symptom must not include the adjective describing it (such as severe, high). "
                "The symptom's intensity must only be described as the intensity level from 1-3 (mild, moderate, severe). "
                "Name the most likely disease. The response must always be in English and lowercase. "
                "If you can't infer the symptoms, set success to false. "
                "Return as JSON."
            ),
            response_mime_type="application/json",
            response_schema = {
                "type": "object",
                "properties": {
                    "symptoms": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "name": {"type": "string"},
                                "severity": {"type": "integer"}
                            },
                            "required": ["name", "severity"]
                        }
                    },
                    "cause": {"type": "string"},
                    "success": {"type": "boolean"}
                },
                "required": ["symptoms", "cause", "success"]
            }
        ),
    )

    symptoms_dict = {s["name"]: int(s["severity"]) for s in response.parsed["symptoms"]}
    cause = response.parsed["cause"]
    success = response.parsed["success"]

    inferred = SymptomReport(
        symptoms=symptoms_dict,
        cause=cause,
        success=success
    )

    return inferred



def generate_summary(symptoms: dict[str, int], cause: str):
  """
    Generates a summary based on the symptoms dictionary.

    Args:
      symptoms (dict[str, int]): A dictionary of symptoms with their intensities.

    Returns:
      str: A summary of the symptoms, in the format "intensity symptom, intensity symptom, ...: cause"
  """

  symptoms = sorted(symptoms.items(), key=lambda x: x[0])
  summary = ", ".join([ f"{map_intensity(intensity)} {name}" for (name, intensity) in symptoms ])
  summary = f"{summary}: {cause}"
  return summary

def generate_embeddings(symptoms, cause) -> list[float]:
  summary = generate_summary(symptoms, cause)
  print(f"Generated summary to embed: {summary}")

  # Generate embeddings using Gemini.
  embeddings = [
      np.array(e.values)
      for e in gemini_client.models.embed_content(
        model="gemini-embedding-001",
        contents=[summary],
        config=types.EmbedContentConfig(
          task_type="CLUSTERING",
          output_dimensionality=768
        )
      ).embeddings
  ]

  # Normalize embeddings
  embeddings = embeddings / np.linalg.norm(embeddings)

  return embeddings

def decode_embedding(embedding):
  """Decode a pgvector embedding string to a list of 768 floats."""
  try:
    if not embedding or embedding == '[]':
      raise ValueError("Empty or invalid embedding string")

    emb = json.loads(embedding) #ast.literal_eval(embedding)
    if not isinstance(emb, (list, tuple)) or len(emb) != 768:
      raise ValueError(f"Embedding length is {len(emb)}, expected 768")

    return [float(x) for x in emb]  # Ensure all elements are floats

  except (ValueError, SyntaxError) as e:
    print(f"Failed to decode embedding: {e}")
    return None


def backfill_summaries():
  """
    Backfills summaries for all reports that lack one.
  """

  response = supabase.table("reports").select("id, symptoms, cause").is_("summary", "NULL").execute()
  reports = response.data
  for report in reports:
      symptoms = report["symptoms"]
      cause = report["cause"]
      if symptoms:
          summary = generate_summary(symptoms, cause)
          supabase.table("reports").update({"summary": summary}).eq("id", report["id"]).execute()
  print(f"Updated {len(reports)} reports with summaries.")

def backfill_embeddings():
  """
    Backfills embeddings for all reports that lack one.
  """

  response = supabase.table("reports").select("id, symptoms, cause").is_("embedding", "NULL").execute()
  reports = response.data
  for report in reports:
      print(report)
      symptoms = report["symptoms"]
      cause = report["cause"]
      print(symptoms)
      if symptoms:
          [embedding] = generate_embeddings(symptoms, cause)
          supabase.table("reports").update({"embedding": embedding.tolist()}).eq("id", report["id"]).execute()
  print(f"Updated {len(reports)} reports with embeddings.")