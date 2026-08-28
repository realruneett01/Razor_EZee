import sys
import os
import json
import shutil
import hashlib
from pathlib import Path
from datetime import datetime, timezone, timedelta

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.schemas.dispute import DisputeExtractionOutput
from app.engines.evidence.dossier import generate_dossier_pdf
from app.engines.evidence.extract import _heuristic_offline_extraction
from app.db.client import get_supabase_client
from app.api.routes import LOCAL_DISPUTES, LOCAL_VELOCITY_LOGS


def reset_demo_state() -> Dict[str, Any]:
    """Idempotently resets the database and seeds 3 canonical live demo scenarios.

    1. disp_demo_clean_001: Clean evidence (AWB + POD + Chat admission) -> Score 1.00 -> Auto-Submitted
    2. disp_demo_partial_002: Partial evidence (Missing chat admission) -> Score 0.75 -> Draft for Review
    3. Blocked Bot Burst: 5 micro-transactions (Rs. 2.00) -> Intercepted with Step-Up OTP Challenge
    """
    print("=== RazorSentinel Idempotent Demo Reset ===\n")

    # 1. Clean data/dossiers directory
    dossiers_dir = Path("data/dossiers")
    dossiers_dir.mkdir(parents=True, exist_ok=True)
    for pdf_file in dossiers_dir.glob("*.pdf"):
        try:
            pdf_file.unlink()
        except Exception:
            pass

    LOCAL_DISPUTES.clear()
    LOCAL_VELOCITY_LOGS.clear()

    # 2. Reset database tables if Supabase is connected
    try:
        supabase = get_supabase_client()
        supabase.table("disputes").delete().neq("id", "0").execute()
        supabase.table("risk_velocity_logs").delete().neq("risk_action_taken", "NONE").execute()
        supabase.table("successful_orders").delete().neq("id", "0").execute()
        print(" - Successfully purged Supabase tables (disputes, risk_velocity_logs, successful_orders)")
    except Exception as e:
        print(f" - Supabase remote purge skipped (using local store): {e}")

    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()

    # -------------------------------------------------------------
    # Scenario 1: Clean Auto-Submit Dispute (disp_demo_clean_001)
    # -------------------------------------------------------------
    clean_extraction = DisputeExtractionOutput(
        awb_number="BLUEDART-DEL-89218274",
        recipient_name="Rahul Sharma",
        delivery_status="DELIVERED",
        delivery_timestamp="2026-08-14T14:32:00Z",
        pod_signature_verified=True,
        customer_chat_admission=True,
        contradiction_quote="The delivery agent handed me the shipment yesterday, but the size is too large.",
        completeness_score=1.00,
        legal_summary=(
            "Carrier Air Waybill #BLUEDART-DEL-89218274 and recipient POD signature confirm physical delivery on 2026-08-14. "
            "Customer WhatsApp chat transcript explicitly admits receipt of shipment ('The delivery agent handed me the shipment yesterday'). "
            "Merchant respectfully requests full chargeback representment."
        ),
    )
    clean_pdf_path = generate_dossier_pdf(clean_extraction, "disp_demo_clean_001")

    clean_dispute_row = {
        "id": "disp_demo_clean_001",
        "payment_id": "pay_demo_clean_001",
        "order_id": "order_demo_clean_001",
        "amount_disputed": 499900, # Rs. 4,999.00
        "reason_code": "goods_not_received",
        "status": "under_review",
        "model_version": "gemini-3-flash-preview",
        "evidence_doc_id": "doc_evidence_disp_demo_clean_001",
        "dossier_pdf_url": clean_pdf_path,
        "completeness_score": 1.00,
        "contradiction_found": True,
        "auto_submitted": True,
        "last_error": None,
        "contested_at": (now - timedelta(minutes=15)).isoformat(),
        "created_at": (now - timedelta(minutes=20)).isoformat(),
    }
    LOCAL_DISPUTES.append(clean_dispute_row)

    # -------------------------------------------------------------
    # Scenario 2: Partial Draft Review Dispute (disp_demo_partial_002)
    # -------------------------------------------------------------
    partial_extraction = DisputeExtractionOutput(
        awb_number="DELHIVERY-BOM-91823711",
        recipient_name="Priya Nair",
        delivery_status="DELIVERED",
        delivery_timestamp="2026-08-15T11:20:00Z",
        pod_signature_verified=True,
        customer_chat_admission=False,
        contradiction_quote="",
        completeness_score=0.75,
        legal_summary="Carrier tracking confirms delivery, but customer support chat record contains no delivery admission. Recommended for human review.",
    )
    partial_pdf_path = generate_dossier_pdf(partial_extraction, "disp_demo_partial_002")

    partial_dispute_row = {
        "id": "disp_demo_partial_002",
        "payment_id": "pay_demo_partial_002",
        "order_id": "order_demo_partial_002",
        "amount_disputed": 249900, # Rs. 2,499.00
        "reason_code": "unauthorized_transaction",
        "status": "pending_review",
        "model_version": "gemini-3-flash-preview",
        "evidence_doc_id": "doc_evidence_disp_demo_partial_002",
        "dossier_pdf_url": partial_pdf_path,
        "completeness_score": 0.75,
        "contradiction_found": False,
        "auto_submitted": False,
        "last_error": None,
        "contested_at": None,
        "created_at": (now - timedelta(minutes=5)).isoformat(),
    }
    LOCAL_DISPUTES.append(partial_dispute_row)

    # -------------------------------------------------------------
    # Scenario 3: Intercepted Bot Card-Testing Attack Burst
    # -------------------------------------------------------------
    bot_ip = "198.51.100.42"
    bot_bin = "400012"
    bot_raw = f"{bot_ip}:Mozilla/5.0:{bot_bin}"
    bot_hash = hashlib.sha256(bot_raw.encode("utf-8")).hexdigest()

    attack_events = [
        {"amount": 200, "is_micro": True, "action": "ALLOW", "offset_s": 50},
        {"amount": 200, "is_micro": True, "action": "ALLOW", "offset_s": 40},
        {"amount": 200, "is_micro": True, "action": "FLAG_FOR_REVIEW", "offset_s": 30},
        {"amount": 200, "is_micro": True, "action": "FLAG_FOR_REVIEW", "offset_s": 20},
        {"amount": 200, "is_micro": True, "action": "CHALLENGE_STEP_UP_OTP", "offset_s": 10},
    ]

    for idx, ev in enumerate(attack_events):
        log_entry = {
            "id": f"log_demo_bot_{idx + 1:03d}",
            "fingerprint_hash": bot_hash,
            "amount": ev["amount"],
            "is_micro_transaction": ev["is_micro"],
            "risk_action_taken": ev["action"],
            "created_at": (now - timedelta(seconds=ev["offset_s"])).isoformat(),
        }
        LOCAL_VELOCITY_LOGS.append(log_entry)

    # -------------------------------------------------------------
    # Baseline Successful Orders for Healthy 0.30% Ratio
    # -------------------------------------------------------------
    # Total disputed = 4999 + 2499 = Rs. 7,498
    # Target 0.30% ratio -> Total turnover = Rs. 2,499,333 (~250 orders of ~Rs. 10,000)
    try:
        supabase = get_supabase_client()
        # Seed disputes to Supabase
        supabase.table("disputes").upsert(clean_dispute_row).execute()
        supabase.table("disputes").upsert(partial_dispute_row).execute()

        # Seed velocity logs
        for log_entry in LOCAL_VELOCITY_LOGS:
            supabase.table("risk_velocity_logs").insert({
                "fingerprint_hash": log_entry["fingerprint_hash"],
                "amount": log_entry["amount"],
                "is_micro_transaction": log_entry["is_micro_transaction"],
                "risk_action_taken": log_entry["risk_action_taken"],
            }).execute()

        # Seed successful baseline orders
        orders_batch = [
            {"id": f"order_seed_{i:03d}", "amount": 1000000, "created_at": (now - timedelta(days=i % 25)).isoformat()}
            for i in range(1, 251)
        ]
        supabase.table("successful_orders").upsert(orders_batch).execute()
        print(" - Successfully populated Supabase with baseline turnover and demo records")
    except Exception as e:
        print(f" - Supabase remote seeding skipped (using local sync): {e}")

    print("\n" + "=" * 60)
    print("         DEMO STATE INITIALIZATION COMPLETE")
    print("=" * 60)
    print(" [1] Seeded Clean Auto-Submit Case     : disp_demo_clean_001 (Score: 1.00)")
    print(" [2] Seeded Partial Draft Review Case : disp_demo_partial_002 (Score: 0.75)")
    print(" [3] Seeded Blocked Bot Attack Burst  : 5 micro-txns (Challenged via OTP)")
    print(" [4] Seeded Baseline Order Turnover   : 250 orders (~Rs. 25,00,000)")
    print("=" * 60)

    return {
        "status": "ready",
        "clean_dispute_id": "disp_demo_clean_001",
        "partial_dispute_id": "disp_demo_partial_002",
        "bot_attack_events": len(attack_events),
    }


if __name__ == "__main__":
    reset_demo_state()
