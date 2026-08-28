import pytest
from app.engines.evidence.extract import analyze_dispute_evidence, _heuristic_offline_extraction
from app.engines.evidence.handlers import handle_dispute_created


def test_extraction_clean_scenario():
    """Test extraction with full evidence returns high completeness score."""
    awb_bytes = b"header_data" * 200  # large clean file
    pod_bytes = b"signature_curve_data" * 100
    chat_text = "Customer (Rahul): Yes, I collected the package from my building security yesterday."

    extraction = analyze_dispute_evidence(awb_bytes, pod_bytes, chat_text)
    assert extraction.completeness_score >= 0.80
    assert extraction.customer_chat_admission is True
    assert "collected the package" in extraction.contradiction_quote
    assert extraction.pod_signature_verified is True


def test_extraction_adversarial_degraded_scenario():
    """Test extraction with degraded/adversarial evidence returns low completeness score."""
    awb_bytes = b"small_blurred_bytes"  # small degraded file (<15KB)
    pod_bytes = b"UNCONFIRMED_DOORSTEP_DROP"
    chat_text = "Customer: I was home all day and nobody came. I never received anything."

    extraction = analyze_dispute_evidence(awb_bytes, pod_bytes, chat_text)
    assert extraction.completeness_score < 0.80
    assert extraction.customer_chat_admission is False
    assert extraction.pod_signature_verified is False


def test_handle_dispute_created_auto_submit_branch():
    """Test webhook handler branching to auto_submit when evidence is clean."""
    payload = {
        "event": "payment.dispute.created",
        "payload": {
            "dispute": {
                "entity": {
                    "id": "disp_clean_auto_101",
                    "amount": 500000,
                    "payment_id": "pay_clean_101",
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
    assert result["status"] == "auto_submitted"
    assert result["completeness_score"] >= 0.80
    assert "dossier_path" in result


def test_handle_dispute_created_draft_review_branch():
    """Test webhook handler branching to draft_for_human_review when evidence is adversarial/missing."""
    payload = {
        "event": "payment.dispute.created",
        "payload": {
            "dispute": {
                "entity": {
                    "id": "disp_adv_draft_202",
                    "amount": 250000,
                    "payment_id": "pay_adv_202",
                    "reason_code": "fraud",
                }
            }
        }
    }
    evidence = {
        "awb_image_bytes": b"small_blurred",
        "pod_image_bytes": b"UNCONFIRMED_SMUDGED",
        "chat_log_text": "Customer: Where is my shipment? I never received anything!",
    }

    result = handle_dispute_created(payload, evidence_override=evidence)
    assert result["decision"] == "draft_for_human_review"
    assert result["status"] == "draft_created"
    assert result["completeness_score"] < 0.80
