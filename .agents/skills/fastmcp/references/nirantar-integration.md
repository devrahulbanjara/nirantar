# Nirantar integration

## Default architecture

Use a thin MCP adapter over the same services used by FastAPI:

```text
FastAPI routes ----\
                   -> application services -> repositories -> PostgreSQL
FastMCP tools -----/
```

This keeps validation, authorization, transactions, and business rules consistent without making internal HTTP requests.

## Curate instead of mirroring

Automatic OpenAPI conversion is useful for a prototype, but a full REST schema usually produces too many low-level, awkwardly named tools. For Nirantar, design a small MCP surface around user intents.

Recommended early operations:

- Read today's due habits.
- Record or amend a check-in.
- Explain current streak and recent consistency.
- Produce a weekly summary.
- Read habit definitions and schedule context.

Avoid raw table CRUD, arbitrary SQL, generic file access, and bulk deletion.

## FastAPI integration decision

Choose one:

1. **Mounted HTTP app**: Use when the existing FastAPI process should serve both REST and MCP. Create a FastMCP HTTP ASGI app, mount it under an explicit path, and combine both lifespans using the installed version's documented API.
2. **Separate HTTP process**: Use when independent scaling, authentication, failure isolation, or deployment is needed. Share services and repositories, not process state.
3. **Stdio server**: Use for local Claude Code, Codex, or desktop-client access. Keep stdout protocol-clean; send diagnostics to stderr/logging.
4. **`from_fastapi` prototype**: Use only for a small, reviewed route surface or short-lived bootstrap. Replace generated names and schemas with curated tools when the workflow stabilizes.

## Lifespan checklist

- Preserve FastAPI's existing startup and shutdown context.
- Enter the MCP lifespan exactly once.
- Initialize shared engines and clients once, but create request-scoped sessions.
- Close resources in reverse order.
- Test startup and shutdown, not only component calls.
- Do not silently replace an existing lifespan when mounting MCP.

## Authentication and user scope

- Local stdio inherits the local process trust boundary; still restrict available operations.
- Remote HTTP requires bearer-token or OAuth verification supported by the deployed clients and installed FastMCP version.
- Obtain the principal from verified request context.
- Never accept authority from an exposed `user_id`, role, or owner parameter.
- Apply authorization inside the service or repository boundary as well as component visibility.
- Consider future multi-user isolation even if the first deployment has one user.

## Mutation policy

Classify tools:

- **Read-only**: due habits, summaries, definitions.
- **Reversible mutation**: record or amend a check-in; return the changed record and enough context to undo it.
- **Irreversible/high-impact**: delete history, bulk reschedule, external notification. Require explicit confirmation or a dedicated approval flow.

Use MCP annotations when supported to help clients present appropriate UI, but enforce the policy in code.

## Avoid needless infrastructure

For this personal app, prefer:

- one curated server;
- direct service calls;
- in-memory client tests;
- stdio locally or one mounted HTTP endpoint;
- existing PostgreSQL persistence;
- environment-based secrets.

Add providers, transforms, distributed storage, task queues, apps, or multiple server versions only for a demonstrated need.
