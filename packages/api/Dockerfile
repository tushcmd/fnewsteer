# =============================================================================
# FNEWSTEER API — Dockerfile
# Build context: workspace root (fnewsteer/)
#
# docker build -f packages/api/Dockerfile -t fnewsteer-api .
# docker run -p 8000:8000 --env-file .env fnewsteer-api
# =============================================================================

FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS builder

WORKDIR /app

# ── Dependency layer (cached unless pyproject files change) ───────────────────
# Copy all workspace manifests so uv can resolve the full workspace graph
COPY pyproject.toml ./pyproject.toml
COPY packages/api/pyproject.toml ./packages/api/pyproject.toml

# Stub the mcp package so the workspace resolves without its source
RUN mkdir -p packages/mcp && \
    printf '[project]\nname="fnewsteer-mcp"\nversion="0.0.0"\nrequires-python=">=3.11"\n' \
    > packages/mcp/pyproject.toml

# Install only the API package and its dependencies (no dev deps)
RUN uv sync --package fnewsteer-api --no-dev

# ── Source layer ──────────────────────────────────────────────────────────────
COPY packages/api/ ./packages/api/

# =============================================================================
# Runtime image
# =============================================================================
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

WORKDIR /app

COPY --from=builder /app /app

RUN adduser --disabled-password --gecos "" fnewsteer \
    && chown -R fnewsteer:fnewsteer /app
USER fnewsteer

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

CMD ["uv", "run", "--package", "fnewsteer-api", \
     "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]