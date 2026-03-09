"""
tools.py — FNEWSTEER MCP tool implementations.

Each function calls the FastAPI backend and returns a human-readable string
suitable for MCP tool responses. Both the stdio and SSE servers import from here.
"""
import json
from typing import Optional
import httpx
import config


def _headers() -> dict:
    return {"X-API-Key": config.FNEWSTEER_API_KEY}


def _client() -> httpx.Client:
    return httpx.Client(
        base_url=config.FNEWSTEER_API_URL,
        headers=_headers(),
        timeout=config.REQUEST_TIMEOUT,
    )


def _fmt_event(event: dict) -> str:
    """Format a single news event into a readable string."""
    actual = f" | Actual: {event['actual']}" if event.get("actual") else ""
    forecast = f" | Forecast: {event['forecast']}" if event.get("forecast") else ""
    previous = f" | Previous: {event['previous']}" if event.get("previous") else ""
    return (
        f"  • {event['title']} ({event['currency']}) [{event['impact']} Impact]\n"
        f"    Event time : {event['event_time']}\n"
        f"    Window     : {event['window_start']} → {event['window_end']} "
        f"(±{event['window_minutes']} min){actual}{forecast}{previous}"
    )


def _fmt_blocking(event: dict) -> str:
    """Format a blocking event."""
    mins = event.get("minutes_to_event")
    if mins is not None:
        timing = f"{abs(mins):.0f} min {'ago' if mins < 0 else 'from now'}"
    else:
        timing = "unknown"
    return (
        f"  • {event['title']} ({event['currency']}) [{event['impact']} Impact]\n"
        f"    Event time : {event['event_time']}\n"
        f"    Window     : {event['window_start']} → {event['window_end']}\n"
        f"    Timing     : {timing}"
    )


# ─── Tool implementations ─────────────────────────────────────────────────────

def check_safe_to_trade(
    symbol: str,
    include_medium: bool = False,
    window_minutes: Optional[int] = None,
) -> str:
    """
    Check whether it is currently safe to trade a currency pair or symbol.

    Returns a clear SAFE / NOT SAFE signal plus full details of any blocking
    news events. This is the primary tool for loss-prevention checks.

    Args:
        symbol:         Currency pair (e.g. 'EURUSD') or single currency ('USD').
        include_medium: Also block on Medium impact events (default: High only).
        window_minutes: Override blackout window in minutes. Omit for smart defaults
                        (±60 min for FOMC/NFP/CPI/GDP, ±30 min for all others).
    """
    params: dict = {"symbol": symbol}
    if include_medium:
        params["include_medium"] = "true"
    if window_minutes is not None:
        params["window_minutes"] = str(window_minutes)

    try:
        with _client() as c:
            res = c.get("/news/check", params=params)
            res.raise_for_status()
            data = res.json()
    except httpx.HTTPStatusError as e:
        return f"ERROR: FNEWSTEER API returned {e.response.status_code}: {e.response.text}"
    except httpx.RequestError as e:
        return f"ERROR: Could not reach FNEWSTEER API at {config.FNEWSTEER_API_URL}. Is it running? ({e})"

    safe      = data["safe_to_trade"]
    checked   = data["checked_at"]
    currencies = ", ".join(data["currencies_checked"])
    blocking  = data.get("blocking_events", [])

    if safe:
        return (
            f"✅ SAFE TO TRADE — {symbol.upper()}\n\n"
            f"Currencies checked : {currencies}\n"
            f"Checked at (UTC)   : {checked}\n"
            f"Result             : No active or imminent high-impact news blackout windows.\n\n"
            f"You may proceed with your trade setup. Continue to monitor — "
            f"re-check before entry if more than a few minutes have passed."
        )
    else:
        blocking_lines = "\n\n".join(_fmt_blocking(e) for e in blocking)
        return (
            f"🚫 NOT SAFE TO TRADE — {symbol.upper()}\n\n"
            f"Currencies checked : {currencies}\n"
            f"Checked at (UTC)   : {checked}\n"
            f"Result             : {len(blocking)} blocking event(s) detected.\n\n"
            f"BLOCKING EVENTS:\n{blocking_lines}\n\n"
            f"⚠️  Do not enter new positions until the blackout window clears. "
            f"News-driven volatility can invalidate technically sound setups instantly."
        )


def get_upcoming_events(
    currency: Optional[str] = None,
    include_medium: bool = False,
    window_minutes: Optional[int] = None,
) -> str:
    """
    Get all high-impact news events for the current week.

    Useful for planning a trading session — understand the full landscape of
    scheduled risk events before committing to setups.

    Args:
        currency:       Filter by currency or pair (e.g. 'USD', 'EURUSD'). Omit for all.
        include_medium: Include Medium impact events (default: High only).
        window_minutes: Override blackout window in minutes.
    """
    params: dict = {}
    if currency:
        params["currency"] = currency
    if include_medium:
        params["include_medium"] = "true"
    if window_minutes is not None:
        params["window_minutes"] = str(window_minutes)

    try:
        with _client() as c:
            res = c.get("/news/upcoming", params=params)
            res.raise_for_status()
            data = res.json()
    except httpx.HTTPStatusError as e:
        return f"ERROR: FNEWSTEER API returned {e.response.status_code}: {e.response.text}"
    except httpx.RequestError as e:
        return f"ERROR: Could not reach FNEWSTEER API at {config.FNEWSTEER_API_URL}. ({e})"

    events     = data.get("events", [])
    fetched_at = data.get("fetched_at", "unknown")
    count      = data.get("event_count", len(events))
    filter_str = f" for {currency.upper()}" if currency else " (all currencies)"

    if not events:
        return (
            f"📅 UPCOMING EVENTS{filter_str}\n\n"
            f"No high-impact events found this week{filter_str}.\n"
            f"Data fetched at: {fetched_at}"
        )

    event_lines = "\n\n".join(_fmt_event(e) for e in events)
    return (
        f"📅 UPCOMING EVENTS THIS WEEK{filter_str.upper()}\n\n"
        f"Total events : {count}\n"
        f"Fetched at   : {fetched_at}\n\n"
        f"{event_lines}\n\n"
        f"All times UTC. Blackout windows are active from 'window_start' to 'window_end'."
    )


def get_blackout_zones(
    currency: Optional[str] = None,
    include_medium: bool = False,
    window_minutes: Optional[int] = None,
) -> str:
    """
    Get all news blackout zones for the current week as a structured avoid-list.

    Designed for backtesting and scheduling. Each zone is a time range to
    exclude from strategy evaluation or automated order placement.

    Args:
        currency:       Filter by currency or pair. Omit for all.
        include_medium: Include Medium impact zones.
        window_minutes: Override blackout window in minutes.
    """
    params: dict = {}
    if currency:
        params["currency"] = currency
    if include_medium:
        params["include_medium"] = "true"
    if window_minutes is not None:
        params["window_minutes"] = str(window_minutes)

    try:
        with _client() as c:
            res = c.get("/news/blackout-zones", params=params)
            res.raise_for_status()
            data = res.json()
    except httpx.HTTPStatusError as e:
        return f"ERROR: FNEWSTEER API returned {e.response.status_code}: {e.response.text}"
    except httpx.RequestError as e:
        return f"ERROR: Could not reach FNEWSTEER API at {config.FNEWSTEER_API_URL}. ({e})"

    zones      = data.get("zones", [])
    fetched_at = data.get("fetched_at", "unknown")
    count      = data.get("zone_count", len(zones))
    filter_str = f" for {currency.upper()}" if currency else ""

    if not zones:
        return (
            f"🗓 BLACKOUT ZONES{filter_str}\n\n"
            f"No blackout zones found this week{filter_str}.\n"
            f"Fetched at: {fetched_at}"
        )

    zone_lines = "\n".join(
        f"  [{z['currency']} | {z['impact']}] {z['start']} → {z['end']}  ({z['event']})"
        for z in zones
    )

    # Also emit as JSON block for programmatic consumption by agents
    zones_json = json.dumps([
        {
            "currency": z["currency"],
            "impact":   z["impact"],
            "event":    z["event"],
            "start":    z["start"],
            "end":      z["end"],
        }
        for z in zones
    ], indent=2)

    return (
        f"🗓 BLACKOUT ZONES THIS WEEK{filter_str.upper()}\n\n"
        f"Total zones : {count}\n"
        f"Fetched at  : {fetched_at}\n\n"
        f"HUMAN-READABLE:\n{zone_lines}\n\n"
        f"MACHINE-READABLE (JSON):\n```json\n{zones_json}\n```\n\n"
        f"Exclude these ranges from backtests and automated order windows. All times UTC."
    )


def refresh_calendar() -> str:
    """
    Force-refresh the ForexFactory calendar cache on the FNEWSTEER backend.

    Use this if you suspect the cached data is stale (e.g. after a late
    schedule update to a major economic release). The next API call after
    this will fetch fresh data from ForexFactory.
    """
    try:
        with _client() as c:
            res = c.post("/admin/refresh-cache")
            res.raise_for_status()
            data = res.json()
        return f"✓ Cache refreshed. {data.get('message', 'Next request will fetch fresh data.')}"
    except httpx.HTTPStatusError as e:
        return f"ERROR: {e.response.status_code}: {e.response.text}"
    except httpx.RequestError as e:
        return f"ERROR: Could not reach FNEWSTEER API. ({e})"


def get_server_health() -> str:
    """
    Check the health and status of the FNEWSTEER news backend.

    Returns API availability, cache age, and configuration summary.
    Call this first to verify the news service is operational before
    relying on its signals for trading decisions.
    """
    try:
        with _client() as c:
            res = c.get("/health")
            res.raise_for_status()
            data = res.json()
    except httpx.RequestError as e:
        return (
            f"❌ FNEWSTEER API UNREACHABLE\n\n"
            f"URL   : {config.FNEWSTEER_API_URL}\n"
            f"Error : {e}\n\n"
            f"Ensure the FastAPI backend is running before relying on news signals."
        )

    status       = data.get("status", "unknown")
    cache_age    = data.get("cache_age_seconds")
    cache_ready  = data.get("cache_populated", False)

    age_str = (
        f"{cache_age:.0f}s ago" if cache_age is not None
        else "not yet fetched"
    )

    icon = "✅" if status == "ok" else "⚠️"
    return (
        f"{icon} FNEWSTEER API STATUS\n\n"
        f"Status          : {status.upper()}\n"
        f"API URL         : {config.FNEWSTEER_API_URL}\n"
        f"Cache populated : {'Yes' if cache_ready else 'No'}\n"
        f"Cache age       : {age_str}\n\n"
        f"{'The news backend is operational and ready.' if status == 'ok' else 'Warning: API may be degraded.'}"
    )