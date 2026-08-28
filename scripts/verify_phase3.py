import sys
import os
import json
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.schemas.dispute import DisputeExtractionOutput
from app.engines.evidence.dossier import generate_dossier_pdf
from app.engines.evidence.submit import upload_evidence_document, contest_dispute, RazorpayAPIError
from app.engines.evidence.handlers import handle_dispute_created


def run_phase3_checkup():
    print("=== Phase 3 Checkup Verification ===\n")

    # 1. End-to-End Run: Clean Tier Dispute -> Extraction -> Dossier PDF -> Documents -> Contest
    clean_dir = Path("data/synthetic/clean/clean_001")
    manifest = json.loads((clean_dir / "manifest.json").read_text(encoding="utf-8"))
    awb_bytes = (clean_dir / "awb.jpg").read_bytes()
    pod_bytes = (clean_dir / "pod.png").read_bytes()
    chat_text = (clean_dir / "chat_log.txt").read_text(encoding="utf-8")

    dispute_id = "disp_clean_live_demo_001"
    payload = {
        "event": "payment.dispute.created",
        "payload": {
            "dispute": {
                "entity": {
                    "id": dispute_id,
                    "amount": 499900,
                    "payment_id": "pay_live_test_001",
                    "reason_code": "goods_not_received",
                }
            }
        }
    }
    evidence = {
        "awb_image_bytes": awb_bytes,
        "pod_image_bytes": pod_bytes,
        "chat_log_text": chat_text,
    }

    print("[Check 1] Triggering full end-to-end pipeline on clean scenario clean_001...")
    result = handle_dispute_created(payload, evidence_override=evidence)
    print("\n--- ACTUAL PIPELINE SUBMISSION RESPONSE JSON ---")
    print(json.dumps(result, indent=2))

    assert result["decision"] == "auto_submit"
    assert result["action"] == "submit"
    assert result["completeness_score"] >= 0.80

    # 2. Verify PDF generation on disk
    pdf_path = result["dossier_path"]
    assert os.path.exists(pdf_path), f"PDF file not found at {pdf_path}"
    pdf_size = os.path.getsize(pdf_path)
    print(f"\n[Check 2] Dossier PDF generated successfully: {pdf_path} ({pdf_size} bytes)")
    with open(pdf_path, "rb") as f:
        assert f.read(5) == b"%PDF-"
    print(" - Confirmed valid PDF header (%PDF-)")

    # 3. Deliberate Error Injection Test
    print("\n[Check 3] Testing deliberate Razorpay error handling and last_error tracking...")
    import httpx
    def error_mock(request: httpx.Request):
        return httpx.Response(
            status_code=400,
            json={"error": {"code": "BAD_REQUEST_ERROR", "description": "Dispute cannot be contested in current state"}},
            headers={"content-type": "application/json"},
        )
    with httpx.Client(transport=httpx.MockTransport(error_mock)) as mock_client:
        try:
            contest_dispute(
                dispute_id="disp_bad_state_999",
                amount=1000,
                summary="Test Error",
                doc_id="doc_invalid",
                action="submit",
                key_id="rzp_test_active",
                key_secret="sec_active",
                client=mock_client,
            )
            assert False, "Should have raised RazorpayAPIError"
        except RazorpayAPIError as re:
            print(f" - Caught expected RazorpayAPIError: status={re.status_code}, error_body={re.error_body}")
            assert re.status_code == 400
            assert "BAD_REQUEST_ERROR" in str(re.error_body)

    # 4. Confirm Draft Path & Action Code Inspection
    print("\n[Check 4] Testing draft path for human-reviewed cases...")
    draft_dir = Path("data/synthetic/partial/partial_001")
    draft_awb = (draft_dir / "awb.jpg").read_bytes() if (draft_dir / "awb.jpg").exists() else None
    draft_pod = (draft_dir / "pod.png").read_bytes() if (draft_dir / "pod.png").exists() else None
    draft_chat = (draft_dir / "chat_log.txt").read_text(encoding="utf-8") if (draft_dir / "chat_log.txt").exists() else ""

    draft_payload = {
        "event": "payment.dispute.created",
        "payload": {
            "dispute": {
                "entity": {
                    "id": "disp_partial_draft_002",
                    "amount": 250000,
                    "payment_id": "pay_draft_002",
                    "reason_code": "unauthorized_transaction",
                }
            }
        }
    }
    draft_result = handle_dispute_created(draft_payload, evidence_override={
        "awb_image_bytes": draft_awb,
        "pod_image_bytes": draft_pod,
        "chat_log_text": draft_chat,
    })
    print(f" - Draft Result Decision: {draft_result['decision']}, Action: {draft_result['action']}")
    assert draft_result["decision"] == "draft_for_human_review"
    assert draft_result["action"] == "draft"

    print("\n=== ALL PHASE 3 CHECKUP ITEMS VERIFIED SUCCESSFULLY ===")


if __name__ == "__main__":
    run_phase3_checkup()
