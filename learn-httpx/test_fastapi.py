# https://fastapi.tiangolo.com/advanced/async-tests/
from fastapi import FastAPI
import httpx
import pytest

app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Tomato"}


import pytest
from httpx import AsyncClient

@pytest.mark.anyio
async def test_root():
    async with httpx.AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/")
        
    assert response.status_code == 200
    assert response.json() == {"message": "Tomato"}
    