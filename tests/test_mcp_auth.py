import pytest
from httpx import ASGITransport, AsyncClient
from starlette.responses import PlainTextResponse

from nirantar.mcp.auth import RequireBearerPin


async def _ok_endpoint(scope, receive, send):
    response = PlainTextResponse("ok")
    await response(scope, receive, send)


@pytest.fixture
def protected_app():
    return RequireBearerPin(_ok_endpoint, get_expected_pin=lambda: "test-pin-123")


@pytest.mark.asyncio
async def test_mcp_auth_rejects_missing_header(protected_app) -> None:
    transport = ASGITransport(app=protected_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/")
    assert response.status_code == 401
    assert response.json()["detail"] == "Unauthorized"


@pytest.mark.asyncio
async def test_mcp_auth_rejects_wrong_pin(protected_app) -> None:
    transport = ASGITransport(app=protected_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(
            "/",
            headers={"Authorization": "Bearer wrong-pin"},
        )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_mcp_auth_accepts_matching_bearer_pin(protected_app) -> None:
    transport = ASGITransport(app=protected_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(
            "/",
            headers={"Authorization": "Bearer test-pin-123"},
        )
    assert response.status_code == 200
    assert response.text == "ok"


@pytest.mark.asyncio
async def test_mcp_auth_unavailable_when_pin_unset() -> None:
    app = RequireBearerPin(_ok_endpoint, get_expected_pin=lambda: None)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(
            "/",
            headers={"Authorization": "Bearer anything"},
        )
    assert response.status_code == 503
