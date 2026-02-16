import os
import json
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-2.0-flash"

# Google Auth
CLIENT_SECRET_FILE = next(Path(__file__).parent.glob("client_secret_*.json"), None)
GOOGLE_CLIENT_ID = None

if CLIENT_SECRET_FILE:
    try:
        with open(CLIENT_SECRET_FILE) as f:
            data = json.load(f)
            # Structure: {"web": {"client_id": ...}}
            GOOGLE_CLIENT_ID = data.get("web", {}).get("client_id")
    except Exception as e:
        print(f"Error loading client secret: {e}")

# CORS
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://serpent-136813145847.us-central1.run.app"
]

