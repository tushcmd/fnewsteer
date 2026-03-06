FF_JSON_URL = "https://nfs.faireconomy.media/ff_calendar_thisweek.json"

CACHE_TTL_SECONDS = 3600  # 1 hour

# Default blackout windows (minutes before and after event)
DEFAULT_WINDOW_MINUTES = 30
EXTENDED_WINDOW_MINUTES = 60

# Event title keywords that trigger the extended window
EXTENDED_WINDOW_KEYWORDS = [
    "non-farm",
    "nfp",
    "fomc",
    "federal funds rate",
    "interest rate decision",
    "rate decision",
    "cpi",
    "gdp",
    "inflation",
    "central bank",
    "monetary policy",
    "employment change",
    "unemployment rate",
]

# Known major currency codes
KNOWN_CURRENCIES = {
    "USD", "EUR", "GBP", "JPY", "AUD", "NZD", "CAD", "CHF",
    "CNY", "CNH", "HKD", "SGD", "NOK", "SEK", "DKK", "MXN",
    "ZAR", "TRY", "BRL", "INR",
}

# Impact level constants
IMPACT_HIGH = "High"
IMPACT_MEDIUM = "Medium"
IMPACT_LOW = "Low"
