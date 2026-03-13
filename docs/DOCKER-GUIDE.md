# Docker Guide

---

## Docker

Both services are containerised and built from the **workspace root** as the
Docker build context. This is required because both Dockerfiles need access to
all `pyproject.toml` files to resolve the uv workspace dependency graph.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed and running
- `.env` file at the workspace root (copy from `.env.example`)

```bash
cp .env.example .env
# Edit .env — set FNEWSTEER_API_KEY at minimum
```

### Run both services

```bash
docker compose up --build
```

| Service               | URL                          |
| --------------------- | ---------------------------- |
| FastAPI (REST + docs) | http://localhost:8000        |
| FastAPI Swagger UI    | http://localhost:8000/docs   |
| MCP SSE server        | http://localhost:8001/sse    |
| MCP health            | http://localhost:8001/health |

### Run a single service

```bash
# API only
docker compose up --build api

# MCP only
docker compose up --build mcp
```

### Build images manually

Always run from the **workspace root**, not from inside a package directory:

```bash
# API
docker build -f packages/api/Dockerfile -t fnewsteer-api .

# MCP
docker build -f packages/mcp/Dockerfile -t fnewsteer-mcp .
```

### Connect Claude Desktop to the containerised MCP server

When the MCP container is running, point Claude Desktop at the SSE endpoint
instead of spawning a local subprocess. Update `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "fnewsteer": {
      "url": "http://localhost:8001/sse"
    }
  }
}
```

> **Note:** The `url` form (SSE transport) requires Claude Desktop version
> that supports remote MCP servers. The subprocess form (`command`/`args`)
> always works locally without Docker.

### Stop and clean up

```bash
docker compose down          # stop containers
docker compose down -v       # stop and remove volumes
docker system prune          # remove dangling images/layers
```

### Environment variables reference

| Variable            | Used by   | Description                                   |
| ------------------- | --------- | --------------------------------------------- |
| `FNEWSTEER_API_KEY` | API + MCP | Shared auth key for all protected endpoints   |
| `MCP_SSE_HOST`      | MCP       | Bind host for SSE server (default: `0.0.0.0`) |
| `MCP_SSE_PORT`      | MCP       | Bind port for SSE server (default: `8001`)    |
