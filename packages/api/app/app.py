import logging
import os
from datetime import datetime, timezone
from typing import Annotated, Optional

from fastapi import Depends, FastAPI, HTTPException, Query, Security, status
from fastapi.security.api_key import APIKeyHeader
from fastapi.routing import APIRouter

# use package-qualified imports so modules run inside `uvicorn` subprocesses
from app.schemas.event_models import BlackoutZonesResponse, CheckResponse, UpcomingNewsResponse
from app.services.calendar import cache_age_seconds, get_calendar, invalidate_cache
from app.services.checker import build_blackout_zones, check_safe_to_trade
from app.services.parser import normalize_events

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s – %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="FNEWSTEER",
    description=(
        "Fundamental Analysis (News) Steer — a loss-prevention API for price action traders. "
        "Know when NOT to trade so that news events don't blindside your technically sound setups."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
API_KEY = os.environ.get("FNEWSTEER_API_KEY", "")
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(key: str = Security(api_key_header)) -> str:
    if not API_KEY:
        # If no key configured (e.g. local dev), allow all requests
        logger.warning("FNEWSTEER_API_KEY not set — running without authentication")
        return "unauthenticated"
    if key != API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing API key. Provide it via the X-API-Key header.",
        )
    return key


AuthDep = Annotated[str, Depends(verify_api_key)]

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

# ── Versioned router ──────────────────────────────────────────────────────────
v1 = APIRouter(prefix="/v1")

@app.get("/", include_in_schema=False)
async def root():
    return {
        "service": "FNEWSTEER",
        "tagline": "You might be a great surfer, but don't paddle out into a hurricane unaware.",
        "docs": "/docs",
    }


@v1.get(
    "/news/upcoming",
    response_model=UpcomingNewsResponse,
    summary="Full week calendar",
    description=(
        "Returns all high-impact (and optionally medium-impact) news events for the current week. "
        "Filter by currency or pair. Each event includes its computed blackout window."
    ),
    tags=["News"],
)
async def upcoming(
    _: AuthDep,
    currency: Optional[str] = Query(
        None,
        description="Single currency (USD) or pair (EURUSD). Filters events to relevant currencies.",
        examples={"default": "EURUSD"},
    ),
    include_medium: bool = Query(
        False,
        description="Include Medium impact events in addition to High impact.",
    ),
    window_minutes: Optional[int] = Query(
        None,
        ge=1,
        le=1440,
        description="Override the blackout window (minutes) for all events. Omit to use smart defaults.",
    ),
):
    raw = await get_calendar()
    currencies = None
    if currency:
        from app.services.checker import parse_symbol
        currencies = parse_symbol(currency)

    events = normalize_events(
        raw,
        currencies=currencies,
        include_medium=include_medium,
        window_minutes=window_minutes,
    )

    fetched_at = datetime.now(timezone.utc)
    return UpcomingNewsResponse(
        fetched_at=fetched_at,
        event_count=len(events),
        events=events,
    )


@v1.get(
    "/news/check",
    response_model=CheckResponse,
    summary="Safe-to-trade check",
    description=(
        "The primary bot integration endpoint. Pass a currency or pair and get back a binary "
        "`safe_to_trade` signal. Your algo bot should call this before placing any order. "
        "Returns `safe_to_trade: false` if the current time falls within any high-impact news "
        "blackout window for the relevant currencies."
    ),
    tags=["News"],
)
async def check(
    _: AuthDep,
    symbol: str = Query(
        ...,
        description="Currency (USD) or pair (EURUSD) to check.",
        examples={"default": "EURUSD"},
    ),
    include_medium: bool = Query(
        False,
        description="Also block on Medium impact events.",
    ),
    window_minutes: Optional[int] = Query(
        None,
        ge=1,
        le=1440,
        description="Override the blackout window in minutes. Omit to use smart defaults.",
    ),
):
    raw = await get_calendar()
    # Normalize without currency filter — checker handles per-currency filtering
    events = normalize_events(
        raw,
        currencies=None,
        include_medium=include_medium,
        window_minutes=window_minutes,
    )
    return check_safe_to_trade(events, symbol)


@v1.get(
    "/news/blackout-zones",
    response_model=BlackoutZonesResponse,
    summary="Blackout zones for the week",
    description=(
        "Returns a flat list of time ranges to avoid for the current week. "
        "Designed for backtesting engines and schedulers: consume this list, exclude those zones, "
        "and your backtest won't be contaminated by news-driven volatility. "
        "Optionally filter by currency or pair."
    ),
    tags=["News"],
)
async def blackout_zones(
    _: AuthDep,
    currency: Optional[str] = Query(
        None,
        description="Single currency (USD) or pair (EURUSD). Omit for all currencies.",
        examples={"default": "GBPUSD"},
    ),
    include_medium: bool = Query(
        False,
        description="Include Medium impact events.",
    ),
    window_minutes: Optional[int] = Query(
        None,
        ge=1,
        le=1440,
        description="Override the blackout window in minutes.",
    ),
):
    raw = await get_calendar()
    currencies = None
    if currency:
        from app.services.checker import parse_symbol
        currencies = parse_symbol(currency)

    events = normalize_events(
        raw,
        currencies=currencies,
        include_medium=include_medium,
        window_minutes=window_minutes,
    )
    return build_blackout_zones(events)


# ---------------------------------------------------------------------------
# Admin / Health
# ---------------------------------------------------------------------------


@app.get(
    "/health",
    summary="Health check",
    description="Returns service status and cache age. No auth required.",
    tags=["Admin"],
)
async def health():
    age = cache_age_seconds()
    return {
        "status": "ok",
        "cache_age_seconds": round(age, 1) if age is not None else None,
        "cache_populated": age is not None,
    }


@app.post(
    "/admin/refresh-cache",
    summary="Force cache refresh",
    description="Invalidates the in-memory calendar cache so the next request fetches fresh data from ForexFactory.",
    tags=["Admin"],
)
async def refresh_cache(_: AuthDep):
    invalidate_cache()
    return {"message": "Cache invalidated. Next request will fetch fresh data from ForexFactory."}

app.include_router(v1)