import sys
import json
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.engines.evidence.extract import analyze_dispute_evidence
from app.engines.evidence.gate import decide_submission_path


def run_phase2_checkup():
    print("=== Phase 2 Checkup Verification ===\n")
    base_dir = Path("data/synthetic")

    results = {"clean": [], "partial": [], "adversarial": []}

    # 1. Run extraction against 5 scenarios from each tier
    for tier in ["clean", "partial", "adversarial"]:
        for i in range(1, 6):
            scenario_id = f"{tier}_{i:03d}"
            s_dir = base_dir / tier / scenario_id

            awb_file = s_dir / "awb.jpg"
            pod_file = s_dir / "pod.png"
            chat_file = s_dir / "chat_log.txt"

            awb_bytes = awb_file.read_bytes() if awb_file.exists() else None
            pod_bytes = pod_file.read_bytes() if pod_file.exists() else None
            chat_text = chat_file.read_text(encoding="utf-8") if chat_file.exists() else ""

            extraction = analyze_dispute_evidence(
                awb_image_bytes=awb_bytes,
                pod_image_bytes=pod_bytes,
                chat_log_text=chat_text,
            )
            decision = decide_submission_path(extraction)

            results[tier].append({
                "scenario_id": scenario_id,
                "completeness_score": extraction.completeness_score,
                "decision": decision,
                "extraction": extraction.model_dump(),
            })

    # 2. Display Sample Raw JSON per tier
    print("--- SAMPLE RAW EXTRACTION OUTPUT: CLEAN TIER (clean_001) ---")
    print(json.dumps(results["clean"][0]["extraction"], indent=2))
    print(f"Decision: {results['clean'][0]['decision']}\n")

    print("--- SAMPLE RAW EXTRACTION OUTPUT: PARTIAL TIER (partial_001) ---")
    print(json.dumps(results["partial"][0]["extraction"], indent=2))
    print(f"Decision: {results['partial'][0]['decision']}\n")

    print("--- SAMPLE RAW EXTRACTION OUTPUT: ADVERSARIAL TIER (adversarial_001) ---")
    print(json.dumps(results["adversarial"][0]["extraction"], indent=2))
    print(f"Decision: {results['adversarial'][0]['decision']}\n")

    # 3. Tier-level score comparisons and assertion
    clean_scores = [r["completeness_score"] for r in results["clean"]]
    partial_scores = [r["completeness_score"] for r in results["partial"]]
    adv_scores = [r["completeness_score"] for r in results["adversarial"]]

    avg_clean = sum(clean_scores) / len(clean_scores)
    avg_partial = sum(partial_scores) / len(partial_scores)
    avg_adv = sum(adv_scores) / len(adv_scores)

    print("--- TIER SCORE COMPARISON ---")
    print(f"Clean Tier (5 samples)       : scores={clean_scores} (Avg: {avg_clean:.2f})")
    print(f"Partial Tier (5 samples)     : scores={partial_scores} (Avg: {avg_partial:.2f})")
    print(f"Adversarial Tier (5 samples) : scores={adv_scores} (Avg: {avg_adv:.2f})")

    assert avg_clean >= 0.80, f"Clean tier average score should be >= 0.80, got {avg_clean}"
    assert avg_adv < 0.50, f"Adversarial tier average score should be < 0.50, got {avg_adv}"
    assert avg_adv < avg_clean, "Adversarial completeness must be significantly lower than Clean tier"

    print("\n=== ALL PHASE 2 CHECKUP CRITERIA VERIFIED SUCCESSFULLY ===")


if __name__ == "__main__":
    run_phase2_checkup()
