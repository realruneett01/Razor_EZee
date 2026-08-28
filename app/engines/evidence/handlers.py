import logging
from typing import Any, Dict, Optional
from datetime import datetime, timezone
from app.engines.evidence.extract import analyze_dispute_evidence
from app.engines.evidence.gate import decide_submission_path
from app.engines.evidence.dossier import generate_dossier_pdf
from app.engines.evidence.submit import upload_evidence_document, contest_dispute
from app.db.client import get_supabase_client

logger = logging.getLogger("razorsentinel.evidence.handlers")


def handle_dispute_created(payload: Dict[str, Any], evidence_override: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Handles payment.dispute.created webhook event.

    Extracts multimodal evidence, compiles evidence dossier PDF, evaluates completeness score,
    and executes Razorpay Documents & Dispute Contest APIs with action='submit' or action='draft'.
    """
    dispute_data = payload.get("payload", {}).get("dispute", {}).get("entity", {})
    dispute_id = dispute_data.get("id", "disp_unknown")
    payment_id = dispute_data.get("payment_id", "pay_unknown")
    order_id = dispute_data.get("order_id", f"order_{dispute_id}")
    amount_disputed = dispute_data.get("amount", 0)
    reason_code = dispute_data.get("reason_code", "general_dispute")

    logger.info(f"Processing dispute {dispute_id} (amount: {amount_disputed} paise, reason: {reason_code})")

    # 1. Retrieve or pass evidence
    evidence = evidence_override or {}
    awb_bytes = evidence.get("awb_image_bytes")
    pod_bytes = evidence.get("pod_image_bytes")
    chat_text = evidence.get("chat_log_text", "")

    # 2. Gemini 3 Flash structured extraction
    extraction = analyze_dispute_evidence(
        awb_image_bytes=awb_bytes,
        pod_image_bytes=pod_bytes,
        chat_log_text=chat_text,
    )

    # 3. Compile Dossier PDF with visible completeness score
    dossier_path = generate_dossier_pdf(extraction, dispute_id)
    logger.info(f"Compiled evidence dossier PDF at {dossier_path}")

    # 4. Gate submission path
    submission_path = decide_submission_path(extraction)
    action_type = "submit" if submission_path == "auto_submit" else "draft"
    logger.info(f"Dispute {dispute_id} score={extraction.completeness_score} -> decision: {submission_path} (action={action_type})")

    # 5. Documents API & Contest API integration
    doc_id = None
    contest_result = None
    try:
        doc_id = upload_evidence_document(dossier_path)
        contest_result = contest_dispute(
            dispute_id=dispute_id,
            amount=amount_disputed,
            summary=extraction.legal_summary,
            doc_id=doc_id,
            action=action_type,
        )
    except Exception as api_err:
        logger.error(f"Error during Razorpay API submission for {dispute_id}: {api_err}")

    # 6. Database record persistence
    now_iso = datetime.now(timezone.utc).isoformat()
    db_record = {
        "id": dispute_id,
        "payment_id": payment_id,
        "order_id": order_id,
        "amount_disputed": amount_disputed,
        "reason_code": reason_code,
        "model_version": "gemini-3-flash-preview",
        "evidence_doc_id": doc_id,
        "dossier_pdf_url": dossier_path,
        "completeness_score": float(extraction.completeness_score),
        "contradiction_found": extraction.customer_chat_admission,
        "auto_submitted": (submission_path == "auto_submit"),
        "status": "under_review" if submission_path == "auto_submit" else "pending_review",
        "contested_at": now_iso if submission_path == "auto_submit" else None,
        "last_error": None,
    }

    try:
        supabase = get_supabase_client()
        supabase.table("disputes").upsert(db_record).execute()
        logger.info(f"Dispute {dispute_id} state successfully synced to Supabase")
    except Exception as db_err:
        logger.debug(f"Supabase upsert skipped/unavailable in test mode: {db_err}")

    # 7. Return structured pipeline response
    if submission_path == "auto_submit":
        return {
            "status": "auto_submitted",
            "dispute_id": dispute_id,
            "decision": "auto_submit",
            "action": "submit",
            "completeness_score": extraction.completeness_score,
            "doc_id": doc_id,
            "dossier_path": dossier_path,
            "contest_result": contest_result,
            "extraction": extraction.model_dump(),
        }
    else:
        return {
            "status": "draft_created",
            "dispute_id": dispute_id,
            "decision": "draft_for_human_review",
            "action": "draft",
            "completeness_score": extraction.completeness_score,
            "doc_id": doc_id,
            "dossier_path": dossier_path,
            "contest_result": contest_result,
            "extraction": extraction.model_dump(),
        }
