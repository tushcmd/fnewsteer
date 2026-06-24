export interface NewsEvent {
  title: string;
  currency: string;
  impact: string;
  event_time: string;
  forecast: string | null;
  previous: string | null;
  actual: string | null;
  window_start: string;
  window_end: string;
  window_minutes: number;
}

export interface BlockingEvent {
  title: string;
  currency: string;
  impact: string;
  event_time: string;
  window_start: string;
  window_end: string;
  minutes_to_event: number | null;
}

export interface CheckResponse {
  safe_to_trade: boolean;
  symbol: string;
  currencies_checked: string[];
  checked_at: string;
  blocking_events: BlockingEvent[];
}

export interface BlackoutZone {
  start: string;
  end: string;
  event: string;
  currency: string;
  impact: string;
  event_time: string;
}

export interface BlackoutZonesResponse {
  fetched_at: string;
  zone_count: number;
  zones: BlackoutZone[];
}
