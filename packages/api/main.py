import uvicorn

# Import FastAPI app so that `uvicorn main:app` works and tests can access the application.
# from app.app import app

if __name__ == "__main__":
    # When run as a script we still delegate to uvicorn using the full module path.
    uvicorn.run("app.app:app", host="0.0.0.0", port=8000, reload=True)



