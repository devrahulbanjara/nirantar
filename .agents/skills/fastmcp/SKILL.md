---
name: fastmcp
description: Build, integrate, test, and deploy Python MCP servers and clients with the standalone FastMCP package, always consulting the live main FastMCP website for current guidance first. Use for FastMCP tools, resources, prompts, Context, clients, transports, FastAPI mounting, authentication, lifespans, testing, fastmcp.json, or exposing Nirantar capabilities to MCP clients. Also use when reviewing or upgrading existing FastMCP code across major versions.
---

# FastMCP for Nirantar

Build a small, curated MCP interface over Nirantar's application services. Optimize for this personal consistency app: clear habit and check-in operations, safe defaults, structured results, and little infrastructure.

## Start with the live main website

For every FastMCP task, route to the live main website before designing, answering, or editing code. This is mandatory even when the API seems familiar.

1. Open <https://gofastmcp.com/> and its current index at <https://gofastmcp.com/llms.txt>.
2. Select the relevant canonical, unversioned `gofastmcp.com` page from the live index and read it. Do not default to cached knowledge, search snippets, copied docs, or old `/v2/` routes.
3. Read [official-docs.md](references/official-docs.md) for task routing, but use its links as entry points to the live website rather than as a substitute for browsing it.
4. Read `AGENTS.md`, `pyproject.toml`, `uv.lock`, and the relevant application modules.
5. Determine the installed and locked FastMCP versions before choosing APIs:

   ```powershell
   uv run python -c "import fastmcp; print(fastmcp.__version__)"
   uv tree --package fastmcp
   ```

6. Treat the main website as the authority for the latest recommended design. Because it reflects the upstream `main` branch, check feature version badges and release status before assuming a feature exists in the installed package.
7. Reconcile current guidance with the local lock. If the current approach needs a newer release, use the official upgrade guide and propose or perform an explicit dependency upgrade within the task's scope; otherwise implement the compatible form and state the constraint.
8. Prefer the standalone import `from fastmcp import FastMCP`; do not use `mcp.server.fastmcp.FastMCP`, which belongs to the MCP Python SDK's separate implementation.
9. Verify uncertain symbols and signatures against the installed package after consulting the live docs.

## Choose the right MCP primitive

- Use a **tool** for an action, computation, search, or fresh query. In Nirantar, examples include `list_due_habits`, `record_check_in`, `skip_habit`, and `get_weekly_summary`.
- Use a **resource** for passive, addressable context that clients read, such as habit definitions, today's plan, or a progress snapshot.
- Use a **resource template** when the resource URI contains an identifier or date.
- Use a **prompt** only for a reusable user-facing conversation workflow. Do not move business logic into prompts.
- Use a **FastMCP client** for programmatic calls, integration tests, or connecting to another MCP server.

Read [server-patterns.md](references/server-patterns.md) before implementing components, Context behavior, schemas, or error handling.

## Design for Nirantar

Follow these defaults unless the codebase establishes a different pattern:

1. Expose user goals, not database tables. Prefer `record_check_in` over `create_habit_log_row`.
2. Keep business logic in services and persistence in repositories. MCP tools should validate input, authorize the operation, call a service, and map the result.
3. Call Python services directly. Do not make loopback HTTP calls to Nirantar's own FastAPI routes.
4. Reuse Pydantic request and result models where their public semantics match. Create MCP-specific models when the LLM-facing schema should be smaller or clearer.
5. Return typed, structured output. Avoid prose-only results for domain operations.
6. Make tool names and docstrings unambiguous without relying on hidden server instructions.
7. Keep the initial catalog small. Add a tool only when it supports a concrete user workflow.
8. Avoid speculative transforms, providers, apps, background tasks, or distributed state until the use case requires them.

Suggested organization as the MCP surface grows:

```text
src/nirantar/
|-- mcp/
|   |-- __init__.py
|   |-- server.py
|   |-- tools.py
|   |-- resources.py
|   `-- prompts.py
|-- services/
|-- repositories/
`-- schemas/
tests/
`-- mcp/
```

Keep a single `server.py` while the interface is small; split only when it improves navigation.

## Implement components

1. Instantiate one importable server object with a stable name and concise instructions.
2. Add fully annotated functions. Never expose `*args` or `**kwargs`.
3. Use Pydantic models or precise Python types for non-trivial input and output.
4. Use `async def` for async database or network work and `def` for blocking libraries. Never call blocking work inside an async tool.
5. Acquire a fresh database session per invocation through the application's session factory or service boundary. Do not share an `AsyncSession` globally.
6. Use MCP Context for progress, client-visible logs, request metadata, or session state only when necessary; do not use it as a service locator for ordinary business logic.
7. Convert expected domain failures into concise, actionable errors. Mask stack traces, SQL, secrets, and internal paths from clients.
8. Add read-only, destructive, and idempotency annotations when supported by the installed version. Treat annotations as hints, never as authorization.

## Integrate with FastAPI

For Nirantar's HTTP application, prefer a curated FastMCP server mounted into FastAPI over automatic exposure of every REST endpoint.

- Use `FastMCP.from_fastapi(...)` only to bootstrap a prototype or expose a deliberately small router. Review generated tool names and schemas before keeping it.
- For a shared HTTP process, create the FastMCP ASGI app with the installed version's supported API, mount it under an explicit path, and combine FastAPI and MCP lifespans.
- Preserve existing database startup and shutdown behavior when combining lifespans.
- Keep REST and MCP authentication boundaries explicit.
- Avoid application-wide CORS around an OAuth-protected MCP app; isolate sub-app middleware when CORS is needed.
- Use stdio for local host-launched integrations. Use Streamable HTTP for remote or shared access. Do not start new work on legacy SSE transport.

Read [nirantar-integration.md](references/nirantar-integration.md) for the integration decision and safety checklist. Apply the separate `fastapi` and `sqlalchemy-postgres` skills when the task also changes those layers.

## Secure mutations

- Bind unauthenticated development HTTP servers to `127.0.0.1`.
- Require authentication and authorization before exposing HTTP beyond the local machine.
- Derive the acting user from verified identity, not a caller-supplied `user_id`.
- Scope every query and mutation to that identity even though Nirantar is currently personal-use software.
- Keep credentials in environment variables or secret storage, never source, `fastmcp.json`, logs, tool schemas, or tool results.
- Require an explicit confirmation or approval flow for irreversible deletion, bulk changes, external messages, or other high-impact operations.
- Do not rely on component visibility or tool annotations as a security boundary.

## Test and verify

1. Unit-test application services separately from MCP transport.
2. Use FastMCP's in-memory client transport for component tests; do not launch a network server for ordinary tests.
3. Assert component discovery, structured schemas, successful calls, validation failures, authorization failures, and sanitized errors.
4. Add tests proving user scoping for every data-returning or mutating tool.
5. Run the narrow MCP tests, then the relevant project suite.
6. Inspect the server catalog with the version-compatible FastMCP CLI or MCP Inspector before handoff.
7. Verify both stdio and HTTP only when both are supported deployment targets.

Read [testing-deployment.md](references/testing-deployment.md) before writing tests, `fastmcp.json`, client configuration, or deployment instructions.

## Completion checklist

- Confirm code matches the locked FastMCP major version.
- Confirm each exposed component serves a real Nirantar workflow.
- Confirm MCP adapters contain no duplicated domain or persistence logic.
- Confirm all public inputs and outputs are typed and understandable to an LLM.
- Confirm async and lifespan ownership is correct.
- Confirm authentication, user scoping, destructive behavior, and error masking.
- Confirm in-memory component tests pass.
- Document the exact local run or client configuration command without secrets.
