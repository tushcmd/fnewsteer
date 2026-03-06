import logging
from datetime import datetime, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
from app.models import NewsEvent
from app.core.config import (
    IMPACT_HIGH,
    IMPACT_MEDIUM,
    DEFAULT_WINDOW_MINUTES,
    EXTENDED_WINDOW_MINUTES,
    EXTENDED_WINDOW_KEYWORDS,
)
from datetime import timedelta


# Since Windows installations of Python typically lack the IANA
# timezone database, we depend on the tzdata package.  If someone
# forgets to install it the constructor below will raise a
# ZoneInfoNotFoundError; we catch it and fall back to UTC with a
# warning so the app can still start and tests can run.
try:
    FF_TIMEZONE = ZoneInfo("America/New_York")
except ZoneInfoNotFoundError:
    import logging

    logging.getLogger(__name__).warning(
        "tzdata not available; defaulting to UTC for FF_TIMEZONE."
        " Install the 'tzdata' package to enable local time parsing."
    )
    FF_TIMEZONE = timezone.utc

logger = logging.getLogger(__name__)

# FF JSON timestamps are in US/Eastern time (defined above with fallback)


def _parse_ff_datetime(date_str: str) -> datetime:
    """
    Parse a ForexFactory datetime string and return a UTC-aware datetime.
    FF format example: '2025-02-07T08:30:00-05:00' or '2025-02-07T08:30:00'
    """
    try:
        dt = datetime.fromisoformat(date_str)
        if dt.tzinfo is None:
            # Assume Eastern if no tz info present
            dt = dt.replace(tzinfo=FF_TIMEZONE)
        return dt.astimezone(timezone.utc)
    except Exception as exc:
        logger.warning("Failed to parse datetime '%s': %s", date_str, exc)
        raise ValueError(f"Unparseable datetime: {date_str!r}") from exc


def _is_extended_window(title: str) -> bool:
    """Returns True if this event warrants a longer blackout window."""
    lower = title.lower()
    return any(keyword in lower for keyword in EXTENDED_WINDOW_KEYWORDS)


def _compute_window(event_time: datetime, title: str, override_minutes: int | None = None) -> tuple[datetime, datetime, int]:
    """
    Returns (window_start, window_end, window_minutes) for a given event.
    override_minutes takes priority over smart defaults.
    """
    if override_minutes is not None:
        minutes = override_minutes
    elif _is_extended_window(title):
        minutes = EXTENDED_WINDOW_MINUTES
    else:
        minutes = DEFAULT_WINDOW_MINUTES

    delta = timedelta(minutes=minutes)
    return event_time - delta, event_time + delta, minutes


def normalize_events(
    raw_events: list[dict],
    currencies: list[str] | None = None,
    include_medium: bool = False,
    window_minutes: int | None = None,
) -> list[NewsEvent]:
    """
    Convert raw FF JSON events into normalized NewsEvent objects.

    Args:
        raw_events: Raw list of dicts from the FF JSON endpoint.
        currencies: If provided, filter to only these currency codes (uppercase).
        include_medium: Include Medium impact events alongside High.
        window_minutes: Override the blackout window for all events.

    Returns:
        Sorted list of NewsEvent objects (ascending by event_time).
    """
    allowed_impacts = {IMPACT_HIGH}
    if include_medium:
        allowed_impacts.add(IMPACT_MEDIUM)

    normalized: list[NewsEvent] = []

    for raw in raw_events:
        try:
            impact = raw.get("impact", "")
            if impact not in allowed_impacts:
                continue

            currency = (raw.get("country") or "").upper().strip()
            if currencies and currency not in currencies:
                continue

            date_str = raw.get("date")
            if not date_str:
                continue

            event_time = _parse_ff_datetime(date_str)
            title = raw.get("title", "Unknown Event")
            window_start, window_end, w_minutes = _compute_window(event_time, title, window_minutes)

            normalized.append(
                NewsEvent(
                    title=title,
                    currency=currency,
                    impact=impact,
                    event_time=event_time,
                    forecast=raw.get("forecast") or None,
                    previous=raw.get("previous") or None,
                    actual=raw.get("actual") or None,
                    window_start=window_start,
                    window_end=window_end,
                    window_minutes=w_minutes,
                )
            )
        except Exception as exc:
            logger.warning("Skipping malformed event %r: %s", raw, exc)
            continue

    normalized.sort(key=lambda e: e.event_time)
    return normalized
