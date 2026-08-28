import hmac
import hashlib
import json
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Request, HTTPException, status
from fastapi.responses import JSONResponse
from app.config import settings
from app.engines.evidence import handle_dispute_created
from app.engines.velocity import handle_payment_event

router = APIRouter()
logger = logging.getLogger("razorsentinel.webhooks")

# Audit log storage (in-memory list / logger for audit tracking)
AUDIT_LOGS = []


def verify_razorpay_signature(raw_body: bytes, signature_header: str | None, secret: str) -> bool:
    """Verifies Razorpay HMAC-SHA256 webhook signature against the raw request body."""
    if not signature_header or not secret:
        return False
    
    expected_signature = hmac.new(
        key=secret.encode("utf-8"),
        msg=raw_body,
        digestmod=hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(expected_signature, signature_header)


@router.post("/razorpay")
async def razorpay_webhook_listener(request: Request):
    # 1. Read raw request body before JSON parsing
    raw_body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature")

    secret = settings.razorpay_webhook_secret

    # 2. Reject 401 if signature is missing or invalid BEFORE parsing payload
    if not verify_razorpay_signature(raw_body, signature, secret):
        logger.warning("Rejected webhook request: Invalid or missing X-Razorpay-Signature header")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing webhook signature",
        )

    # Parse JSON payload after verification
    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except Exception as e:
        logger.error(f"Malformed JSON payload in verified webhook: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Malformed JSON payload",
        )

    event_type = payload.get("event")
    event_id = payload.get("id") or payload.get("payload", {}).get("payment", {}).get("entity", {}).get("id")
    event_timestamp = payload.get("created_at") or int(datetime.now(timezone.utc).timestamp())

    # 4. Log every received event (type, id, timestamp) to local audit log
    audit_entry = {
        "event_type": event_type,
        "event_id": event_id,
        "timestamp": event_timestamp,
        "received_at": datetime.now(timezone.utc).isoformat(),
    }
    AUDIT_LOGS.append(audit_entry)
    logger.info(f"Audit log: verified webhook event={event_type} id={event_id} timestamp={event_timestamp}")

    # 3. Route verified events by event type
    result = None
    if event_type == "payment.dispute.created":
        result = handle_dispute_created(payload)
    elif event_type in ["payment.failed", "order.paid"]:
        result = handle_payment_event(payload)
    else:
        logger.info(f"Ignored unhandled event type: {event_type}")
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "status": "ignored",
                "event": event_type,
                "message": "Event received but no action required",
            },
        )

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "status": "processed",
            "event": event_type,
            "result": result,
        },
    )
