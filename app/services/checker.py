import logging
from datetime import datetime, timezone
from models import NewsEvent, BlockingEvent, CheckResponse, BlackoutZone, BlackoutZonesResponse
from app.core.config import KNOWN_CURRENCIES

logger = logging.getLogger(__name__)


def parse_symbol(symbol: str) -> list[str]:
    """
    Parse a symbol string into a list of currency codes to check.

    Handles:
    - Single currency: 'USD' -> ['USD']
    - Pair (6 chars): 'EURUSD' -> ['EUR', 'USD']
    - Pair with separator: 'EUR/USD' or 'EUR_USD' -> ['EUR', 'USD']

    Returns uppercase currency codes. Unknown currencies are passed through
    so the caller decides whether to care.
    """
    symbol = symbol.upper().strip()

    # Strip common separators
    for sep in ["/", "_", "-", "."]:
        if sep in symbol:
            parts = [p.strip() for p in symbol.split(sep) if p.strip()]
            return parts[:2]  # Only first two parts

    # 6-char pair like EURUSD
    if len(symbol) == 6:
        return [symbol[:3], symbol[3:]]

    # 3-char single currency or anything else
    return [symbol]


def check_safe_to_trade(
    events: list[NewsEvent],
    symbol: str,
    now: datetime | None = None,
) -> CheckResponse:
    """
    Given a normalized list of events and a symbol, determine if it's safe to trade.

    An event blocks trading if 'now' falls within its [window_start, window_end].

    Args:
        events: Pre-filtered (by impact) list of NewsEvent objects.
        symbol: Currency or pair string (e.g. 'USD', 'EURUSD').
        now: The reference time. Defaults to current UTC time.

    Returns:
        CheckResponse with safe_to_trade flag and any blocking events.
    """
    if now is None:
        now = datetime.now(timezone.utc)

    currencies = parse_symbol(symbol)
    blocking: list[BlockingEvent] = []

    for event in events:
        if event.currency not in currencies:
            continue

        if event.window_start <= now <= event.window_end:
            delta_seconds = (event.event_time - now).total_seconds()
            minutes_to_event = round(delta_seconds / 60, 1)

            blocking.append(
                BlockingEvent(
                    title=event.title,
                    currency=event.currency,
                    impact=event.impact,
                    event_time=event.event_time,
                    window_start=event.window_start,
                    window_end=event.window_end,
                    minutes_to_event=minutes_to_event,
                )
            )

    return CheckResponse(
        safe_to_trade=len(blocking) == 0,
        symbol=symbol.upper(),
        currencies_checked=currencies,
        checked_at=now,
        blocking_events=blocking,
    )


def build_blackout_zones(events: list[NewsEvent]) -> BlackoutZonesResponse:
    """
    Convert a list of events into flat blackout zone records.
    Zones are sorted by start time.
    """
    zones = [
        BlackoutZone(
            start=event.window_start,
            end=event.window_end,
            event=event.title,
            currency=event.currency,
            impact=event.impact,
            event_time=event.event_time,
        )
        for event in events
    ]
    zones.sort(key=lambda z: z.start)

    return BlackoutZonesResponse(
        fetched_at=datetime.now(timezone.utc),
        zone_count=len(zones),
        zones=zones,
    )
