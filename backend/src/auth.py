from fastapi import Request, HTTPException, status

from .supabaseClient import supabase


async def get_current_user(request: Request) -> str:
    """
    FastAPI dependency that validates the Supabase JWT from the
    Authorization: Bearer <token> header.

    Usage:
        @app.post("/chat")
        async def chat(user_id: str = Depends(get_current_user)):
            ...

    Returns:
        The authenticated user's UUID (str).

    Raises:
        401 Unauthorized — if the header is missing or the token is invalid/expired.
    """
    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization header. Expected: Bearer <token>",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = auth_header.removeprefix("Bearer ").strip()

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization token is empty.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        response = supabase.auth.get_user(token)
        user = response.user

        if not user or not user.id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return user.id

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation failed: {str(exc)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
