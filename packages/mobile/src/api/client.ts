import { NewsEvent, CheckResponse, BlackoutZonesResponse } from './types';

const DEFAULT_BASE_URL = 'http://localhost:8000';

let baseUrl = DEFAULT_BASE_URL;
let apiKey = '';

export function configure(url: string, key: string) {
  baseUrl = url.replace(/\/+$/, '');
  apiKey = key;
}

function headers(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) h['X-API-Key'] = apiKey;
  return h;
}

async function get<T>(path: string, params?: Record<string, string | undefined>): Promise<T> {
  const url = new URL(`${baseUrl}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) url.searchParams.set(k, v);
    }
  }
  const res = await fetch(url.toString(), { headers: headers() });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json();
}

export async function fetchUpcoming(opts?: {
  currency?: string;
  includeMedium?: boolean;
  windowMinutes?: number;
}): Promise<{ fetched_at: string; event_count: number; events: NewsEvent[] }> {
  return get('/v1/news/upcoming', {
    currency: opts?.currency,
    include_medium: opts?.includeMedium ? 'true' : undefined,
    window_minutes: opts?.windowMinutes?.toString(),
  });
}

export async function fetchCheck(opts: {
  symbol: string;
  includeMedium?: boolean;
  windowMinutes?: number;
}): Promise<CheckResponse> {
  return get('/v1/news/check', {
    symbol: opts.symbol,
    include_medium: opts.includeMedium ? 'true' : undefined,
    window_minutes: opts.windowMinutes?.toString(),
  });
}

export async function fetchBlackoutZones(opts?: {
  currency?: string;
  includeMedium?: boolean;
  windowMinutes?: number;
}): Promise<BlackoutZonesResponse> {
  return get('/v1/news/blackout-zones', {
    currency: opts?.currency,
    include_medium: opts?.includeMedium ? 'true' : undefined,
    window_minutes: opts?.windowMinutes?.toString(),
  });
}

export async function fetchHealth(): Promise<{ status: string; cache_age_seconds: number | null; cache_populated: boolean }> {
  return get('/health');
}
