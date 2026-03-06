from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class NewsEvent(BaseModel):
    title: str
    currency: str
    impact: str
    event_time: datetime
    forecast: Optional[str] = None
    previous: Optional[str] = None
    actual: Optional[str] = None
    window_start: datetime
    window_end: datetime
    window_minutes: int


class UpcomingNewsResponse(BaseModel):
    fetched_at: datetime
    event_count: int
    events: list[NewsEvent]


class BlockingEvent(BaseModel):
    title: str
    currency: str
    impact: str
    event_time: datetime
    window_start: datetime
    window_end: datetime
    minutes_to_event: Optional[float] = None  # negative means event already passed


class CheckResponse(BaseModel):
    safe_to_trade: bool
    symbol: str
    currencies_checked: list[str]
    checked_at: datetime
    blocking_events: list[BlockingEvent]


class BlackoutZone(BaseModel):
    start: datetime
    end: datetime
    event: str
    currency: str
    impact: str
    event_time: datetime


class BlackoutZonesResponse(BaseModel):
    fetched_at: datetime
    zone_count: int
    zones: list[BlackoutZone]
