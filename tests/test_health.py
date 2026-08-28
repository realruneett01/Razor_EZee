import pytest
import httpx
from app.main import app


@pytest.mark.asyncio
async def test_health_check_endpoint():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        assert response.json() == {
            "status": "ok",
            "version": "1.0.0",
        }
