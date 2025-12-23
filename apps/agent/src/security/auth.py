"""Supabase JWT authentication for the Deep Research Agent.

This module provides authentication and authorization handlers
that validate JWT tokens from Supabase and scope resources per user.
"""

import os
from typing import Any

import httpx
from langgraph_sdk import Auth

# Supabase configuration from environment
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")

auth = Auth()


@auth.authenticate
async def authenticate(headers: dict[bytes, bytes]) -> Auth.types.MinimalUserDict:
    """Validate JWT token from Supabase.

    Args:
        headers: Request headers containing the Authorization token.

    Returns:
        User information dictionary with identity and metadata.

    Raises:
        HTTPException: If token is missing or invalid.
    """
    # Extract authorization header
    authorization = headers.get(b"authorization", b"").decode()

    if not authorization.startswith("Bearer "):
        raise Auth.exceptions.HTTPException(
            status_code=401,
            detail="Missing or invalid authorization header",
        )

    token = authorization.replace("Bearer ", "")

    # Validate token with Supabase
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": SUPABASE_ANON_KEY,
                },
                timeout=10.0,
            )

        if response.status_code != 200:
            raise Auth.exceptions.HTTPException(
                status_code=401,
                detail="Invalid or expired token",
            )

        user_data = response.json()

        return {
            "identity": user_data["id"],
            "email": user_data.get("email"),
            "is_authenticated": True,
        }

    except httpx.RequestError as e:
        raise Auth.exceptions.HTTPException(
            status_code=503,
            detail=f"Authentication service unavailable: {str(e)}",
        )


@auth.on
async def add_owner(
    ctx: Auth.types.AuthContext,
    value: dict[str, Any],
) -> dict[str, str]:
    """Add owner metadata to resources and filter by owner.

    This handler runs on all resource operations to:
    1. Add the user's identity to new resources as 'owner'
    2. Return a filter so users only see their own resources

    Args:
        ctx: Authentication context with user information.
        value: Resource data being created or accessed.

    Returns:
        Filter dictionary to scope queries to the current user.
    """
    # Create filter for this user
    filters = {"owner": ctx.user.identity}

    # Add owner to resource metadata
    metadata = value.setdefault("metadata", {})
    metadata.update(filters)

    return filters
