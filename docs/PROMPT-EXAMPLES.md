# PROMPT-EXAMPLES

Here are prompts to try once connected:

---

**Basic safety check:**

```
Is it safe to trade EURUSD right now?
```

**Multi-pair check:**

```
Check if any of these are safe to trade right now: EURUSD, GBPUSD, USDJPY
```

**Session planning:**

```
I'm about to start my trading session. What high-impact news events
should I be aware of this week for USD and EUR pairs?
```

**Blackout zones for backtesting:**

```
Give me all the blackout zones for USD this week in JSON format
so I can paste them into my backtest config
```

**Full week briefing:**

```
Give me a complete news risk briefing for this week. Organise it
by day, show all high-impact events and their blackout windows.
```

**Health check first:**

```
First verify the news data is fresh, then tell me if GBPJPY is
safe to trade
```

**Include medium impact:**

```
Check AUDUSD but also include medium impact events in the assessment
```

**Agentic guard (paste as a system prompt in a Project):**

```
Before taking any action involving a trade entry, exit, or modification,
you must call check_safe_to_trade_now with the relevant symbol. If NOT SAFE,
halt and report which event is blocking and when the window clears.
Never skip this check.
```
