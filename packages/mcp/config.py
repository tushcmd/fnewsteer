"""
config.py — FNEWSTEER MCP Server configuration.

Reads from environment variables (or .env file via python-dotenv).
"""
import os
from dotenv import load_dotenv

load_dotenv()

FNEWSTEER_API_URL: str = os.environ.get("FNEWSTEER_API_URL", "http://localhost:8000").rstrip("/")
FNEWSTEER_API_KEY: str = os.environ.get("FNEWSTEER_API_KEY", "")

# SSE server bind settings
SSE_HOST: str = os.environ.get("MCP_SSE_HOST", "0.0.0.0")
SSE_PORT: int = int(os.environ.get("MCP_SSE_PORT", "8001"))

# Request timeout for calls to the FastAPI backend
REQUEST_TIMEOUT: float = float(os.environ.get("FNEWSTEER_TIMEOUT", "10.0"))


def validate() -> None:
    """Raise if critical config is missing."""
    if not FNEWSTEER_API_URL:
        raise ValueError("FNEWSTEER_API_URL is not set")