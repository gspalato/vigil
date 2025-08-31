import base64
import mimetypes
import os
from google import genai
from google.genai import types
from pydantic import BaseModel

class InferredSymptoms(BaseModel):
    symptoms: dict[str, int]
    cause: str
    success: bool

client = genai.Client(
    api_key=os.environ.get("GEMINI_API_KEY"),
)

def infer_symptoms_and_cause(text: str) -> InferredSymptoms:
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
    response = client.models.generate_content(
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

    inferred = InferredSymptoms(
        symptoms=symptoms_dict,
        cause=cause,
        success=success
    )

    return inferred

