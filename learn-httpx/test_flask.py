# Usimg httpx to test Web Apps
"""
Calling into Python Web Apps
You can configure an httpx client to call directly into a Python web application using the WSGI protocol.

-Using httpx as a client inside test cases.
-Mocking out external services during tests or in dev/staging environments.
"""

from flask import flask
import httpx

app = Flask(__name__)

@app.route("/")
def hello():
    return "Hello World!"

with httpx.Client(app=app, base_url="http://testserver") as client:
    r = client.get("/")
    print(r.text)
    assert r.status_code == 200
    assert r.text == "Hello World"