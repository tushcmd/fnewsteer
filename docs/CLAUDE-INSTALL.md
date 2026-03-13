# FNEWSTEER MCP — Claude Installation Guide

FNEWSTEER gives Claude live awareness of high-impact economic events so you never
enter a trade during a news blackout window.

---

## Prerequisites

- [Claude Desktop](https://claude.ai/download) — the desktop app (not claude.ai in browser)
- Internet access (the server is hosted — nothing to install locally)

---

## Installation

1. Open your Claude Desktop config file:
   - **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

2. Add the fnewsteer entry (create the file if it doesn't exist):

```json
{
  "mcpServers": {
    "fnewsteer": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://fnewsteer-mcp.onrender.com/sse"]
    }
  }
}
```

3. Save the file and **fully restart Claude Desktop**.

---

## Verify the Connection

1. Start a new conversation in Claude Desktop
2. Click the **tools icon** (🔨) in the bottom-left of the input box
3. Confirm `fnewsteer` appears in the connected tools list
4. Ask Claude:

```
Check if it's safe to trade EURUSD right now
```

You should get a `✅ SAFE` or `🚫 NOT SAFE` response with full event details.

---

## Available Tools

| Tool                      | What it does                                                     |
| ------------------------- | ---------------------------------------------------------------- |
| `check_safe_to_trade_now` | **Primary tool.** Returns SAFE / NOT SAFE for a symbol right now |
| `get_upcoming_events`     | Lists all high-impact events for the current week                |
| `get_blackout_zones`      | Returns avoid-windows as human + machine-readable JSON           |
| `refresh_calendar`        | Force-busts the cache if you suspect stale data                  |
| `get_server_health`       | Verifies the data layer is up — use first in automated pipelines |

---

## Usage Examples

**Before placing any trade:**

```
Is it safe to trade GBPUSD?
```

**Planning a session:**

```
Show me all USD and EUR high-impact events this week
```

**Automated pipeline / backtesting:**

```
Get all blackout zones for this week as JSON
```

**Including medium-impact events:**

```
Check USDJPY safety, include medium impact news
```

---

## Notes

### Cold Starts

The server runs on Render and may sleep after inactivity.
The **first request after a sleep period can take 30–60 seconds** — this is normal.
Subsequent requests are fast.

### All Times Are UTC

All event times and blackout windows are returned in UTC. Convert to your local timezone as needed.

### Re-check Before Entry

A SAFE result is a point-in-time snapshot. If more than a few minutes pass between
checking and entering, **ask Claude to check again**.

---

## Troubleshooting

**Tools don't appear in Claude**

- MCP tools are only available in **Claude Desktop** — not the claude.ai browser interface
- Confirm the JSON is valid (no trailing commas, correct nesting)
- Fully quit and relaunch Claude Desktop — a window reload is not enough

**Connection timeout on first use**

- The server may be cold-starting — wait 60s and ask again

**Stale event data**

- Ask Claude to run `refresh_calendar` to force a fresh fetch from ForexFactory

---

## Support

Open an issue on [GitHub](https://github.com/tushcmd/fnewsteer/issues) or reach out directly.
