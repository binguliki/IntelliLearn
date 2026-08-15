import os

from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

_url: str = os.getenv("SUPABASE_URL", "")
_key: str = os.getenv("SUPABASE_KEY", "")

if not _url or not _key:
    raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables.")

# Service-role / anon client — use only for operations that don't need RLS
# (e.g. auth token validation in auth.py).
supabase: Client = create_client(_url, _key)


def get_user_client(jwt: str) -> Client:
    """
    Return a Supabase client authenticated as the calling user.

    The client carries the user's JWT, so Postgres Row-Level Security (RLS)
    policies are enforced. All reads and writes are scoped to that user's rows,
    preventing cross-user data access even if the application layer has a bug.

    Args:
        jwt: The user's Supabase access token (from the Authorization header).

    Returns:
        A fully configured Supabase Client instance acting as that user.
    """
    client: Client = create_client(_url, _key)
    client.auth.set_session(access_token=jwt, refresh_token="")
    return client