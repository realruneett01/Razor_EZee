import pytest
import httpx
from app.main import app


@pytest.mark.asyncio
async def test_get_disputes_api():
    """Assert GET /api/disputes returns 200 and a list."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/disputes")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_get_velocity_ratio_api():
    """Assert GET /api/velocity/ratio returns ratio report with valid keys."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/velocity/ratio")
        assert resp.status_code == 200
        data = resp.json()
        assert "dispute_ratio_percentage" in data
        assert data["status"] in ["safe", "watch", "danger"]
        assert data["threshold_safe"] == 0.30
        assert data["threshold_danger"] == 0.45


@pytest.mark.asyncio
async def test_get_velocity_logs_api():
    """Assert GET /api/velocity/logs returns 200 and a list."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/velocity/logs")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_get_dossier_pdf_api():
    """Assert GET /api/dossiers/{id} returns 200 with application/pdf if exists or 404."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # Non-existent dossier
        resp_404 = await client.get("/api/dossiers/non_existent_disp_999")
        assert resp_404.status_code == 404
