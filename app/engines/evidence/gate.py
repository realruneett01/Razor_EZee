from app.schemas.dispute import DisputeExtractionOutput

# Threshold defined in Section 8 of the specification
COMPLETENESS_AUTOSUBMIT_THRESHOLD = 0.80


def decide_submission_path(extraction: DisputeExtractionOutput) -> str:
    """Gates submission path based on evidence completeness score.

    Returns:
        "auto_submit": If completeness_score >= 0.80
        "draft_for_human_review": If completeness_score < 0.80
    """
    if extraction.completeness_score >= COMPLETENESS_AUTOSUBMIT_THRESHOLD:
        return "auto_submit"
    return "draft_for_human_review"
