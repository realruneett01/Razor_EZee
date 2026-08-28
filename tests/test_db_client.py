import pytest
import os
from unittest.mock import patch
from app.db.client import get_supabase_client


def test_db_client_raises_when_url_missing(monkeypatch):
    """Assert get_supabase_client raises ValueError when SUPABASE_URL is missing/empty."""
    monkeypatch.setenv("SUPABASE_URL", "")
    monkeypatch.setenv("SUPABASE_KEY", "test_key")
    with patch("app.db.client.settings.supabase_url", ""):
        with pytest.raises(ValueError, match="SUPABASE_URL must be configured"):
            get_supabase_client(url="", key="test_key")


def test_db_client_raises_when_key_missing(monkeypatch):
    """Assert get_supabase_client raises ValueError when SUPABASE_KEY is missing/empty."""
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_KEY", "")
    with patch("app.db.client.settings.supabase_key", ""):
        with pytest.raises(ValueError, match="SUPABASE_KEY must be configured"):
            get_supabase_client(url="https://example.supabase.co", key="")


def test_db_client_instantiation_with_valid_creds():
    """Assert get_supabase_client returns a valid Client instance when parameters are supplied."""
    client = get_supabase_client(
        url="https://xyzcompany.supabase.co",
        key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.fake_token_for_testing",
    )
    assert client is not None
    assert hasattr(client, "table")
