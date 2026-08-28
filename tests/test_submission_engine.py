import os
import json
import pytest
import httpx
from pathlib import Path
from unittest.mock import patch, MagicMock
from app.schemas.dispute import DisputeExtractionOutput
from app.engines.evidence.dossier import generate_dossier_pdf
from app.engines.evidence.submit import upload_evidence_document, contest_dispute, RazorpayAPIError
from app.engines.evidence.handlers import handle_dispute_created


def get_mock_extraction(score: float = 1.0) -> DisputeExtractionOutput:
    return DisputeExtractionOutput(
        awb_number="BLUEDART-DEL-89218274",
        recipient_name="Rahul Sharma",
        delivery_status="DELIVERED",
        delivery_timestamp="2026-08-14T14:32:00Z",
        pod_signature_verified=True,
        customer_chat_admission=True,
        contradiction_quote="The delivery agent handed me the shipment yesterday.",
        completeness_score=score,
        legal_summary="Carrier tracking and recipient POD confirm delivery with chat admission.",
    )


def test_dossier_pdf_generation_creates_valid_file(tmp_path):
    """Assert dossier PDF is generated on disk with non-zero byte size."""
    extraction = get_mock_extraction(1.0)
    pdf_path = generate_dossier_pdf(extraction, "disp_test_pdf_001", output_dir=str(tmp_path))

    assert os.path.exists(pdf_path)
    assert os.path.getsize(pdf_path) > 1000  # valid PDF binary header and content
    with open(pdf_path, "rb") as f:
        header = f.read(5)
        assert header == b"%PDF-"


def test_dossier_pdf_generation_draft_case(tmp_path):
    """Assert dossier PDF is generated correctly for draft review cases."""
    extraction = get_mock_extraction(0.65)
    pdf_path = generate_dossier_pdf(extraction, "disp_test_pdf_draft", output_dir=str(tmp_path))

    assert os.path.exists(pdf_path)
    assert os.path.getsize(pdf_path) > 1000


def test_upload_evidence_document_mock_client(tmp_path):
    """Test upload_evidence_document sends multipart POST to /v1/documents."""
    test_pdf = tmp_path / "test.pdf"
    test_pdf.write_bytes(b"%PDF-1.4 dummy content")

    def mock_handler(request: httpx.Request):
        assert request.url == "https://api.razorpay.com/v1/documents"
        assert request.method == "POST"
        assert request.headers.get("authorization") is not None
        return httpx.Response(
            status_code=200,
            json={"id": "doc_test_12345", "purpose": "dispute_evidence"},
            headers={"content-type": "application/json"},
        )

    transport = httpx.MockTransport(mock_handler)
    with httpx.Client(transport=transport) as client:
        doc_id = upload_evidence_document(
            str(test_pdf),
            key_id="rzp_live_test_key",
            key_secret="test_secret_123",
            client=client,
        )
        assert doc_id == "doc_test_12345"


def test_contest_dispute_action_submit_and_draft():
    """Verify contest_dispute passes exact action='submit' and action='draft'."""
    captured_payloads = []

    def mock_handler(request: httpx.Request):
        payload = json.loads(request.read())
        captured_payloads.append(payload)
        return httpx.Response(
            status_code=200,
            json={"id": "disp_test_888", "status": "under_review", "action_taken": payload["action"]},
            headers={"content-type": "application/json"},
        )

    transport = httpx.MockTransport(mock_handler)
    with httpx.Client(transport=transport) as client:
        # 1. Test auto-submit action
        res_submit = contest_dispute(
            dispute_id="disp_test_888",
            amount=499900,
            summary="Valid delivery",
            doc_id="doc_test_12345",
            action="submit",
            key_id="rzp_live_test_key",
            key_secret="test_secret_123",
            client=client,
        )
        assert captured_payloads[0]["action"] == "submit"
        assert captured_payloads[0]["shipping_proof"] == ["doc_test_12345"]
        assert captured_payloads[0]["customer_communication"] == ["doc_test_12345"]

        # 2. Test draft action
        res_draft = contest_dispute(
            dispute_id="disp_test_888",
            amount=499900,
            summary="Review needed",
            doc_id="doc_test_12345",
            action="draft",
            key_id="rzp_live_test_key",
            key_secret="test_secret_123",
            client=client,
        )
        assert captured_payloads[1]["action"] == "draft"


def test_contest_dispute_error_handling_raises_and_persists():
    """Verify non-2xx Razorpay response raises RazorpayAPIError with error body."""
    def error_handler(request: httpx.Request):
        return httpx.Response(
            status_code=400,
            json={"error": {"code": "BAD_REQUEST_ERROR", "description": "Invalid dispute state"}},
            headers={"content-type": "application/json"},
        )

    transport = httpx.MockTransport(error_handler)
    with httpx.Client(transport=transport) as client:
        with pytest.raises(RazorpayAPIError) as exc_info:
            contest_dispute(
                dispute_id="disp_invalid_001",
                amount=10000,
                summary="Summary",
                doc_id="doc_123",
                action="submit",
                key_id="rzp_live_test_key",
                key_secret="test_secret_123",
                client=client,
            )
        assert exc_info.value.status_code == 400
        assert "BAD_REQUEST_ERROR" in str(exc_info.value.error_body)


def test_end_to_end_handle_dispute_created_pipeline():
    """Verify full end-to-end webhook handle_dispute_created compiles PDF and executes submission."""
    payload = {
        "event": "payment.dispute.created",
        "payload": {
            "dispute": {
                "entity": {
                    "id": "disp_e2e_phase3_99",
                    "amount": 350000,
                    "payment_id": "pay_e2e_99",
                    "reason_code": "goods_not_received",
                }
            }
        }
    }
    evidence = {
        "awb_image_bytes": b"header_data" * 200,
        "pod_image_bytes": b"signature_curve_data" * 100,
        "chat_log_text": "Customer: Yes, I received the box yesterday at 2 PM, but I want a refund.",
    }

    result = handle_dispute_created(payload, evidence_override=evidence)
    assert result["decision"] == "auto_submit"
    assert result["action"] == "submit"
    assert os.path.exists(result["dossier_path"])
    assert result["doc_id"] is not None
