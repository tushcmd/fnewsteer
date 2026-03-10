"""
FNEWSTEER MCP server (FastMCP).

FastMCP reads type hints → generates JSON schema automatically.
FastMCP reads docstrings → generates tool descriptions automatically.
Tools import directly from the API service layer (workspace sibling) —
no HTTP calls, no duplication, no separate API server needed for stdio use.

Run (stdio — Claude Desktop / Cursor):
    uv run --package fnewsteer-mcp python packages/mcp/server.py

Run (SSE — remote clients / Docker):
    uv run --package fnewsteer-mcp python packages/mcp/server.py --transport sse
"""
import json
import logging
import os
import sys
from typing import Optional

from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP

# Import directly from the API service layer (workspace dependency)
from app.services.calendar import cache_age_seconds, get_calendar, invalidate_cache
from app.services.checker import build_blackout_zones, check_safe_to_trade, parse_symbol
from app.services.parser import normalize_events

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    stream=sys.stderr,  # stdout is reserved for MCP JSON-RPC (stdio transport)
)
logger = logging.getLogger(__name__)

# ── FastMCP instance ──────────────────────────────────────────────────────────
mcp = FastMCP(
    name="fnewsteer",
    instructions=(
        "FNEWSTEER provides news loss-prevention signals for forex and financial traders. "
        "Always call check_safe_to_trade before any trade action. "
        "Treat a NOT SAFE result as a hard stop — never bypass it. "
        "Call get_server_health first in automated pipelines to verify data is available."
    ),
)


# ── Formatting helpers ────────────────────────────────────────────────────────

def _fmt_blocking(event) -> str:
    mins = event.minutes_to_event
    timing = (
        f"{abs(mins):.0f} min {'ago' if mins < 0 else 'from now'}"
        if mins is not None else "unknown"
    )
    return (
        f"  • {event.title} ({event.currency}) [{event.impact} Impact]\n"
        f"    Event time : {event.event_time.isoformat()}\n"
        f"    Window     : {event.window_start.isoformat()} → {event.window_end.isoformat()}\n"
        f"    Timing     : {timing}"
    )


def _fmt_event(event) -> str:
    extras = ""
    if event.actual:   extras += f" | Actual: {event.actual}"
    if event.forecast: extras += f" | Forecast: {event.forecast}"
    if event.previous: extras += f" | Previous: {event.previous}"
    return (
        f"  • {event.title} ({event.currency}) [{event.impact} Impact]\n"
        f"    Event time : {event.event_time.isoformat()}\n"
        f"    Window     : {event.window_start.isoformat()} → "
        f"{event.window_end.isoformat()} (±{event.window_minutes} min){extras}"
    )


# ── Tools ─────────────────────────────────────────────────────────────────────

@mcp.tool()
async def check_safe_to_trade_now(
    symbol: str,
    include_medium: bool = False,
    window_minutes: Optional[int] = None,
) -> str:
    """
    Check whether it is currently safe to trade a currency pair or symbol.

    Returns a SAFE or NOT SAFE signal with full details of any blocking news
    events. This is the PRIMARY loss-prevention tool — call it before placing
    any trade. High-impact events create blackout windows (±30–60 min) during
    which technically sound setups can be invalidated instantly.

    Args:
        symbol:         Currency pair (e.g. 'EURUSD') or single currency ('USD').
        include_medium: Also block on Medium impact events. Default: False.
        window_minutes: Override blackout window in minutes (1–1440). Omit for
                        smart defaults: ±60 min for FOMC/NFP/CPI/GDP,
                        ±30 min for all other High impact events.
    """
    try:
        raw    = await get_calendar()
        events = normalize_events(raw, include_medium=include_medium, window_minutes=window_minutes)
        result = check_safe_to_trade(events, symbol)
    except Exception as exc:
        return f"ERROR: Could not complete news check — {exc}"

    currencies = ", ".join(result.currencies_checked)

    if result.safe_to_trade:
        return (
            f"✅ SAFE TO TRADE — {result.symbol}\n\n"
            f"Currencies checked : {currencies}\n"
            f"Checked at (UTC)   : {result.checked_at.isoformat()}\n\n"
            f"No active or imminent high-impact news blackout windows. "
            f"You may proceed — re-check before entry if more than a few minutes pass."
        )

    blocking_lines = "\n\n".join(_fmt_blocking(e) for e in result.blocking_events)
    return (
        f"🚫 NOT SAFE TO TRADE — {result.symbol}\n\n"
        f"Currencies checked : {currencies}\n"
        f"Checked at (UTC)   : {result.checked_at.isoformat()}\n"
        f"Blocking events    : {len(result.blocking_events)}\n\n"
        f"{blocking_lines}\n\n"
        f"⚠️  Do not enter new positions until the blackout window clears."
    )


@mcp.tool()
async def get_upcoming_events(
    currency: Optional[str] = None,
    include_medium: bool = False,
    window_minutes: Optional[int] = None,
) -> str:
    """
    Get all high-impact news events for the current week.

    Use this to survey the full risk landscape before planning a trading
    session — understand every scheduled volatility event and its blackout
    window before committing to setups.

    Args:
        currency:       Filter by currency or pair (e.g. 'USD', 'EURUSD').
                        Omit to return events for all currencies.
        include_medium: Include Medium impact events. Default: False.
        window_minutes: Override blackout window in minutes.
    """
    try:
        raw        = await get_calendar()
        currencies = parse_symbol(currency) if currency else None
        events     = normalize_events(
            raw,
            currencies=currencies,
            include_medium=include_medium,
            window_minutes=window_minutes,
        )
    except Exception as exc:
        return f"ERROR: Could not fetch events — {exc}"

    filter_str = f" for {currency.upper()}" if currency else " (all currencies)"

    if not events:
        return f"📅 No high-impact events found this week{filter_str}."

    event_lines = "\n\n".join(_fmt_event(e) for e in events)
    return (
        f"📅 UPCOMING EVENTS THIS WEEK{filter_str.upper()}\n\n"
        f"Total : {len(events)} event(s)\n\n"
        f"{event_lines}\n\n"
        f"All times UTC. Blackout windows run from window_start to window_end."
    )


@mcp.tool()
async def get_blackout_zones(
    currency: Optional[str] = None,
    include_medium: bool = False,
    window_minutes: Optional[int] = None,
) -> str:
    """
    Get all news blackout zones for the current week as a structured avoid-list.

    Returns both a human-readable summary and a machine-readable JSON array of
    {currency, impact, event, start, end} objects. Use for backtesting exclusion
    lists or automated order scheduling. All times are UTC.

    Args:
        currency:       Filter by currency or pair. Omit for all currencies.
        include_medium: Include Medium impact zones. Default: False.
        window_minutes: Override blackout window in minutes.
    """
    try:
        raw        = await get_calendar()
        currencies = parse_symbol(currency) if currency else None
        events     = normalize_events(
            raw,
            currencies=currencies,
            include_medium=include_medium,
            window_minutes=window_minutes,
        )
        result = build_blackout_zones(events)
    except Exception as exc:
        return f"ERROR: Could not fetch blackout zones — {exc}"

    filter_str = f" for {currency.upper()}" if currency else ""

    if not result.zones:
        return f"🗓 No blackout zones found this week{filter_str}."

    human_lines = "\n".join(
        f"  [{z.currency} | {z.impact}] "
        f"{z.start.isoformat()} → {z.end.isoformat()}  ({z.event})"
        for z in result.zones
    )
    zones_json = json.dumps(
        [
            {
                "currency": z.currency,
                "impact":   z.impact,
                "event":    z.event,
                "start":    z.start.isoformat(),
                "end":      z.end.isoformat(),
            }
            for z in result.zones
        ],
        indent=2,
    )

    return (
        f"🗓 BLACKOUT ZONES THIS WEEK{filter_str.upper()}\n\n"
        f"Total : {result.zone_count} zone(s)\n\n"
        f"HUMAN-READABLE:\n{human_lines}\n\n"
        f"MACHINE-READABLE (JSON):\n```json\n{zones_json}\n```\n\n"
        f"Exclude these ranges from backtests and automated order windows. All times UTC."
    )


@mcp.tool()
async def refresh_calendar() -> str:
    """
    Force-refresh the ForexFactory calendar cache.

    Use if you suspect stale data (e.g. after a late schedule update to a
    major release). The cache refreshes automatically every 60 minutes on
    the next request — this just busts it immediately.
    """
    try:
        invalidate_cache()
        await get_calendar()  # re-fetch immediately so next call pays no latency
        return "✓ Calendar cache refreshed. Fresh data fetched from ForexFactory."
    except Exception as exc:
        return f"ERROR: Cache refresh failed — {exc}"


@mcp.tool()
async def get_server_health() -> str:
    """
    Check the health and status of the FNEWSTEER news data layer.

    Returns cache age and data availability. Call this first in automated
    pipelines to fail fast if news data is unavailable before relying on signals.
    """
    try:
        age = cache_age_seconds()
        if age is None:
            # Cold cache — try fetching now to validate FF connectivity
            await get_calendar()
            age = cache_age_seconds()
            age_str = "just fetched"
        else:
            age_str = f"{age:.0f}s ago"

        return (
            f"✅ FNEWSTEER DATA LAYER — OK\n\n"
            f"Cache populated : Yes\n"
            f"Cache age       : {age_str}\n\n"
            f"News data is available and ready."
        )
    except Exception as exc:
        return (
            f"❌ FNEWSTEER DATA LAYER — UNAVAILABLE\n\n"
            f"Error : {exc}\n\n"
            f"Cannot reach ForexFactory. Do not rely on news signals until resolved."
        )


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    transport = "stdio"
    if "--transport" in sys.argv:
        idx = sys.argv.index("--transport")
        if idx + 1 < len(sys.argv):
            transport = sys.argv[idx + 1]

    host = os.environ.get("MCP_SSE_HOST", "0.0.0.0")
    port = int(os.environ.get("MCP_SSE_PORT", "8001"))

    logger.info("Starting FNEWSTEER MCP — transport: %s", transport)

    if transport == "sse":
        mcp.run(transport="sse", host=host, port=port)
    else:
        mcp.run(transport="stdio")