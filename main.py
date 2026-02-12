import datetime
from fastapi import FastAPI
from ff_calendar import FFCcalendar
from datetime import timezone

app = FastAPI()
calendar = FFCcalendar(cache_dir="data", ttl_seconds=3600)  # 1 hour


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: str | None = None):
    return {"item_id": item_id, "q": q}

@app.get('/api/avoid')
def api_avoid():
    events = calendar.get_avoidance_events(
        watch_currencies=['USD', 'EUR', 'GBP', 'JPY'],
        min_impact='High'
    )
    return {
        'generated': datetime.datetime.now(timezone.utc).isoformat(),
        'cache_age_seconds': calendar.ttl,
        'events': events
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
    
    
    
    