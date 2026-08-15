from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI
from fastmcp.utilities.lifespan import combine_lifespans

from nirantar.api import workouts_router
from nirantar.config import get_settings
from nirantar.db.session import dispose_engine, get_engine
from nirantar.mcp.auth import RequireBearerPin
from nirantar.mcp.server import mcp


@asynccontextmanager
async def app_lifespan(_app: FastAPI) -> AsyncIterator[None]:
    get_engine()
    try:
        yield
    finally:
        await dispose_engine()


mcp_app = mcp.http_app(path="/")
protected_mcp_app = RequireBearerPin(
    mcp_app,
    get_expected_pin=lambda: get_settings().nirantar_mcp_pin,
)

app = FastAPI(
    title="Nirantar",
    version="0.1.0",
    lifespan=combine_lifespans(app_lifespan, mcp_app.lifespan),
)
app.include_router(workouts_router)
app.mount("/mcp", protected_mcp_app)


@app.get("/", tags=["health"])
async def root() -> dict[str, str]:
    """Simple root endpoint for the deployed service."""
    return {
        "name": "Nirantar",
        "status": "ok",
        "docs": "/docs",
        "health": "/health",
        "mcp": "/mcp",
    }


@app.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    """Liveness probe for Render and other orchestrators."""
    return {"status": "ok"}
