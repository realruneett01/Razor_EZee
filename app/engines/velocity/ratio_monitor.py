import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
from app.db.client import get_supabase_client

logger = logging.getLogger("razorsentinel.velocity.ratio")

# Acquiring bank threshold definitions per Section 9 & Problem Decomposition
THRESHOLD_SAFE_MAX = 0.30   # < 0.30%
THRESHOLD_WATCH_MAX = 0.45  # 0.30% to 0.45% (Pre-threshold alert)


def get_ratio_status(ratio: float) -> str:
    """Returns the regulatory risk status for a given dispute-to-turnover ratio.

    Thresholds:
      - < 0.30%        -> "safe"
      - 0.30% - 0.45%  -> "watch"
      - >= 0.45%       -> "danger" (Acquiring-bank settlement freeze risk)
    """
    if ratio < THRESHOLD_SAFE_MAX:
        return "safe"
    elif ratio < THRESHOLD_WATCH_MAX:
        return "watch"
    else:
        logger.warning(
            f"DISPUTE RATIO DANGER ALERT: Rolling dispute ratio ({ratio:.3f}%) "
            f"has crossed the 0.45% pre-threshold! Risk of settlement freeze by acquiring bank."
        )
        return "danger"


def compute_dispute_ratio(
    days: int = 30,
    merchant_id: Optional[str] = None,
    disputes_override: Optional[list] = None,
    orders_override: Optional[list] = None,
) -> float:
    """Computes the rolling dispute-to-turnover ratio percentage over the specified window (default 30 days)
    filtered by merchant_id if specified.

    Formula:
        Ratio (%) = (Total Disputed Amount in Paise / Total Successful Orders Amount in Paise) * 100

    Returns:
        float: Dispute ratio percentage rounded to 4 decimal places (e.g. 0.35 for 0.35%).
    """
    total_disputed_paise = 0
    total_order_paise = 0

    if disputes_override is not None and orders_override is not None:
        total_disputed_paise = sum(d.get("amount_disputed", 0) for d in disputes_override)
        total_order_paise = sum(o.get("amount", 0) for o in orders_override)
    else:
        try:
            supabase = get_supabase_client()
            cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

            # Query disputes in rolling window
            disp_query = (
                supabase.table("disputes")
                .select("amount_disputed")
                .gte("created_at", cutoff)
            )
            if merchant_id:
                disp_query = disp_query.eq("merchant_id", merchant_id)

            disputes_res = disp_query.execute()
            total_disputed_paise = sum(row.get("amount_disputed", 0) for row in disputes_res.data or [])

            # Query successful orders in rolling window
            orders_query = (
                supabase.table("successful_orders")
                .select("amount")
                .gte("created_at", cutoff)
            )
            if merchant_id:
                orders_query = orders_query.eq("merchant_id", merchant_id)

            orders_res = orders_query.execute()
            total_order_paise = sum(row.get("amount", 0) for row in orders_res.data or [])

        except Exception as e:
            logger.debug(f"Supabase unavailable for ratio computation (returning 0.0 in offline mode): {e}")
            return 0.0

    if total_order_paise <= 0:
        return 0.0

    ratio = (total_disputed_paise / total_order_paise) * 100.0
    return round(ratio, 4)


def get_dispute_ratio_report(days: int = 30, merchant_id: Optional[str] = None) -> Dict[str, Any]:
    """Generates a complete dispute ratio health report for the dashboard and monitoring."""
    ratio = compute_dispute_ratio(days=days, merchant_id=merchant_id)
    status = get_ratio_status(ratio)

    return {
        "rolling_days": days,
        "merchant_id": merchant_id,
        "dispute_ratio_percentage": ratio,
        "status": status,
        "threshold_safe": THRESHOLD_SAFE_MAX,
        "threshold_danger": THRESHOLD_WATCH_MAX,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
