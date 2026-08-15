# Server and component patterns

## Minimal server

Keep the server importable so the CLI and tests can load it without executing a `__main__` block.

```python
from fastmcp import FastMCP

mcp = FastMCP(
    "Nirantar",
    instructions=(
        "Manage personal consistency workflows. Read current state before "
        "making changes and confirm irreversible actions."
    ),
)


@mcp.tool
def health_summary() -> dict[str, str]:
    """Return a small diagnostic summary for this MCP server."""
    return {"status": "ok"}


if __name__ == "__main__":
    mcp.run()
```

The CLI imports the `mcp` object and does not execute the `__main__` block.

## Tool contract

- Use a verb-led snake_case name.
- Write a short docstring that explains the outcome, meaningful constraints, and side effects.
- Annotate every parameter and the return value.
- Prefer one Pydantic input model when fields are related or cross-field validation matters.
- Return a Pydantic result model for stable structured output.
- Avoid generic `dict[str, object]`, union-heavy parameters, `Any`, `*args`, and `**kwargs` in public schemas.
- Hide injected dependencies from the LLM using only APIs supported by the installed FastMCP version.

Example domain shape:

```python
from datetime import date
from pydantic import BaseModel, Field


class CheckInInput(BaseModel):
    habit_id: int = Field(gt=0, description="Habit to check in")
    on_date: date
    note: str | None = Field(default=None, max_length=500)


class CheckInResult(BaseModel):
    habit_id: int
    on_date: date
    status: str
    current_streak: int
```

The decorated function should delegate to a service rather than issue ORM queries itself.

## Primitive selection examples

| Need | Primitive | Example |
|---|---|---|
| Perform or query fresh work | Tool | `record_check_in`, `list_due_habits` |
| Read stable/passive context | Resource | `nirantar://habits/catalog` |
| Read parameterized context | Resource template | `nirantar://progress/{date}` |
| Reuse a conversation workflow | Prompt | `weekly_reflection` |

Do not expose the same behavior as both a tool and resource unless client compatibility requires it.

## Async and database work

- Use `async def` when the service awaits SQLAlchemy, HTTPX, or another async API.
- Create a session per call and close it deterministically.
- Commit within the service or unit-of-work boundary that owns the transaction.
- Never retain ORM entities, sessions, or transactions in MCP session state.
- Return detached Pydantic/domain results before the session closes.
- Make retries safe only when the operation is genuinely idempotent.

## Context

Use Context only when a component needs protocol features such as progress, client logging, resource reads, elicitation, request identity, or session state. Keep it out of public tool schemas using the annotation/injection pattern supported by the installed version.

For long work:

1. Report coarse progress at meaningful milestones.
2. Check cancellation where supported.
3. Avoid logging sensitive habit notes, tokens, database URLs, or raw exception details.
4. Use a background task only when work must outlive the request and the connected client supports it.

## Errors

- Raise specific validation or domain errors for expected failures.
- Tell the caller what can be corrected: missing habit, invalid date, already completed, or forbidden action.
- Log internal details server-side with redaction.
- Return generic internal failures to clients.
- Never expose SQL, tracebacks, filesystem paths, environment values, or tokens.

## Catalog size

Start with a few semantic tools. If the catalog becomes difficult for clients to select from, first merge overly granular tools and improve names/descriptions. Consider namespace, visibility, or tool-search transforms only after the catalog itself is well designed and the installed FastMCP version supports them.
