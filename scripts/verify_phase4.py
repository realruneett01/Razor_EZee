import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.engines.velocity.shield import evaluate_transaction_velocity, InMemoryRedisMock
from app.engines.velocity.ratio_monitor import compute_dispute_ratio, get_ratio_status, get_dispute_ratio_report


def run_phase4_checkup():
    print("=== Phase 4 Checkup Verification ===\n")

    # 1. Micro-Transaction Card-Testing Burst Simulation (<= Rs. 10.0)
    print("[Check 1] Simulating 6-request micro-transaction burst (Rs. 2.50 per request):")
    redis_micro = InMemoryRedisMock()
    ip_micro = "192.168.1.150"
    bin_micro = "424242"
    
    micro_results = []
    for i in range(1, 7):
        action = evaluate_transaction_velocity(
            ip_address=ip_micro,
            bin_number=bin_micro,
            amount_in_inr=2.50,
            redis_client=redis_micro,
        )
        micro_results.append(action)
        print(f" - Request {i:02d}: {action}")

    assert micro_results[0] == "ALLOW"
    assert micro_results[1] == "ALLOW"
    assert micro_results[2] == "FLAG_FOR_REVIEW", "Req 3 must transition to FLAG_FOR_REVIEW"
    assert micro_results[3] == "FLAG_FOR_REVIEW"
    assert micro_results[4] == "CHALLENGE_STEP_UP_OTP", "Req 5 must transition to CHALLENGE_STEP_UP_OTP"
    assert micro_results[5] == "CHALLENGE_STEP_UP_OTP"
    print(" -> Confirmed exact 3rd and 5th request transition triggers!")

    # 2. High-Frequency Burst Simulation (>10 requests in 60s)
    print("\n[Check 2] Simulating 12-request high-frequency burst for normal checkouts (Rs. 850.00 each):")
    redis_burst = InMemoryRedisMock()
    ip_burst = "10.0.50.25"
    bin_burst = "510000"

    burst_results = []
    for i in range(1, 13):
        action = evaluate_transaction_velocity(
            ip_address=ip_burst,
            bin_number=bin_burst,
            amount_in_inr=850.00,
            redis_client=redis_burst,
        )
        burst_results.append(action)
        print(f" - Request {i:02d}: {action}")

    for idx in range(10):
        assert burst_results[idx] == "ALLOW"
    assert burst_results[10] == "CHALLENGE_STEP_UP_OTP", "Req 11 (window > 10) must transition to CHALLENGE_STEP_UP_OTP"
    assert burst_results[11] == "CHALLENGE_STEP_UP_OTP"
    print(" -> Confirmed exact 11th request transition trigger for sliding window burst!")

    # 3. Dispute Ratio Monitoring & Regulatory Status Gating
    print("\n[Check 3] Dispute-to-turnover ratio regulatory thresholds:")
    test_cases = [
        (100000, 100000000, 0.10, "safe"),    # 0.10% -> safe
        (350000, 100000000, 0.35, "watch"),   # 0.35% -> watch
        (500000, 100000000, 0.50, "danger"),  # 0.50% -> danger
    ]

    for disp_paise, order_paise, expected_ratio, expected_status in test_cases:
        ratio = compute_dispute_ratio(
            disputes_override=[{"amount_disputed": disp_paise}],
            orders_override=[{"amount": order_paise}],
        )
        status = get_ratio_status(ratio)
        print(f" - Disputed: Rs.{disp_paise/100:.2f} / Turnover: Rs.{order_paise/100:.2f} -> Ratio: {ratio:.2f}% (Status: {status})")
        assert abs(ratio - expected_ratio) < 0.001
        assert status == expected_status

    print("\n=== ALL PHASE 4 CHECKUP CRITERIA VERIFIED SUCCESSFULLY ===")


if __name__ == "__main__":
    run_phase4_checkup()
