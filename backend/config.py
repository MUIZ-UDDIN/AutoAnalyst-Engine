from dotenv import load_dotenv
import os
import pathlib

load_dotenv()

TAVILY_API_KEY = os.getenv("tavily_api")
GROQ_API_KEY = os.getenv("groq_api")

if not TAVILY_API_KEY or not GROQ_API_KEY:
    raise ValueError("Missing required API keys in .env file")

OUTPUT_DIR = pathlib.Path(__file__).parent.parent / "research_output"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)