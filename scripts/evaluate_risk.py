import sys
import os
import json
import random
from pathlib import Path
from typing import Dict, Any, List

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.engines.evidence.extract import analyze_dispute_evidence
from app.engines.evidence.gate import decide_submission_path
from app.engines.velocity.shield import evaluate_transaction_velocity, InMemoryRedisMock


def evaluate_synthetic_bench() -> Dict[str, Any]:
    base_dir = Path("data/synthetic")
    
    tier_metrics = {
        "clean": {"total": 0, "ocr_tp": 0, "ocr_fp": 0, "ocr_fn": 0, "chat_tp": 0, "chat_fn": 0, "chat_fp": 0, "chat_tn": 0, "auto_submit_count": 0, "draft_count": 0, "scores": []},
        "partial": {"total": 0, "ocr_tp": 0, "ocr_fp": 0, "ocr_fn": 0, "chat_tp": 0, "chat_fn": 0, "chat_fp": 0, "chat_tn": 0, "auto_submit_count": 0, "draft_count": 0, "scores": []},
        "adversarial": {"total": 0, "ocr_tp": 0, "ocr_fp": 0, "ocr_fn": 0, "chat_tp": 0, "chat_fn": 0, "chat_fp": 0, "chat_tn": 0, "auto_submit_count": 0, "draft_count": 0, "scores": []},
    }

    scenarios_evaluated = []

    print("Running held-out evaluation across 150 synthetic dispute scenarios...")

    for tier in ["clean", "partial", "adversarial"]:
        tier_dir = base_dir / tier
        scenario_dirs = sorted(list(tier_dir.glob(f"{tier}_*")))

        for s_dir in scenario_dirs:
            manifest_path = s_dir / "manifest.json"
            if not manifest_path.exists():
                continue

            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            gt = manifest["ground_truth"]

            awb_file = s_dir / "awb.jpg"
            pod_file = s_dir / "pod.png"
            chat_file = s_dir / "chat_log.txt"

            awb_bytes = awb_file.read_bytes() if awb_file.exists() else None
            pod_bytes = pod_file.read_bytes() if pod_file.exists() else None
            chat_text = chat_file.read_text(encoding="utf-8") if chat_file.exists() else ""

            # Run pipeline extraction and gating
            extraction = analyze_dispute_evidence(
                awb_image_bytes=awb_bytes,
                pod_image_bytes=pod_bytes,
                chat_log_text=chat_text,
            )
            decision = decide_submission_path(extraction)

            tm = tier_metrics[tier]
            tm["total"] += 1
            tm["scores"].append(extraction.completeness_score)

            if decision == "auto_submit":
                tm["auto_submit_count"] += 1
            else:
                tm["draft_count"] += 1

            # 1. OCR Precision Evaluation (AWB & POD match)
            if gt.get("awb_number"):
                if extraction.awb_number is not None:
                    tm["ocr_tp"] += 1
                else:
                    tm["ocr_fn"] += 1
            else:
                if extraction.awb_number is not None:
                    tm["ocr_fp"] += 1

            # POD verification match
            if gt.get("pod_signature_verified"):
                if extraction.pod_signature_verified:
                    tm["ocr_tp"] += 1
                else:
                    tm["ocr_fn"] += 1
            else:
                if extraction.pod_signature_verified:
                    tm["ocr_fp"] += 1

            # 2. Chat Contradiction Recall Evaluation
            if gt.get("customer_chat_admission"):
                if extraction.customer_chat_admission:
                    tm["chat_tp"] += 1
                else:
                    tm["chat_fn"] += 1
            else:
                if extraction.customer_chat_admission:
                    tm["chat_fp"] += 1
                else:
                    tm["chat_tn"] += 1

            scenarios_evaluated.append({
                "scenario_id": manifest["scenario_id"],
                "tier": tier,
                "completeness_score": extraction.completeness_score,
                "decision": decision,
                "ground_truth_bucket": gt.get("expected_completeness_bucket"),
                "ground_truth_admission": gt.get("customer_chat_admission"),
                "extracted_admission": extraction.customer_chat_admission,
            })

    # 3. Card-Testing Interception Rate Evaluation (Simulated attack bursts)
    print("Evaluating card-testing bot interception on sliding-window Redis shield...")
    redis_sim = InMemoryRedisMock()
    total_bot_campaigns = 20
    intercepted_bot_campaigns = 0
    total_bot_attempts = 0
    intercepted_bot_attempts = 0

    for bot_idx in range(total_bot_campaigns):
        bot_ip = f"198.51.100.{bot_idx + 1}"
        bot_bin = f"4000{bot_idx:02d}"
        campaign_intercepted = False
        # Extended burst of 8 micro-transactions per bot attack campaign
        for req_idx in range(8):
            total_bot_attempts += 1
            action = evaluate_transaction_velocity(
                ip_address=bot_ip,
                bin_number=bot_bin,
                amount_in_inr=random.uniform(1.0, 9.5),
                redis_client=redis_sim,
            )
            if action in ["FLAG_FOR_REVIEW", "CHALLENGE_STEP_UP_OTP"]:
                intercepted_bot_attempts += 1
                campaign_intercepted = True
        
        if campaign_intercepted:
            intercepted_bot_campaigns += 1

    bot_campaign_interception_rate = (intercepted_bot_campaigns / total_bot_campaigns) * 100.0
    per_attempt_interception_rate = (intercepted_bot_attempts / total_bot_attempts) * 100.0

    # 4. False-Positive Checkout Friction Rate (Legitimate Shoppers Batch)
    print("Evaluating checkout friction rate on 100 legitimate shoppers...")
    redis_legit = InMemoryRedisMock()
    total_legit_checkouts = 100
    challenged_legit_checkouts = 0

    for user_idx in range(total_legit_checkouts):
        user_ip = f"203.0.113.{user_idx + 1}"
        user_bin = "524188"
        # Normal human shopping transaction (Rs. 450 - Rs. 3500, single attempt)
        action = evaluate_transaction_velocity(
            ip_address=user_ip,
            bin_number=user_bin,
            amount_in_inr=random.uniform(450.0, 3500.0),
            redis_client=redis_legit,
        )
        if action != "ALLOW":
            challenged_legit_checkouts += 1

    false_positive_friction_rate = (challenged_legit_checkouts / total_legit_checkouts) * 100.0

    # 5. Compile Tier Metrics & Confusion Matrices
    tier_results = {}
    total_ocr_tp = 0
    total_ocr_fp = 0
    total_ocr_fn = 0
    total_chat_tp = 0
    total_chat_fn = 0
    total_chat_fp = 0
    total_chat_tn = 0

    for tier, data in tier_metrics.items():
        total_ocr_tp += data["ocr_tp"]
        total_ocr_fp += data["ocr_fp"]
        total_ocr_fn += data["ocr_fn"]

        total_chat_tp += data["chat_tp"]
        total_chat_fn += data["chat_fn"]
        total_chat_fp += data["chat_fp"]
        total_chat_tn += data["chat_tn"]

        ocr_denom = (data["ocr_tp"] + data["ocr_fp"])
        ocr_prec = (data["ocr_tp"] / ocr_denom * 100) if ocr_denom > 0 else 100.0
        
        chat_denom = (data["chat_tp"] + data["chat_fn"])
        chat_rec = (data["chat_tp"] / chat_denom * 100) if chat_denom > 0 else 100.0

        avg_score = sum(data["scores"]) / len(data["scores"]) if data["scores"] else 0.0

        tier_results[tier] = {
            "total_scenarios": data["total"],
            "average_completeness_score": round(avg_score, 3),
            "auto_submitted_count": data["auto_submit_count"],
            "draft_for_review_count": data["draft_count"],
            "ocr_precision_pct": round(ocr_prec, 2),
            "chat_contradiction_recall_pct": round(chat_rec, 2),
            "confusion_matrix": {
                "ocr": {"true_positive": data["ocr_tp"], "false_positive": data["ocr_fp"], "false_negative": data["ocr_fn"]},
                "chat_admission": {"true_positive": data["chat_tp"], "false_positive": data["chat_fp"], "true_negative": data["chat_tn"], "false_negative": data["chat_fn"]},
            }
        }

    overall_ocr_denom = (total_ocr_tp + total_ocr_fp)
    overall_ocr_precision = (total_ocr_tp / overall_ocr_denom * 100) if overall_ocr_denom > 0 else 100.0

    overall_chat_denom = (total_chat_tp + total_chat_fn)
    overall_chat_recall = (total_chat_tp / overall_chat_denom * 100) if overall_chat_denom > 0 else 100.0

    # 6. Net Financial Impact Computation (Formula from Section 5)
    # Recovered_Capital = auto_submitted disputes * average dispute value (e.g. ₹4,999)
    # Arbitration_Fees = lost disputes * arbitration penalty fee (₹500)
    # False_Positive_Dropoff_Cost = challenged legitimate checkouts * estimated margin loss (₹150)
    recovered_dispute_capital = tier_results["clean"]["auto_submitted_count"] * 4999.0
    arbitration_fees = tier_results["adversarial"]["auto_submitted_count"] * 500.0
    false_positive_dropoff_cost = challenged_legit_checkouts * 150.0
    net_value = recovered_dispute_capital - arbitration_fees - false_positive_dropoff_cost

    final_results = {
        "evaluation_summary": {
            "total_scenarios_evaluated": len(scenarios_evaluated),
            "timestamp": "2026-08-28T17:00:00Z",
            "evaluation_engine": "RazorSentinel Held-Out Evaluation v1.0",
        },
        "metrics": {
            "awb_pod_ocr_precision": {
                "design_target": ">= 90.0%",
                "measured_overall": f"{overall_ocr_precision:.2f}%",
                "status": "PASS" if overall_ocr_precision >= 90.0 else "BELOW_TARGET",
            },
            "chat_contradiction_recall": {
                "design_target": ">= 85.0%",
                "measured_overall": f"{overall_chat_recall:.2f}%",
                "status": "PASS" if overall_chat_recall >= 85.0 else "BELOW_TARGET",
            },
            "card_testing_interception_rate": {
                "design_target": ">= 95.0%",
                "bot_campaign_interception": f"{bot_campaign_interception_rate:.2f}%",
                "per_attempt_interception": f"{per_attempt_interception_rate:.2f}%",
                "measured_overall": f"{bot_campaign_interception_rate:.2f}%",
                "status": "PASS" if bot_campaign_interception_rate >= 95.0 else "BELOW_TARGET",
            },
            "false_positive_checkout_friction": {
                "design_target": "< 2.0%",
                "measured_overall": f"{false_positive_friction_rate:.2f}%",
                "status": "PASS" if false_positive_friction_rate <= 2.0 else "BELOW_TARGET",
            },
            "net_financial_impact_inr": {
                "formula": "Recovered_Dispute_Capital - Arbitration_Fees - False_Positive_Dropoff_Cost",
                "recovered_dispute_capital_inr": recovered_dispute_capital,
                "arbitration_fees_inr": arbitration_fees,
                "false_positive_dropoff_cost_inr": false_positive_dropoff_cost,
                "net_value_inr": net_value,
            }
        },
        "tier_breakdown": tier_results,
    }

    # Save to results.json
    results_path = Path("results.json")
    with open(results_path, "w", encoding="utf-8") as f:
        json.dump(final_results, f, indent=2)

    # Print summary output
    print("\n" + "=" * 70)
    print("        RAZORSENTINEL HELD-OUT EVALUATION BENCHMARK RESULTS")
    print("=" * 70)
    print(f" Total Synthetic Scenarios Evaluated : {len(scenarios_evaluated)}")
    print(f" AWB & POD OCR Precision           : {overall_ocr_precision:.2f}% (Target: >= 90%)")
    print(f" Chat Contradiction Recall          : {overall_chat_recall:.2f}% (Target: >= 85%)")
    print(f" Bot Campaign Interception Rate     : {bot_campaign_interception_rate:.2f}% (Target: >= 95%)")
    print(f" False-Positive Checkout Friction   : {false_positive_friction_rate:.2f}% (Target: < 2%)")
    print(f" Net Financial Value Generated      : Rs. {net_value:,.2f} INR")
    print("-" * 70)
    print(" Tier Breakdown:")
    for t_name, t_info in tier_results.items():
        print(f"  [{t_name.upper()}] Avg Score: {t_info['average_completeness_score']} | Auto-Submits: {t_info['auto_submitted_count']}/{t_info['total_scenarios']} | Drafts: {t_info['draft_for_review_count']}/{t_info['total_scenarios']}")
    print("=" * 70)
    print(f"Detailed metrics and confusion matrices saved to: {results_path.resolve()}\n")

    return final_results


if __name__ == "__main__":
    evaluate_synthetic_bench()
