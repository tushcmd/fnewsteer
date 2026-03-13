# =============================================================================
# FNEWSTEER MCP — Dockerfile (SSE transport)
# Build context: workspace root (fnewsteer/)
#
# docker build -f packages/mcp/Dockerfile -t fnewsteer-mcp .
# docker run -p 8001:8001 --env-file .env fnewsteer-mcp
#
# MCP clients connect to: http://your-host:8001/sse
# =============================================================================

FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS builder

WORKDIR /app

# ── Dependency layer (cached unless pyproject files change) ───────────────────
# All three manifests needed: root workspace + both packages
COPY pyproject.toml ./pyproject.toml
COPY packages/api/pyproject.toml  ./packages/api/pyproject.toml
COPY packages/mcp/pyproject.toml  ./packages/mcp/pyproject.toml

# Install the MCP package and its deps (which pulls in fnewsteer-api too,
# since it's declared as a workspace dependency)
RUN uv sync --package fnewsteer-mcp --no-dev

# ── Source layer ──────────────────────────────────────────────────────────────
# Both packages needed: mcp imports directly from app.services.*
COPY packages/api/ ./packages/api/
COPY packages/mcp/ ./packages/mcp/

# =============================================================================
# Runtime image
# =============================================================================
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

WORKDIR /app

COPY --from=builder /app /app

# RUN adduser --disabled-password --gecos "" fnewsteer \
#     && chown -R fnewsteer:fnewsteer /app

# USER fnewsteer

# EXPOSE 8001
# changed from 8001 to match render free tier
EXPOSE 10000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:8001/health')"

CMD ["uv", "run", "--package", "fnewsteer-mcp", \
     "python", "packages/mcp/server.py", "--transport", "sse"]