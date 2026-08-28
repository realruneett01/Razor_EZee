# RazorSentinel (AegisPay) — Live Hackathon Demo Script & Judge Q&A Guide

**Track 02**: AI Risk Manager  
**Project**: RazorSentinel (Multimodal Dispute-Evidence Assistant & Preemptive Velocity Shield)  
**Target Integration**: Razorpay Webhooks, Documents API (`/v1/documents`), & Disputes API (`/v1/disputes/{id}/contest`)

---

## 0. Pre-Demo Setup & Deterministic Reset

Before presenting to the judges, run the idempotent reset script:

```powershell
# 1. Reset database state & seed clean demo records
python scripts\demo_reset.py

# 2. Start FastAPI Backend (Terminal 1)
python -m uvicorn app.main:app --reload --port 8000

# 3. Start Next.js Merchant Dashboard (Terminal 2)
npm --prefix dashboard run dev
```

Open your browser to: **`http://localhost:3100`**

---

## 1. Demo Walkthrough: The 4 Acts

### Act 1: The Problem & The Dashboard Command Center
- **Action**: Point to the **RazorSentinel Dashboard** at `http://localhost:3100`.
- **Talking Points**:
  > "Indian card merchants face a statutory representment crisis: evidence is scattered across courier slips, signature pads, and WhatsApp chats. When a dispute is filed, Razorpay deducts the funds at onset, and acquiring banks threaten settlement freezes if dispute ratios cross 0.5%. RazorSentinel automates this with two cooperating defense engines."
- **Expected Dashboard State**:
  - **Summary Cards**: Active Disputes (2), Autonomous Contest Rate (50%), Contested Capital (₹7,498.00).
  - **Health Gauge**: Safe regulatory zone (`0.30%`), far below the 0.45% bank alert cap.
  - **Dispute Feed**: Displays `disp_demo_clean_001` and `disp_demo_partial_002`.

---

### Act 2: Autonomous Multimodal Evidence Representment (Clean Auto-Submit)
- **Scenario**: Dispute `disp_demo_clean_001` (₹4,999.00 — *Goods Not Received*).
- **Action**: Click **"Dossier PDF"** next to `disp_demo_clean_001`.
- **Talking Points**:
  > "When Razorpay emits a `payment.dispute.created` webhook, Gemini 3 Flash extracts the courier AWB waybill, verifies the recipient POD signature strokes, and scans the support chat.
  > Here, the customer claimed non-receipt, but their WhatsApp chat contains an explicit admission: *'The delivery agent handed me the shipment yesterday, but the size is too large.'*
  > Because the multimodal evidence is complete and unassailable, the Completeness Score is **1.00 / 1.00 (≥ 0.80)**.
  > RazorSentinel autonomously uploaded the compiled 1-page PDF dossier to Razorpay's Documents API and submitted the contest with `action='submit'` without requiring manual merchant labor."

---

### Act 3: The Honesty Safety Gate (Partial Draft Review)
- **Scenario**: Dispute `disp_demo_partial_002` (₹2,499.00 — *Unauthorized Transaction*).
- **Action**: Point to the status: **"Pending Merchant Review"** and Score: **75% (Draft Review)**. Click its **"Dossier PDF"**.
- **Talking Points**:
  > "What if evidence is missing or thin? Here, we have valid courier tracking, but no chat admission on record.
  > Most AI tools make the fatal mistake of auto-submitting weak evidence to the bank. 
  > RazorSentinel has a hard safety gate: scores below **0.80** are **NEVER auto-submitted**. 
  > Instead, it prepares the evidence packet and calls the API with `action='draft'`, routing it to the merchant's review queue so a human can inspect it before formal submission."

---

### Act 4: Preemptive Velocity Shield (Card-Testing Bot Interception)
- **Scenario**: Point to the **Preemptive Velocity Shield Log** on the dashboard.
- **Talking Points**:
  > "Disputes are only half the battle. Before disputes even happen, fraudsters run automated card-testing bots with micro-transactions (₹1 - ₹10) to validate stolen BINs.
  > RazorSentinel uses an Upstash Redis sliding-window detector.
  > Notice the intercepted stream: on attempts 1–2, transactions are allowed; by attempt 3, it's flagged; by attempt 5, it automatically challenges the checkout with **Step-Up OTP friction**, shutting down the bot sweep without hurting legitimate shoppers.
  > This protects the merchant's 30-day rolling ratio from ever crossing the acquiring-bank 0.45% settlement cliff."

---

## 2. Empirical Benchmark Proof (Track 02 Core Focus)

If judges ask about evaluation or benchmarks, show the held-out evaluation output:

```powershell
python scripts\evaluate_risk.py
```

**Results on 150 Held-Out Scenarios ([`results.json`](file:///c:/Users/realr/OneDrive/Desktop/Razor/results.json))**:
- **AWB & POD OCR Precision**: **100.00%** *(Design Target: $\ge 90\%$)*
- **Chat Contradiction Recall**: **100.00%** *(Design Target: $\ge 85\%$)*
- **Bot Campaign Interception Rate**: **100.00%** *(Design Target: $\ge 95\%$)*
- **False-Positive Checkout Friction**: **0.00%** *(Design Target: $< 2\%$)*
- **Net Recovered Financial Capital**: **₹2,49,950.00 INR**

---

## 3. Judge Q&A Defense Sheet (§10 Known Limitations)

### Q1: *"What if the issuing bank rejects the representment anyway?"*
> **Answer**: "We do not claim a 100% win rate because final settlement decisions are legally and structurally made by the issuing bank's dispute committee, not by any fintech software. What RazorSentinel guarantees is **maximal evidentiary completeness** — eliminating human formatting errors, missing chronological data, and missed chat contradictions — ensuring the merchant has the highest statistical probability of recovery under Visa/Mastercard representment rules."

### Q2: *"What stops the AI agent from hallucinating and submitting garbage evidence?"*
> **Answer**: "Three architectural safeguards:
> 1. **Structured Pydantic Output Enforcement**: Gemini is constrained to strict JSON schemas with temperature 0.1.
> 2. **Honesty Prompting with Completeness Gating**: The model is instructed to reflect missing sources in the `completeness_score`.
> 3. **The 0.80 Hard Threshold Gate**: Any dispute scoring below 0.80 is held in `draft` mode for human sign-off and is never submitted autonomously."

### Q3: *"How does scanning customer support chats comply with India's DPDP Act?"*
> **Answer**: "India's Digital Personal Data Protection (DPDP) Act mandates purpose limitation and lawful basis for processing. Support chat analysis operates under legitimate merchant fraud prevention and fulfillment verification. Furthermore, only the exact relevant contradiction excerpt is cited in the bank representment dossier, and raw chats are not stored permanently beyond statutory audit requirements."

### Q4: *"Why use sliding-window Redis heuristics rather than a pure deep learning classifier for velocity?"*
> **Answer**: "Card-testing bursts occur in sub-second bursts. Redis in-memory atomic sliding window operations (`ZREMRANGEBYSCORE`, `INCR`, `ZCARD`) evaluate in `< 2ms` with zero cold starts, making them ideal for high-throughput checkout edge protection before bank settlement ratios are impacted."
