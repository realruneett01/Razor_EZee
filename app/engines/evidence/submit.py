import os
import json
import logging
from typing import Optional, Dict, Any
import httpx
from app.config import settings
from app.db.client import get_supabase_client

logger = logging.getLogger("razorsentinel.evidence.submit")

RAZORPAY_BASE_URL = "https://api.razorpay.com/v1"


class RazorpayAPIError(Exception):
    """Raised when Razorpay API returns a non-2xx status code."""
    def __init__(self, status_code: int, error_body: Any):
        self.status_code = status_code
        self.error_body = error_body
        super().__init__(f"Razorpay API Error ({status_code}): {json.dumps(error_body) if isinstance(error_body, dict) else error_body}")


def _get_auth(key_id: Optional[str] = None, key_secret: Optional[str] = None) -> tuple[str, str]:
    kid = key_id or os.getenv("RAZORPAY_KEY_ID") or settings.razorpay_key_id
    sec = key_secret or os.getenv("RAZORPAY_KEY_SECRET") or settings.razorpay_key_secret
    return (kid, sec)


def upload_evidence_document(
    pdf_path: str,
    key_id: Optional[str] = None,
    key_secret: Optional[str] = None,
    client: Optional[httpx.Client] = None,
) -> str:
    """Uploads evidence dossier PDF to Razorpay Documents API (POST /v1/documents).

    Returns:
        doc_id: The uploaded document ID (e.g. "doc_evidence_88192").
    """
    auth = _get_auth(key_id, key_secret)
    url = f"{RAZORPAY_BASE_URL}/documents"

    # Handle offline/mock testing when placeholder keys are present
    if not auth[0] or auth[0].startswith("rzp_test_placeholder") or auth[0] == "rzp_test_your_key_id":
        logger.info(f"Using mock document upload for offline/test mode: {pdf_path}")
        return f"doc_evidence_mock_{os.path.splitext(os.path.basename(pdf_path))[0]}"

    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"Dossier PDF not found at: {pdf_path}")

    filename = os.path.basename(pdf_path)
    with open(pdf_path, "rb") as f:
        file_bytes = f.read()

    files = {
        "file": (filename, file_bytes, "application/pdf"),
    }
    data = {
        "purpose": "dispute_evidence",
    }

    http_client = client or httpx.Client(timeout=30.0)
    try:
        response = http_client.post(url, auth=auth, data=data, files=files)
        if response.status_code not in (200, 201):
            error_body = response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
            raise RazorpayAPIError(response.status_code, error_body)

        doc_data = response.json()
        doc_id = doc_data.get("id")
        logger.info(f"Successfully uploaded evidence document: {doc_id}")
        return doc_id
    finally:
        if not client:
            http_client.close()


def contest_dispute(
    dispute_id: str,
    amount: int,
    summary: str,
    doc_id: str,
    action: str = "submit",
    key_id: Optional[str] = None,
    key_secret: Optional[str] = None,
    client: Optional[httpx.Client] = None,
) -> Dict[str, Any]:
    """Submits evidence to contest a dispute via Razorpay Disputes API (PATCH /v1/disputes/{id}/contest).

    Args:
        dispute_id: Razorpay dispute ID (e.g. "disp_AHfqOvkldwsbqt")
        amount: Dispute amount in paise
        summary: Factual representment summary
        doc_id: Uploaded document ID from Documents API
        action: "submit" for finalized auto-submits, "draft" for human review

    Returns:
        Dispute contest API response dictionary.
    """
    auth = _get_auth(key_id, key_secret)
    url = f"{RAZORPAY_BASE_URL}/disputes/{dispute_id}/contest"

    payload = {
        "amount": amount,
        "summary": summary,
        "shipping_proof": [doc_id],
        "customer_communication": [doc_id],
        "action": action,
    }

    # Handle offline/mock testing when placeholder keys are present
    if not auth[0] or auth[0].startswith("rzp_test_placeholder") or auth[0] == "rzp_test_your_key_id":
        logger.info(f"Using mock dispute contest response for offline/test mode (action={action})")
        return {
            "id": dispute_id,
            "status": "under_review" if action == "submit" else "draft",
            "action_taken": action,
            "amount": amount,
            "evidence": {
                "shipping_proof": [doc_id],
                "customer_communication": [doc_id],
                "summary": summary,
            },
        }

    http_client = client or httpx.Client(timeout=30.0)
    try:
        response = http_client.patch(url, auth=auth, json=payload)
        
        if response.status_code not in (200, 201):
            error_body = response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
            
            # Persist full error body to Supabase disputes.last_error
            _record_dispute_error(dispute_id, error_body)
            raise RazorpayAPIError(response.status_code, error_body)

        result = response.json()
        logger.info(f"Dispute contest successful for {dispute_id} (action={action})")
        return result
    finally:
        if not client:
            http_client.close()


def _record_dispute_error(dispute_id: str, error_body: Any):
    """Helper to record Razorpay non-2xx error bodies to the disputes table."""
    try:
        supabase = get_supabase_client()
        error_str = json.dumps(error_body) if isinstance(error_body, dict) else str(error_body)
        supabase.table("disputes").update({"last_error": error_str}).eq("id", dispute_id).execute()
        logger.info(f"Persisted last_error for dispute {dispute_id} to database")
    except Exception as e:
        logger.warning(f"Could not persist last_error to Supabase (offline/unconfigured): {e}")
