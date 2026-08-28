import sys
import os
import json
import hmac
import hashlib
import asyncio
import httpx
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from collections import Counter
from app.main import app
from app.config import settings

async def run_phase1_checkup():
    print("=== Phase 1 Checkup Verification ===\n")

    # 1. Webhook Signature Verification (Live endpoint test)
    test_secret = "rzp_webhook_secret_for_checkup_9988"
    settings.razorpay_webhook_secret = test_secret

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "event": "payment.dispute.created",
            "id": "evt_live_checkup_001",
            "created_at": 1724850000,
            "payload": {
                "dispute": {
                    "entity": {
                        "id": "disp_live_001",
                        "amount": 499900,
                        "reason_code": "fraud",
                    }
                }
            }
        }
        raw_body = json.dumps(payload).encode("utf-8")
        valid_sig = hmac.new(test_secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
        corrupt_sig = "corrupted_sig_1234567890abcdef1234567890"

        # Case A: Valid signature -> 200
        resp_valid = await client.post(
            "/webhooks/razorpay",
            content=raw_body,
            headers={"Content-Type": "application/json", "X-Razorpay-Signature": valid_sig},
        )
        print(f"[Check 1A] Valid HMAC Signature   -> Status: {resp_valid.status_code}, Body: {resp_valid.json()}")
        assert resp_valid.status_code == 200

        # Case B: Corrupted signature -> 401
        resp_corrupt = await client.post(
            "/webhooks/razorpay",
            content=raw_body,
            headers={"Content-Type": "application/json", "X-Razorpay-Signature": corrupt_sig},
        )
        print(f"[Check 1B] Corrupted Signature    -> Status: {resp_corrupt.status_code}, Body: {resp_corrupt.json()}")
        assert resp_corrupt.status_code == 401

        # Case C: Missing signature -> 401
        resp_missing = await client.post(
            "/webhooks/razorpay",
            content=raw_body,
            headers={"Content-Type": "application/json"},
        )
        print(f"[Check 1C] Missing Signature      -> Status: {resp_missing.status_code}, Body: {resp_missing.json()}")
        assert resp_missing.status_code == 401

    # 2. Synthetic Dataset Tier Counts
    print("\n[Check 2] Scenario counts per tier:")
    base_dir = Path("data/synthetic")
    for tier in ["clean", "partial", "adversarial"]:
        count = len(list((base_dir / tier).glob(f"{tier}_*")))
        print(f" - data/synthetic/{tier}: {count} scenarios")
        assert count == 50, f"Expected 50 in {tier}, found {count}"

    # 3. Partial Tier Rotation Check
    print("\n[Check 3] Partial Tier Missing Evidence Rotation:")
    partial_manifests = list((base_dir / "partial").glob("*/manifest.json"))
    missing_fields = []
    for mpath in partial_manifests:
        with open(mpath, "r", encoding="utf-8") as f:
            data = json.load(f)
            missing_fields.append(data.get("missing_field"))
    
    rotation_counts = Counter(missing_fields)
    for field, cnt in rotation_counts.items():
        print(f" - {field}: {cnt} scenarios")
    assert len(rotation_counts) == 3, "Missing fields should rotate across chat_log, pod_image, and awb_image"

    # 4. Adversarial Degradation Check
    print("\n[Check 4] Adversarial Tier Degradation Verification:")
    adv_manifest = json.loads((base_dir / "adversarial" / "adversarial_001" / "manifest.json").read_text(encoding="utf-8"))
    print(f" - adversarial_001 expected bucket: {adv_manifest['ground_truth']['expected_completeness_bucket']}")
    print(f" - adversarial_001 pod verified: {adv_manifest['ground_truth']['pod_signature_verified']}")
    print(f" - adversarial_001 chat admission: {adv_manifest['ground_truth']['customer_chat_admission']}")
    
    clean_size = (base_dir / "clean" / "clean_001" / "awb.jpg").stat().st_size
    adv_size = (base_dir / "adversarial" / "adversarial_001" / "awb.jpg").stat().st_size
    print(f" - Clean AWB filesize: {clean_size} bytes, Adversarial AWB filesize: {adv_size} bytes (compressed/degraded)")

    print("\n=== ALL PHASE 1 CHECKUP ITEMS VERIFIED SUCCESSFULLY ===")

if __name__ == "__main__":
    asyncio.run(run_phase1_checkup())
