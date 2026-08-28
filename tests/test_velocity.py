import pytest
from app.engines.velocity.shield import evaluate_transaction_velocity, InMemoryRedisMock
from app.engines.velocity.ratio_monitor import compute_dispute_ratio, get_ratio_status
from app.engines.velocity.handlers import handle_payment_event


def test_velocity_micro_transaction_burst_thresholds():
    """Simulates a 6-request micro-transaction burst (<= Rs. 10.0) from one IP.

    Expected transition sequence:
      1: ALLOW
      2: ALLOW
      3: FLAG_FOR_REVIEW
      4: FLAG_FOR_REVIEW
      5: CHALLENGE_STEP_UP_OTP
      6: CHALLENGE_STEP_UP_OTP
    """
    redis_mock = InMemoryRedisMock()
    ip = "192.168.1.50"
    bin_num = "411111"
    amount = 2.00  # Rs. 2.00 micro-transaction

    actions = []
    for i in range(1, 7):
        act = evaluate_transaction_velocity(
            ip_address=ip,
            bin_number=bin_num,
            amount_in_inr=amount,
            redis_client=redis_mock,
        )
        actions.append(act)

    assert actions[0] == "ALLOW", "Request 1 should be ALLOW"
    assert actions[1] == "ALLOW", "Request 2 should be ALLOW"
    assert actions[2] == "FLAG_FOR_REVIEW", "Request 3 must transition to FLAG_FOR_REVIEW"
    assert actions[3] == "FLAG_FOR_REVIEW", "Request 4 should remain FLAG_FOR_REVIEW"
    assert actions[4] == "CHALLENGE_STEP_UP_OTP", "Request 5 must transition to CHALLENGE_STEP_UP_OTP"
    assert actions[5] == "CHALLENGE_STEP_UP_OTP", "Request 6 should remain CHALLENGE_STEP_UP_OTP"


def test_velocity_high_frequency_12_request_burst():
    """Simulates a 12-request burst for normal transaction amounts (e.g. Rs. 500) within 60 seconds.

    Expected transition sequence:
      Requests 1 to 10: ALLOW
      Request 11: CHALLENGE_STEP_UP_OTP (window count 11 > 10)
      Request 12: CHALLENGE_STEP_UP_OTP
    """
    redis_mock = InMemoryRedisMock()
    ip = "10.0.0.99"
    bin_num = "524188"
    amount = 500.00  # Normal non-micro amount

    actions = []
    for i in range(1, 13):
        act = evaluate_transaction_velocity(
            ip_address=ip,
            bin_number=bin_num,
            amount_in_inr=amount,
            redis_client=redis_mock,
        )
        actions.append(act)

    # 1 to 10 must be ALLOW
    for idx in range(10):
        assert actions[idx] == "ALLOW", f"Request {idx + 1} should be ALLOW"

    # 11 and 12 must be CHALLENGE_STEP_UP_OTP
    assert actions[10] == "CHALLENGE_STEP_UP_OTP", "Request 11 (burst > 10) must transition to CHALLENGE_STEP_UP_OTP"
    assert actions[11] == "CHALLENGE_STEP_UP_OTP", "Request 12 must remain CHALLENGE_STEP_UP_OTP"


def test_dispute_ratio_status_thresholds():
    """Verifies get_ratio_status correctly maps ratio values to safe, watch, danger."""
    # Safe (< 0.30%)
    assert get_ratio_status(0.0) == "safe"
    assert get_ratio_status(0.15) == "safe"
    assert get_ratio_status(0.29) == "safe"

    # Watch (0.30% to 0.449%)
    assert get_ratio_status(0.30) == "watch"
    assert get_ratio_status(0.40) == "watch"
    assert get_ratio_status(0.449) == "watch"

    # Danger (>= 0.45%)
    assert get_ratio_status(0.45) == "danger"
    assert get_ratio_status(0.60) == "danger"
    assert get_ratio_status(1.20) == "danger"


def test_dispute_ratio_calculation():
    """Verifies compute_dispute_ratio accurately computes percentage from datasets."""
    # Scenario A: Rs. 4,000 disputed out of Rs. 1,000,000 turnover -> 0.40%
    disputes = [{"amount_disputed": 400000}]  # 400,000 paise
    orders = [{"amount": 100000000}]          # 100,000,000 paise
    ratio = compute_dispute_ratio(disputes_override=disputes, orders_override=orders)
    assert ratio == 0.40

    # Scenario B: Zero orders -> 0.0%
    assert compute_dispute_ratio(disputes_override=disputes, orders_override=[]) == 0.0


def test_velocity_handlers_order_paid_and_failed():
    """Verifies handle_payment_event processes order.paid and payment.failed."""
    # order.paid
    res_paid = handle_payment_event({
        "event": "order.paid",
        "payload": {
            "order": {
                "entity": {
                    "id": "order_test_999",
                    "amount": 150000,
                }
            }
        }
    })
    assert res_paid["status"] == "recorded"
    assert res_paid["order_id"] == "order_test_999"

    # payment.failed
    res_failed = handle_payment_event({
        "event": "payment.failed",
        "payload": {
            "payment": {
                "entity": {
                    "amount": 500,  # Rs. 5.00
                    "notes": {"ip_address": "127.0.0.1", "bin_number": "400000"},
                }
            }
        }
    })
    assert res_failed["status"] == "evaluated"
    assert res_failed["action"] in ["ALLOW", "FLAG_FOR_REVIEW", "CHALLENGE_STEP_UP_OTP"]
