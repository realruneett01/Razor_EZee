import os
from typing import Optional
from supabase import create_client, Client
from app.config import settings


def get_supabase_client(
    url: Optional[str] = None,
    key: Optional[str] = None,
) -> Client:
    """Returns a configured Supabase client from environment variables or arguments.

    Raises:
        ValueError: If SUPABASE_URL or SUPABASE_KEY is missing or empty.
    """
    supabase_url = url or os.getenv("SUPABASE_URL") or settings.supabase_url
    supabase_key = key or os.getenv("SUPABASE_KEY") or settings.supabase_key

    if not supabase_url or supabase_url.strip() == "":
        raise ValueError("SUPABASE_URL must be configured and non-empty")

    if not supabase_key or supabase_key.strip() == "":
        raise ValueError("SUPABASE_KEY must be configured and non-empty")

    return create_client(supabase_url, supabase_key)
