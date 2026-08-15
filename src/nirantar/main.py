from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI
from fastmcp.utilities.lifespan import combine_lifespans

from nirantar.api import workouts_router
from nirantar.db.session import dispose_engine, get_engine
from nirantar.mcp.server import mcp


@asynccontextmanager
async def app_lifespan(_app: FastAPI) -> AsyncIterator[None]:
    get_engine()
    try:
        yield
    finally:
        await dispose_engine()


mcp_app = mcp.http_app(path="/")
app = FastAPI(
    title="Nirantar",
    version="0.1.0",
    lifespan=combine_lifespans(app_lifespan, mcp_app.lifespan),
)
app.include_router(workouts_router)
app.mount("/mcp", mcp_app)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
