import hmac
import hashlib
import json
import pytest
import httpx
from app.main import app
from app.config import settings


def generate_signature(body: bytes, secret: str) -> str:
    return hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()


@pytest.mark.asyncio
async def test_webhook_valid_signature_dispute_created(monkeypatch):
    test_secret = "test_webhook_secret_key_123"
    monkeypatch.setattr(settings, "razorpay_webhook_secret", test_secret)

    payload = {
        "event": "payment.dispute.created",
        "id": "evt_test_dispute_001",
        "created_at": 1724850000,
        "payload": {
            "dispute": {
                "entity": {
                    "id": "disp_test_998877",
                    "amount": 450000,
                    "reason_code": "goods_not_received",
                }
            }
        },
    }
    raw_body = json.dumps(payload).encode("utf-8")
    sig = generate_signature(raw_body, test_secret)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/webhooks/razorpay",
            content=raw_body,
            headers={
                "Content-Type": "application/json",
                "X-Razorpay-Signature": sig,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "processed"
        assert data["event"] == "payment.dispute.created"
        assert data["result"]["dispute_id"] == "disp_test_998877"


@pytest.mark.asyncio
async def test_webhook_valid_signature_velocity_event(monkeypatch):
    test_secret = "test_webhook_secret_key_123"
    monkeypatch.setattr(settings, "razorpay_webhook_secret", test_secret)

    payload = {
        "event": "payment.failed",
        "id": "evt_test_payment_failed_002",
        "created_at": 1724850100,
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_test_112233",
                    "amount": 100,
                }
            }
        },
    }
    raw_body = json.dumps(payload).encode("utf-8")
    sig = generate_signature(raw_body, test_secret)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/webhooks/razorpay",
            content=raw_body,
            headers={
                "Content-Type": "application/json",
                "X-Razorpay-Signature": sig,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "processed"
        assert data["event"] == "payment.failed"
        assert data["result"]["event"] == "payment.failed"


@pytest.mark.asyncio
async def test_webhook_invalid_signature_rejected(monkeypatch):
    test_secret = "test_webhook_secret_key_123"
    monkeypatch.setattr(settings, "razorpay_webhook_secret", test_secret)

    payload = {"event": "payment.dispute.created", "id": "evt_test_fake"}
    raw_body = json.dumps(payload).encode("utf-8")
    invalid_sig = "invalid_hex_signature_corrupted_1234567890abcdef"

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/webhooks/razorpay",
            content=raw_body,
            headers={
                "Content-Type": "application/json",
                "X-Razorpay-Signature": invalid_sig,
            },
        )
        assert response.status_code == 401
        assert "Invalid or missing webhook signature" in response.json()["detail"]


@pytest.mark.asyncio
async def test_webhook_missing_signature_rejected(monkeypatch):
    test_secret = "test_webhook_secret_key_123"
    monkeypatch.setattr(settings, "razorpay_webhook_secret", test_secret)

    payload = {"event": "payment.dispute.created", "id": "evt_test_no_sig"}
    raw_body = json.dumps(payload).encode("utf-8")

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/webhooks/razorpay",
            content=raw_body,
            headers={"Content-Type": "application/json"},
        )
        assert response.status_code == 401
        assert "Invalid or missing webhook signature" in response.json()["detail"]


@pytest.mark.asyncio
async def test_webhook_unrecognized_event_accepted_not_routed(monkeypatch):
    test_secret = "test_webhook_secret_key_123"
    monkeypatch.setattr(settings, "razorpay_webhook_secret", test_secret)

    payload = {
        "event": "refund.processed",
        "id": "evt_refund_999",
        "created_at": 1724850200,
    }
    raw_body = json.dumps(payload).encode("utf-8")
    sig = generate_signature(raw_body, test_secret)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/webhooks/razorpay",
            content=raw_body,
            headers={
                "Content-Type": "application/json",
                "X-Razorpay-Signature": sig,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ignored"
        assert data["event"] == "refund.processed"
