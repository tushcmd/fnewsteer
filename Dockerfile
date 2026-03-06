# ---------------------------------------------------------------------------
# FNEWSTEER — Dockerfile
# Uses the official uv image for fast, reproducible dependency installation.
# ---------------------------------------------------------------------------

FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS builder

WORKDIR /app

# Copy dependency manifests first for layer caching
COPY pyproject.toml .

# Install dependencies into a virtual environment inside the image
RUN uv sync --no-dev --no-install-project

# Copy application source
COPY . .

# ---------------------------------------------------------------------------
# Runtime image — same base, just run
# ---------------------------------------------------------------------------
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

WORKDIR /app

# Copy the built venv and app from builder
COPY --from=builder /app /app

# Non-root user for security
RUN adduser --disabled-password --gecos "" fnewsteer
USER fnewsteer

# Expose the API port
EXPOSE 8000

# Load .env if present, then start Uvicorn
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
