# Testing and deployment

## In-memory tests

Use FastMCP's client against the server object. Exact imports and result wrappers can change across major versions, so verify them locally.

```python
import pytest
from fastmcp import Client

from nirantar.mcp.server import mcp


@pytest.fixture
async def mcp_client():
    async with Client(mcp) as client:
        yield client


async def test_lists_expected_tools(mcp_client: Client):
    tools = await mcp_client.list_tools()
    names = {tool.name for tool in tools}
    assert "list_due_habits" in names
```

Configure pytest's async mode if the project uses `pytest-asyncio`:

```toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
```

Test at least:

- component names, descriptions, and schemas;
- valid and invalid calls;
- structured result data;
- missing and unauthorized records;
- cross-user isolation;
- repeated calls for idempotent operations;
- sanitized internal errors;
- lifespan setup and cleanup;
- cancellation or progress for long-running work.

## Local inspection

Prefer commands through the project's uv environment. Verify command syntax against the installed major version.

```powershell
uv run fastmcp inspect src/nirantar/mcp/server.py:mcp
uv run fastmcp run src/nirantar/mcp/server.py:mcp
uv run fastmcp run src/nirantar/mcp/server.py:mcp --transport http --port 8000
```

The default stdio transport is appropriate for a local MCP host. Use HTTP only when a network endpoint is intended.

## `fastmcp.json`

Use declarative configuration when it makes execution reproducible and the locked FastMCP version supports the needed schema. Keep only non-secret configuration in source control.

```json
{
  "$schema": "https://gofastmcp.com/public/schemas/fastmcp.json/v1.json",
  "source": {
    "path": "src/nirantar/mcp/server.py",
    "entrypoint": "mcp"
  },
  "deployment": {
    "transport": "stdio",
    "log_level": "INFO"
  }
}
```

Do not duplicate dependencies from `pyproject.toml` unless an isolated FastMCP environment genuinely needs them. Never commit credentials in the `env` object; interpolate environment variables instead.

## Transport and production rules

- Use stdio for a client-launched local process.
- Use Streamable HTTP for shared or remote service access.
- Treat SSE as legacy and avoid it for new work.
- Bind local unauthenticated HTTP to `127.0.0.1`.
- Add authentication before binding to a non-loopback interface.
- Put TLS at the application or trusted reverse-proxy boundary.
- Set timeouts and request limits appropriate to the operation.
- Emit structured server logs without tool inputs that may contain private notes.
- Add health checks for HTTP deployment without exposing sensitive diagnostics.

## Client configuration

Generate or document client configuration only after confirming:

- the absolute command and working directory;
- stdio versus HTTP transport;
- the exact MCP endpoint path;
- required environment-variable names;
- authentication support in the target client.

Do not place secret values in checked-in Claude, Codex, Cursor, or generic MCP JSON configuration.
