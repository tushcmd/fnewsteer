# FNEWSTEER — Fundamental Analysis (News) Steer

> _"You might be a great surfer, but don't paddle out into a hurricane unaware."_

A loss-prevention API for price action traders. FNEWSTEER tells your algo bot when **not** to trade by flagging high-impact news blackout windows — so technically sound setups don't get blindsided by scheduled volatility events. Monorepo managed with **uv workspaces**.

---

## Packages

| Package         | Path            | What it does                                                  |
| --------------- | --------------- | ------------------------------------------------------------- |
| `fnewsteer-api` | `packages/api/` | FastAPI backend — fetches ForexFactory, serves REST endpoints |
| `fnewsteer-mcp` | `packages/mcp/` | MCP server — exposes news tools to AI agents (Claude, Cursor) |

The MCP package **imports directly from the API service layer** — no HTTP calls between them, no code duplication.

---

## Philosophy

For price action traders, fundamental/news analysis is not a profit model — it's a **loss-prevention model**. You don't need to predict the news. You need to know whether the candle 30 minutes from now might be driven by something other than your setup.

---

## Quickstart

### Prerequisites

- [uv](https://docs.astral.sh/uv/getting-started/installation/) installed

1. Clone and enter the project

```bash
cd fnewsteer
```

2. Configure environment

```bash
cp .env.example .env
# Edit .env — set FNEWSTEER_API_KEY at minimum
```

3. Install everything (single command, shared lockfile)

```bash
uv sync
```

4. Run the API

```bash
uv run --package fnewsteer-api uvicorn main:app --reload
# → http://localhost:8000/docs
```

5. Run the MCP server (stdio — for Claude Desktop)

```bash
uv run --package fnewsteer-mcp python -m fnewsteer_mcp
```

6. (Optional) Run the MCP server in SSE mode for remote clients

```bash
uv run --package fnewsteer-mcp python -m fnewsteer_mcp --transport sse
# → http://localhost:8001
```

API is now live at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

---

## Authentication

All `/news/*` and `/admin/*` endpoints require an API key in the request header:

```
X-API-Key: your-secret-api-key-here
```

Generate a strong key:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Set it in your `.env` file as `FNEWSTEER_API_KEY`.

---

## Endpoints

### `GET /news/check` — Bot heartbeat (primary use)

Call this before every trade. Returns a binary `safe_to_trade` signal.

```bash
curl -H "X-API-Key: your-key" \
  "http://localhost:8000/news/check?symbol=EURUSD"
```

**Response:**

```json
{
  "safe_to_trade": false,
  "symbol": "EURUSD",
  "currencies_checked": ["EUR", "USD"],
  "checked_at": "2025-02-07T13:12:00Z",
  "blocking_events": [
    {
      "title": "Non-Farm Employment Change",
      "currency": "USD",
      "impact": "High",
      "event_time": "2025-02-07T13:30:00Z",
      "window_start": "2025-02-07T12:30:00Z",
      "window_end": "2025-02-07T14:30:00Z",
      "minutes_to_event": 18.0
    }
  ]
}
```

**Query parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `symbol` | string | required | Currency (`USD`) or pair (`EURUSD`) |
| `include_medium` | bool | `false` | Also block on Medium impact events |
| `window_minutes` | int | smart default | Override blackout window (1–1440 min) |

---

### `GET /news/upcoming` — Full week calendar

```bash
curl -H "X-API-Key: your-key" \
  "http://localhost:8000/news/upcoming?currency=USD&include_medium=false"
```

Returns all relevant events with their computed blackout windows.

---

### `GET /news/blackout-zones` — Backtesting avoid-list

```bash
curl -H "X-API-Key: your-key" \
  "http://localhost:8000/news/blackout-zones?currency=GBPUSD"
```

Returns a flat list of `{start, end, event, currency, impact}` blocks. Feed this into your backtesting engine to exclude news-contaminated zones.

---

### `GET /health` — Health check (no auth)

```bash
curl http://localhost:8000/health
```

```json
{ "status": "ok", "cache_age_seconds": 312.4, "cache_populated": true }
```

### `POST /admin/refresh-cache` — Force cache refresh

```bash
curl -X POST -H "X-API-Key: your-key" http://localhost:8000/admin/refresh-cache
```

---

## Smart Blackout Windows

FNEWSTEER applies different window sizes based on the event:

| Event Type                                       | Window      |
| ------------------------------------------------ | ----------- |
| FOMC, Federal Funds Rate, Interest Rate Decision | ±60 minutes |
| Non-Farm Payrolls (NFP)                          | ±60 minutes |
| CPI, GDP, Inflation, Monetary Policy             | ±60 minutes |
| All other High impact events                     | ±30 minutes |

Pass `window_minutes` to any endpoint to override for your specific strategy.

---

## Algo Bot Integration Example (Python)

```python
import httpx

FNEWSTEER_URL = "http://localhost:8000"
API_KEY = "your-secret-api-key-here"

def is_safe_to_trade(symbol: str) -> bool:
    """Returns True only if there are no active news blackout windows."""
    try:
        response = httpx.get(
            f"{FNEWSTEER_URL}/news/check",
            params={"symbol": symbol},
            headers={"X-API-Key": API_KEY},
            timeout=5.0,
        )
        response.raise_for_status()
        data = response.json()

        if not data["safe_to_trade"]:
            for event in data["blocking_events"]:
                print(
                    f"[FNEWSTEER] Blocked: {event['title']} ({event['currency']}) "
                    f"in {event['minutes_to_event']:.0f} min"
                )
        return data["safe_to_trade"]

    except Exception as e:
        # Fail safe — if the news check fails, don't trade
        print(f"[FNEWSTEER] Check failed: {e}. Blocking trade as precaution.")
        return False


# In your trading loop:
if is_safe_to_trade("EURUSD"):
    place_order(...)
else:
    print("Sitting on hands — news window active.")
```

---

## MCP Tools

| Tool                      | Description                                       |
| ------------------------- | ------------------------------------------------- |
| `check_safe_to_trade_now` | **Primary.** SAFE/NOT SAFE for a symbol right now |
| `get_upcoming_events`     | Full week calendar, filterable by currency        |
| `get_blackout_zones`      | Flat avoid-list (human + JSON). For backtesting   |
| `refresh_calendar`        | Force-bust the FF cache                           |
| `get_server_health`       | Verify data layer is live                         |

### Claude Desktop setup

Edit `claude_desktop_config.json` at:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "fnewsteer": {
      "command": "uv",
      "args": [
        "run",
        "--directory",
        "/absolute/path/to/fnewsteer-workspace",
        "--package",
        "fnewsteer-mcp",
        "python",
        "-m",
        "fnewsteer_mcp"
      ],
      "env": {
        "FNEWSTEER_API_KEY": "your-key"
      }
    }
  }
}
```

See `packages/mcp/claude_desktop_config.json` for the ready-to-use snippet.

---

---

## Docker

Both services are containerised and built from the **workspace root** as the
Docker build context. This is required because both Dockerfiles need access to
all `pyproject.toml` files to resolve the uv workspace dependency graph.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed and running
- `.env` file at the workspace root (copy from `.env.example`)

```bash
cp .env.example .env
# Edit .env — set FNEWSTEER_API_KEY at minimum
```

### Run both services

```bash
docker compose up --build
```

| Service               | URL                          |
| --------------------- | ---------------------------- |
| FastAPI (REST + docs) | http://localhost:8000        |
| FastAPI Swagger UI    | http://localhost:8000/docs   |
| MCP SSE server        | http://localhost:8001/sse    |
| MCP health            | http://localhost:8001/health |

### Run a single service

```bash
# API only
docker compose up --build api

# MCP only
docker compose up --build mcp
```

### Build images manually

Always run from the **workspace root**, not from inside a package directory:

```bash
# API
docker build -f packages/api/Dockerfile -t fnewsteer-api .

# MCP
docker build -f packages/mcp/Dockerfile -t fnewsteer-mcp .
```

### Connect Claude Desktop to the containerised MCP server

When the MCP container is running, point Claude Desktop at the SSE endpoint
instead of spawning a local subprocess. Update `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "fnewsteer": {
      "url": "http://localhost:8001/sse"
    }
  }
}
```

> **Note:** The `url` form (SSE transport) requires Claude Desktop version
> that supports remote MCP servers. The subprocess form (`command`/`args`)
> always works locally without Docker.

### Stop and clean up

```bash
docker compose down          # stop containers
docker compose down -v       # stop and remove volumes
docker system prune          # remove dangling images/layers
```

### Environment variables reference

| Variable            | Used by   | Description                                   |
| ------------------- | --------- | --------------------------------------------- |
| `FNEWSTEER_API_KEY` | API + MCP | Shared auth key for all protected endpoints   |
| `MCP_SSE_HOST`      | MCP       | Bind host for SSE server (default: `0.0.0.0`) |
| `MCP_SSE_PORT`      | MCP       | Bind port for SSE server (default: `8001`)    |

---

---

## Data Source

News data is sourced from the [ForexFactory](https://www.forexfactory.com/) JSON calendar feed and cached in memory for 60 minutes. All timestamps are normalized to UTC.

---
