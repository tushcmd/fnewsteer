import time
import logging
from typing import Optional
import httpx
from app.core.config import FF_JSON_URL, CACHE_TTL_SECONDS

logger = logging.getLogger(__name__)

_cache: dict = {
    "data": None,
    "fetched_at": 0.0,
}


async def get_calendar() -> list[dict]:
    """
    Returns this week's ForexFactory calendar as raw dicts.
    Uses an in-memory cache with a TTL of CACHE_TTL_SECONDS.
    """
    now = time.monotonic()
    age = now - _cache["fetched_at"]

    if _cache["data"] is not None and age < CACHE_TTL_SECONDS:
        logger.debug("Returning cached FF calendar (age=%.0fs)", age)
        return _cache["data"]

    logger.info("Fetching fresh FF calendar from %s", FF_JSON_URL)
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(FF_JSON_URL)
        response.raise_for_status()
        data = response.json()

    _cache["data"] = data
    _cache["fetched_at"] = now
    logger.info("FF calendar cached: %d events", len(data))
    return data


def cache_age_seconds() -> Optional[float]:
    """Returns how old the cached data is, or None if never fetched."""
    if _cache["fetched_at"] == 0.0:
        return None
    return time.monotonic() - _cache["fetched_at"]


def invalidate_cache() -> None:
    """Force-expire the cache so the next request fetches fresh data."""
    _cache["data"] = None
    _cache["fetched_at"] = 0.0
    logger.info("FF calendar cache invalidated")
