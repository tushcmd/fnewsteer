# ff_calendar.py - Production ready
import requests
import json
import os
import time
from datetime import datetime, timedelta
from pathlib import Path

class FFCcalendar:
    """Thread-safe ForexFactory calendar with shared file coordination"""
    
    # Official URL - DO NOT CHANGE
    FF_JSON_URL = "https://nfs.faireconomy.media/ff_calendar_thisweek.json"
    
    # Responsible defaults - WELL within rate limits
    DEFAULT_CACHE_TTL = 3600  # 60 seconds * 60 minutes = 1 hour
    MAX_CACHE_AGE = 86400     # 24 hours - acceptable for avoidance
    
    def __init__(self, cache_dir="cache", ttl_seconds=None):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)
        self.cache_file = self.cache_dir / "ff_calendar_thisweek.json"
        self.ttl = ttl_seconds or self.DEFAULT_CACHE_TTL
        
    def _is_cache_fresh(self):
        """Check if cached file exists and is within TTL"""
        if not self.cache_file.exists():
            return False
        
        file_age = time.time() - self.cache_file.stat().st_mtime
        return file_age < self.ttl
    
    def _read_cache(self):
        """Read events from cache file"""
        try:
            with open(self.cache_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return None
    
    def _write_cache(self, data):
        """Write events to cache file"""
        with open(self.cache_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
    
    def get_events(self, force_refresh=False):
        """
        Get calendar events.
        Respects rate limits: maximum 1 request per hour per instance.
        Returns None only if no data is available.
        """
        # 1. Return cached data if fresh
        if not force_refresh and self._is_cache_fresh():
            cached = self._read_cache()
            if cached:
                return cached
        
        # 2. Need fresh data - download (max once per hour)
        try:
            response = requests.get(
                self.FF_JSON_URL, 
                timeout=15,
                headers={'User-Agent': 'Mozilla/5.0 (compatible; NewsAvoidance/1.0)'}
            )
            
            if response.status_code == 200:
                # Verify we got JSON, not HTML error
                content_type = response.headers.get('content-type', '')
                if 'application/json' in content_type or response.text.strip().startswith('['):
                    data = response.json()
                    self._write_cache(data)
                    return data
                else:
                    # Rate limited or server error - use old cache
                    print("Warning: Received non-JSON response (rate limit?)")
                    return self._read_cache()
            else:
                print(f"HTTP {response.status_code}: Using cached data")
                return self._read_cache()
                
        except Exception as e:
            print(f"Download failed: {e} - using cache")
            return self._read_cache()
    
    def get_avoidance_events(self, watch_currencies=None, min_impact='High'):
        """
        Get events formatted specifically for trading avoidance.
        This is what your web app will call.
        """
        events = self.get_events()
        if not events:
            return []
        
        # Normalize impact levels
        impact_levels = {'High', 'Medium'} if min_impact == 'Medium' else {'High'}
        
        avoidance = []
        for event in events:
            # Skip if not high enough impact
            if event.get('impact') not in impact_levels:
                continue
            
            # Skip if not in our watch currencies
            if watch_currencies and event.get('currency') not in watch_currencies:
                continue
            
            # Parse datetime
            event_date = event.get('date', '')
            event_time = event.get('time', '')
            
            avoidance.append({
                'currency': event.get('currency'),
                'country': event.get('country'),
                'event': event.get('title'),
                'impact': event.get('impact'),
                'date': event_date,
                'time': event_time,
                'forecast': event.get('forecast', '—'),
                'previous': event.get('previous', '—'),
                'avoid_window': {
                    'start': f"{event_date} {event_time} -15min",
                    'end': f"{event_date} {event_time} +30min"
                }
            })
        
        return avoidance
    
    