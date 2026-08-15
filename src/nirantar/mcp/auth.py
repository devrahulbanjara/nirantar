"""HTTP auth gate for the mounted MCP ASGI app."""

from __future__ import annotations

import secrets
from collections.abc import Callable

from starlette.datastructures import Headers
from starlette.responses import Response
from starlette.types import ASGIApp, Receive, Scope, Send


class RequireBearerPin:
    """Reject HTTP requests that do not present a matching Bearer PIN."""

    def __init__(
        self,
        app: ASGIApp,
        *,
        get_expected_pin: Callable[[], str | None],
    ) -> None:
        self.app = app
        self.get_expected_pin = get_expected_pin

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] not in {"http", "websocket"}:
            await self.app(scope, receive, send)
            return

        expected = self.get_expected_pin()
        if not expected:
            await Response(
                content='{"detail":"MCP authentication is not configured"}',
                status_code=503,
                media_type="application/json",
            )(scope, receive, send)
            return

        headers = Headers(scope=scope)
        provided = _extract_bearer_token(headers.get("authorization"))
        if provided is None or not secrets.compare_digest(provided, expected):
            await Response(
                content='{"detail":"Unauthorized"}',
                status_code=401,
                media_type="application/json",
                headers={"WWW-Authenticate": "Bearer"},
            )(scope, receive, send)
            return

        await self.app(scope, receive, send)


def _extract_bearer_token(authorization: str | None) -> str | None:
    if authorization is None:
        return None
    scheme, _, value = authorization.partition(" ")
    if scheme.lower() != "bearer" or not value:
        return None
    return value.strip()
