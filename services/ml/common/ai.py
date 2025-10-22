import os
from google import genai

gemini_api_key: str = os.getenv('GOOGLE_API_KEY')

gemini_client = genai.Client(api_key=gemini_api_key)