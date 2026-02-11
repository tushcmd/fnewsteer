import datetime
from flask import Flask, jsonify, render_template
from ff_calendar import FFCcalendar
from datetime import timezone  # Add this import

app = Flask(__name__)
calendar = FFCcalendar(cache_dir="data", ttl_seconds=3600)  # 1 hour

@app.route('/api/avoid')
def api_avoid():
    events = calendar.get_avoidance_events(
        watch_currencies=['USD', 'EUR', 'GBP', 'JPY'],
        min_impact='High'
    )
    return jsonify({
        'generated': datetime.datetime.now(timezone.utc).isoformat(),  # Fixed
        'cache_age_seconds': calendar.ttl,
        'events': events
    })