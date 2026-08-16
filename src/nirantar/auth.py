from typing import Annotated

from clerk_backend_api import AuthenticateRequestOptions, authenticate_request
from fastapi import Depends, HTTPException, Request, status

from nirantar.config import get_settings


def require_user(request: Request) -> str:
    """Return the verified Clerk user ID for an API request."""
    settings = get_settings()
    if not settings.clerk_secret_key and not settings.clerk_jwt_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication is not configured",
        )

    state = authenticate_request(
        request,
        AuthenticateRequestOptions(
            secret_key=settings.clerk_secret_key,
            jwt_key=settings.clerk_jwt_key,
            authorized_parties=settings.clerk_authorized_parties,
            accepts_token=["session_token"],
        ),
    )
    if not state.is_signed_in or not state.payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    subject = state.payload.get("sub")
    if not isinstance(subject, str) or not subject:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication subject",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return subject


CurrentUserId = Annotated[str, Depends(require_user)]
