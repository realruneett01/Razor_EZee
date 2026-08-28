import pytest
from app.schemas.dispute import DisputeExtractionOutput
from app.engines.evidence.gate import decide_submission_path, COMPLETENESS_AUTOSUBMIT_THRESHOLD


def create_extraction(score: float) -> DisputeExtractionOutput:
    return DisputeExtractionOutput(
        awb_number="DELHIVERY-BOM-12345",
        recipient_name="Rahul Sharma",
        delivery_status="DELIVERED",
        delivery_timestamp="2026-08-14T14:32:00Z",
        pod_signature_verified=True,
        customer_chat_admission=True,
        contradiction_quote="I collected the parcel yesterday.",
        completeness_score=score,
        legal_summary="Dispute summary for representment.",
    )


def test_gate_below_threshold_boundary_0_79():
    """Assert completeness_score of 0.79 routes to draft_for_human_review."""
    extraction = create_extraction(0.79)
    decision = decide_submission_path(extraction)
    assert decision == "draft_for_human_review"


def test_gate_at_exact_threshold_boundary_0_80():
    """Assert completeness_score of 0.80 routes to auto_submit."""
    extraction = create_extraction(0.80)
    decision = decide_submission_path(extraction)
    assert decision == "auto_submit"


def test_gate_above_threshold_boundary_0_81():
    """Assert completeness_score of 0.81 routes to auto_submit."""
    extraction = create_extraction(0.81)
    decision = decide_submission_path(extraction)
    assert decision == "auto_submit"


def test_gate_zero_score():
    """Assert zero score routes to draft_for_human_review."""
    extraction = create_extraction(0.0)
    decision = decide_submission_path(extraction)
    assert decision == "draft_for_human_review"


def test_gate_perfect_score():
    """Assert perfect 1.0 score routes to auto_submit."""
    extraction = create_extraction(1.0)
    decision = decide_submission_path(extraction)
    assert decision == "auto_submit"
