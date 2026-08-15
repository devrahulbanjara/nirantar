# Mandatory live FastMCP documentation routing

FastMCP changes quickly. Always consult the live main website at <https://gofastmcp.com/> before answering, designing, or implementing any FastMCP task. The website is the authority for the latest recommended approach; the installed version determines whether that approach can be used immediately.

## Required routing sequence

1. Open the main website: <https://gofastmcp.com/>.
2. Fetch the live documentation index: <https://gofastmcp.com/llms.txt>.
3. Route from that index to the relevant canonical, unversioned page on `gofastmcp.com` and read it live.
4. Do not rely only on this reference file, model memory, search-result snippets, copied documentation, or old `/v2/` URLs.
5. Inspect `pyproject.toml` and `uv.lock`, then run `uv run python -c "import fastmcp; print(fastmcp.__version__)"`.
6. Check feature version badges and release notes because the main website reflects FastMCP's `main` branch and may include unreleased features.
7. If current guidance requires a newer release, consult the official upgrade guide and make the upgrade decision explicit. Do not silently substitute an obsolete pattern.
8. Confirm uncertain imports and signatures through local introspection before editing code.

## Route by task

Use this table only after opening the live index. Reconfirm the destination there because documentation routes can change.

| Task | Official page |
|---|---|
| Install and start | <https://gofastmcp.com/getting-started/installation> and <https://gofastmcp.com/getting-started/quickstart> |
| Understand major-version changes | <https://gofastmcp.com/getting-started/whats-new> and the relevant upgrading guide |
| Server construction | <https://gofastmcp.com/servers/server> |
| Tools and structured output | <https://gofastmcp.com/servers/tools> |
| Resources and templates | <https://gofastmcp.com/servers/resources> |
| Prompts | <https://gofastmcp.com/servers/prompts> |
| Context, logs, and progress | <https://gofastmcp.com/servers/context>, <https://gofastmcp.com/servers/logging>, and <https://gofastmcp.com/servers/progress> |
| Lifespan and dependencies | <https://gofastmcp.com/servers/lifespan> and <https://gofastmcp.com/servers/dependency-injection> |
| Sessions and long work | <https://gofastmcp.com/servers/sessions> and <https://gofastmcp.com/servers/tasks> |
| Authentication and authorization | <https://gofastmcp.com/servers/auth/authentication> and <https://gofastmcp.com/servers/authorization> |
| FastAPI integration | <https://gofastmcp.com/integrations/fastapi> |
| OpenAPI conversion | <https://gofastmcp.com/integrations/openapi> |
| Testing | <https://gofastmcp.com/servers/testing> |
| Running and HTTP deployment | <https://gofastmcp.com/deployment/running-server> and <https://gofastmcp.com/deployment/http> |
| `fastmcp.json` | <https://gofastmcp.com/deployment/server-configuration> |
| CLI run, inspect, and client calls | <https://gofastmcp.com/cli/running>, <https://gofastmcp.com/cli/inspecting>, and <https://gofastmcp.com/cli/client> |
| Python client and transports | <https://gofastmcp.com/clients/client> and <https://gofastmcp.com/clients/transports> |
| Claude Code setup | <https://gofastmcp.com/integrations/claude-code> |
| Generic MCP JSON config | <https://gofastmcp.com/integrations/mcp-json-configuration> |
| Apps and interactive UI | <https://gofastmcp.com/apps/overview> |

## Advanced features

Read advanced pages only when the requirement calls for them:

- transforms for renaming, schemas, namespaces, tool search, code mode, resources-as-tools, or prompts-as-tools;
- providers for filesystem discovery, proxying, skill exposure, or dynamic component catalogs;
- middleware for cross-cutting request behavior;
- storage backends for persistent or distributed OAuth/session state;
- versioning when one deployment must serve multiple public API versions;
- apps for interactive UI inside compatible MCP hosts;
- OpenTelemetry for production tracing.

Do not add these features solely because the framework supports them.
