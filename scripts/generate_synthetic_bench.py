import os
import random
import json
import io
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

# Set random seed for reproducibility
random.seed(42)

COURIERS = [
    ("BlueDart Express", "BLUEDART"),
    ("Delhivery Logistics", "DELHIVERY"),
    ("DTDC Courier", "DTDC"),
    ("Shadowfax Technologies", "SHADOWFAX"),
    ("XpressBees", "XPRESSBEES"),
]

NAMES = [
    "Rahul Sharma", "Priya Nair", "Vikram Malhotra", "Ananya Deshmukh",
    "Rohan Verma", "Sneha Patel", "Aditya Kulkarni", "Kavita Rao",
    "Siddharth Mehta", "Deepika Iyer", "Amitabh Sen", "Pooja Banerjee",
    "Harish Joshi", "Meera Nambiar", "Rajesh Gupta", "Sunita Chawla",
    "Arjun Kapoor", "Divya Menon", "Karthik Reddy", "Ritu Singhania",
]

CITIES = ["Mumbai", "Bengaluru", "Delhi NCR", "Hyderabad", "Chennai", "Pune", "Kolkata", "Ahmedabad"]

DELIVERY_ADMISSION_QUOTES = [
    "Yes, I received the box yesterday at 2 PM, but the product inside was blue instead of black.",
    "I collected the package from my building security guard on Tuesday, but I want to return it.",
    "My brother received the parcel on my behalf on 14th Aug, but we decided we don't need it.",
    "The delivery agent handed me the shipment yesterday, but the size is too large.",
    "I opened the package this morning after taking it from the courier guy, but the accessories were missing.",
    "Package was delivered to my doorstep yesterday afternoon, but I already bought an alternative.",
    "I have the items with me here, delivered yesterday, but the seal was broken.",
    "Received the shipment on Friday, but I am raising a chargeback because of delayed shipping.",
]

NON_ADMISSION_QUOTES = [
    "I was home all day and nobody rang the bell. I have not received anything.",
    "Tracking shows delivered but my guard and I checked CCTV — no courier arrived.",
    "I never received this order. The signature on the POD is completely fake.",
    "I demand a full refund immediately. Delivery was never made to my address.",
    "Courier claimed recipient not available even though I was here. Zero delivery attempt.",
    "Where is my package? It has been 10 days and still nothing in hand.",
]


def create_awb_image(awb_number: str, courier_name: str, recipient_name: str, city: str, date_str: str, degraded: bool = False) -> Image.Image:
    """Generates a realistic AWB waybill image."""
    img = Image.new("RGB", (650, 420), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Outer border
    draw.rectangle([(10, 10), (640, 410)], outline=(40, 40, 40), width=3)
    draw.rectangle([(15, 15), (635, 75)], fill=(230, 240, 255), outline=(100, 150, 220), width=2)

    # Header
    draw.text((30, 25), f"AIR WAYBILL / PROOF OF SHIPMENT", fill=(10, 40, 100))
    draw.text((30, 48), f"Courier Partner: {courier_name}", fill=(50, 50, 50))
    draw.text((420, 30), "PRIORITY AIR", fill=(180, 20, 20))

    # Barcode representation
    draw.text((30, 90), f"AWB NO: {awb_number}", fill=(0, 0, 0))
    # Draw vertical barcode stripes
    for x in range(30, 350, 4):
        stripe_width = random.choice([1, 2, 3])
        draw.rectangle([(x, 115), (x + stripe_width, 160)], fill=(0, 0, 0))

    # Shipment details box
    draw.rectangle([(15, 175), (635, 330)], outline=(180, 180, 180), width=1)
    draw.text((30, 185), f"Consignee (Recipient): {recipient_name}", fill=(0, 0, 0))
    draw.text((30, 210), f"Destination Hub: {city} Central Hub", fill=(60, 60, 60))
    draw.text((30, 235), f"Delivery Status: DELIVERED", fill=(0, 120, 40))
    draw.text((30, 260), f"Delivery Timestamp: {date_str} IST", fill=(40, 40, 40))
    draw.text((30, 285), f"Package Weight: 0.85 kg | Pieces: 1", fill=(80, 80, 80))
    draw.text((30, 305), f"Payment Mode: PREPAID (Razorpay pg_txn_{random.randint(100000, 999999)})", fill=(80, 80, 80))

    # Security stamp
    draw.rectangle([(420, 220), (620, 310)], outline=(0, 120, 40), width=2)
    draw.text((435, 235), "VERIFIED DELIVERY", fill=(0, 120, 40))
    draw.text((435, 260), f"DATE: {date_str[:10]}", fill=(0, 120, 40))
    draw.text((435, 280), "STATUS: SUCCESSFUL", fill=(0, 120, 40))

    # Footer note
    draw.text((25, 350), "Official Courier Record — Scanned at Local Hub Destination", fill=(120, 120, 120))
    draw.text((25, 380), "Electronically Generated Proof of Delivery Waybill", fill=(140, 140, 140))

    if degraded:
        # Apply degradation: blur, contrast drop, noise, low JPEG quality
        img = img.filter(ImageFilter.GaussianBlur(radius=2.8))
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(0.6)
        enhancer_b = ImageEnhance.Brightness(img)
        img = enhancer_b.enhance(0.85)

        # Save to buffer with low JPEG quality and reload
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=15)
        buf.seek(0)
        img = Image.open(buf)

    return img


def create_pod_signature_image(recipient_name: str, date_str: str, verified: bool = True) -> Image.Image:
    """Generates a proof of delivery signature canvas."""
    img = Image.new("RGB", (400, 220), color=(250, 250, 250))
    draw = ImageDraw.Draw(img)

    draw.rectangle([(5, 5), (395, 215)], outline=(180, 180, 180), width=1)
    draw.text((15, 12), "PROOF OF DELIVERY SIGNATURE PAD", fill=(70, 70, 70))
    draw.text((15, 30), f"Date/Time: {date_str} IST", fill=(100, 100, 100))

    if verified:
        # Draw realistic signature stroke path
        points = []
        base_x, base_y = 50, 110
        for i in range(12):
            x = base_x + i * 22 + random.randint(-4, 4)
            y = base_y + ((-1) ** i) * random.randint(10, 35)
            points.append((x, y))
        # Draw connected lines with thickness
        for j in range(len(points) - 1):
            draw.line([points[j], points[j + 1]], fill=(15, 25, 110), width=3)
        # Signature underline
        draw.line([(45, 155), (320, 150)], fill=(15, 25, 110), width=2)
        draw.text((15, 175), f"Signer: {recipient_name} (Self)", fill=(50, 50, 50))
        draw.text((15, 195), "Identity Confirmed via OTP/Signature", fill=(0, 120, 40))
    else:
        # Ambiguous / unverified signature or rejected smudge
        draw.text((50, 90), "[NO SIGNATURE CAPTURED / SMUDGED]", fill=(180, 50, 50))
        draw.line([(40, 130), (120, 130)], fill=(180, 180, 180), width=1)
        draw.text((15, 180), "Signer: UNCONFIRMED / DOORSTEP DROP", fill=(150, 50, 50))

    return img


def generate_chat_log(customer_name: str, admission: bool, custom_quote: str) -> str:
    """Generates CRM customer support chat transcript."""
    order_id = f"order_ord_{random.randint(100000, 999999)}"
    if admission:
        transcript = (
            f"[WhatsApp Support Chat — Order {order_id}]\n"
            f"[2026-08-14 10:15:22] Customer ({customer_name}): Hi, I have an issue with my order.\n"
            f"[2026-08-14 10:16:05] Support Bot: Hello! Thank you for contacting merchant support. How can we help you today?\n"
            f"[2026-08-14 10:17:40] Customer ({customer_name}): {custom_quote}\n"
            f"[2026-08-14 10:18:30] Support Bot: We understand your concern. Please provide photos so our returns team can review.\n"
            f"[2026-08-14 10:25:10] Customer ({customer_name}): I have already filed a dispute with my bank.\n"
        )
    else:
        transcript = (
            f"[WhatsApp Support Chat — Order {order_id}]\n"
            f"[2026-08-14 11:02:10] Customer ({customer_name}): Where is my shipment? It hasn't arrived!\n"
            f"[2026-08-14 11:03:00] Support Bot: Hello {customer_name}! Let us check the tracking status for order {order_id}.\n"
            f"[2026-08-14 11:04:15] Customer ({customer_name}): {custom_quote}\n"
            f"[2026-08-14 11:05:40] Support Bot: We have escalated this to our logistics partner for investigation.\n"
            f"[2026-08-14 11:10:00] Customer ({customer_name}): I am initiating a bank chargeback right now.\n"
        )
    return transcript


def main():
    base_dir = Path("data/synthetic")
    base_dir.mkdir(parents=True, exist_ok=True)

    tier_counts = {"clean": 0, "partial": 0, "adversarial": 0}
    partial_rotation = ["chat_log", "pod_image", "awb_image"]

    print("Generating 150 synthetic dispute scenarios across 3 difficulty tiers (50 each)...")

    for tier in ["clean", "partial", "adversarial"]:
        tier_dir = base_dir / tier
        tier_dir.mkdir(parents=True, exist_ok=True)

        for i in range(1, 51):
            scenario_id = f"{tier}_{i:03d}"
            scenario_dir = tier_dir / scenario_id
            scenario_dir.mkdir(parents=True, exist_ok=True)

            courier_name, courier_code = random.choice(COURIERS)
            recipient = random.choice(NAMES)
            city = random.choice(CITIES)
            awb_number = f"{courier_code}-{city[:3].upper()}-{random.randint(10000000, 99999999)}"
            date_str = "2026-08-14T14:32:00Z"

            missing_field = None
            if tier == "clean":
                admission = True
                admission_quote = random.choice(DELIVERY_ADMISSION_QUOTES)
                degraded_awb = False
                verified_pod = True
                expected_completeness = "high"
                files_created = {
                    "awb_image": "awb.jpg",
                    "pod_image": "pod.png",
                    "chat_log": "chat_log.txt",
                }

                awb_img = create_awb_image(awb_number, courier_name, recipient, city, date_str, degraded=False)
                awb_img.save(scenario_dir / "awb.jpg", "JPEG", quality=95)

                pod_img = create_pod_signature_image(recipient, date_str, verified=True)
                pod_img.save(scenario_dir / "pod.png", "PNG")

                chat_text = generate_chat_log(recipient, admission=True, custom_quote=admission_quote)
                (scenario_dir / "chat_log.txt").write_text(chat_text, encoding="utf-8")

            elif tier == "partial":
                # Rotate missing evidence evenly across the 50 scenarios
                missing_field = partial_rotation[(i - 1) % len(partial_rotation)]
                expected_completeness = "low"
                files_created = {}

                # AWB
                if missing_field != "awb_image":
                    awb_img = create_awb_image(awb_number, courier_name, recipient, city, date_str, degraded=False)
                    awb_img.save(scenario_dir / "awb.jpg", "JPEG", quality=95)
                    files_created["awb_image"] = "awb.jpg"

                # POD
                verified_pod = (missing_field != "pod_image")
                if missing_field != "pod_image":
                    pod_img = create_pod_signature_image(recipient, date_str, verified=True)
                    pod_img.save(scenario_dir / "pod.png", "PNG")
                    files_created["pod_image"] = "pod.png"

                # Chat
                admission = (missing_field != "chat_log")
                if missing_field != "chat_log":
                    admission_quote = random.choice(DELIVERY_ADMISSION_QUOTES)
                    chat_text = generate_chat_log(recipient, admission=True, custom_quote=admission_quote)
                    (scenario_dir / "chat_log.txt").write_text(chat_text, encoding="utf-8")
                    files_created["chat_log"] = "chat_log.txt"
                else:
                    admission_quote = ""

            elif tier == "adversarial":
                admission = False
                admission_quote = ""
                non_admission_quote = random.choice(NON_ADMISSION_QUOTES)
                degraded_awb = True
                verified_pod = False
                expected_completeness = "low"
                files_created = {
                    "awb_image": "awb.jpg",
                    "pod_image": "pod.png",
                    "chat_log": "chat_log.txt",
                }

                awb_img = create_awb_image(awb_number, courier_name, recipient, city, date_str, degraded=True)
                awb_img.save(scenario_dir / "awb.jpg", "JPEG", quality=15)

                pod_img = create_pod_signature_image(recipient, date_str, verified=False)
                pod_img.save(scenario_dir / "pod.png", "PNG")

                chat_text = generate_chat_log(recipient, admission=False, custom_quote=non_admission_quote)
                (scenario_dir / "chat_log.txt").write_text(chat_text, encoding="utf-8")

            manifest = {
                "scenario_id": scenario_id,
                "tier": tier,
                "missing_field": missing_field,
                "ground_truth": {
                    "awb_number": awb_number if missing_field != "awb_image" else None,
                    "recipient_name": recipient if missing_field != "awb_image" else None,
                    "delivery_status": "DELIVERED" if missing_field != "awb_image" else "UNKNOWN",
                    "delivery_timestamp": date_str if missing_field != "awb_image" else None,
                    "pod_signature_verified": verified_pod if missing_field != "pod_image" else False,
                    "customer_chat_admission": admission if missing_field != "chat_log" else False,
                    "contradiction_quote": admission_quote if (tier == "clean" or (tier == "partial" and missing_field != "chat_log")) else "",
                    "expected_completeness_bucket": expected_completeness,
                },
                "files": files_created,
            }

            with open(scenario_dir / "manifest.json", "w", encoding="utf-8") as f:
                json.dump(manifest, f, indent=2)

            tier_counts[tier] += 1

    print("\n" + "=" * 50)
    print("       SYNTHETIC BENCHMARK GENERATION SUMMARY")
    print("=" * 50)
    print(f" Clean Tier Scenarios        : {tier_counts['clean']}")
    print(f" Partial Tier Scenarios      : {tier_counts['partial']}")
    print(f" Adversarial Tier Scenarios  : {tier_counts['adversarial']}")
    print(f" Total Scenarios Generated   : {sum(tier_counts.values())}")
    print("=" * 50)


if __name__ == "__main__":
    main()
