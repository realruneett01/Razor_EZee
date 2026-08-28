# RazorSentinel — Implementation Plan for Gemini 3.7 Flash

**How to use this doc:** each task contains a ready-to-paste prompt for Gemini 3.7 Flash (marked `PROMPT →`). Run tasks in order within a phase. **Do not start the next phase until every item in that phase's "Phase Checkup" is independently verified** — not just claimed by the model's own summary of its work. The checkup steps are things *you* run or read yourself (grep, test output, file diffs), because a coding agent's self-report of "done" is not evidence.

Target stack (locked from the revised spec): FastAPI (Python 3.11) · Gemini 3 Flash Preview · Upstash Redis · Supabase (Postgres + Storage) · Next.js 14 + Tailwind · Razorpay Test Mode + ngrok.

---

## Phase 0 — Scaffolding & Environment

**Goal:** a running skeleton with no business logic, so every later phase has a known-good base.

### Task 0.1 — Repo & environment scaffold
```
PROMPT →
Scaffold a Python 3.11 FastAPI project named "razorsentinel" with this structure:
  app/main.py, app/config.py, app/webhooks/, app/engines/evidence/, app/engines/velocity/,
  app/db/, app/schemas/, tests/, .env.example, requirements.txt, README.md
Include fastapi, uvicorn, httpx, pydantic, python-dotenv, google-generativeai, upstash-redis,
supabase, weasyprint, pytest, pytest-asyncio in requirements.txt.
app/main.py must expose a GET /health endpoint returning {"status": "ok", "version": <from config>}.
Populate .env.example with every variable named in the spec (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET,
RAZORPAY_WEBHOOK_SECRET, GEMINI_API_KEY, GEMINI_MODEL, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN,
SUPABASE_URL, SUPABASE_KEY) with no real values.
Do not implement any webhook or engine logic yet — this task is scaffolding only.
```

### Task 0.2 — Supabase schema migration
```
PROMPT →
Using the schema below, write a Supabase SQL migration file at app/db/migrations/0001_init.sql,
plus a Python helper app/db/client.py that returns a configured Supabase client from env vars.
Do not invent extra columns beyond this schema:

<paste the disputes and risk_velocity_logs CREATE TABLE statements from the revised spec, §7>

Also write tests/test_db_client.py that asserts the client raises a clear error (not a silent None)
when SUPABASE_URL or SUPABASE_KEY is missing.
```

### Phase 0 Checkup — do not proceed until all pass
- [ ] `uvicorn app.main:app --reload` starts with no import errors; `curl localhost:8000/health` returns `200` with the expected JSON — paste the actual curl output, not a description of it.
- [ ] `grep -rn "TODO\|pass  #" app/` returns only files you expect to still be stubs (engines/), not webhooks or db.
- [ ] Run `pytest tests/test_db_client.py -v` and read the actual failure/pass output — confirm it fails cleanly (not with a stack trace from an unrelated bug) when env vars are unset.
- [ ] Open `app/db/migrations/0001_init.sql` yourself and diff its columns against §7 of the spec by hand — agents drop or rename columns silently.

---

## Phase 1 — Synthetic Test Bench & Webhook Ingestion

**Goal:** a webhook listener that correctly receives and verifies real Razorpay events, plus a generator that produces the 150+ synthetic scenarios the whole evaluation depends on later.

### Task 1.1 — Webhook listener with signature verification
```
PROMPT →
Implement app/webhooks/razorpay.py with a POST /webhooks/razorpay endpoint that:
1. Reads the raw request body (not the parsed JSON) and verifies the X-Razorpay-Signature header
   using HMAC-SHA256 against RAZORPAY_WEBHOOK_SECRET, per Razorpay's documented verification method.
2. Rejects (401) any request with an invalid or missing signature BEFORE parsing the payload.
3. Routes verified events by event type: "payment.dispute.created" → a stub call to
   app.engines.evidence.handle_dispute_created(payload); "payment.failed" and "order.paid" →
   a stub call to app.engines.velocity.handle_payment_event(payload).
4. Logs every received event (type, id, timestamp) to a local audit log regardless of routing outcome.
Write tests/test_webhook_signature.py covering: valid signature accepted, invalid signature rejected,
missing signature rejected, and an unrecognized event type accepted but not routed anywhere (no crash).
```

### Task 1.2 — Synthetic scenario generator
```
PROMPT →
Build a standalone script scripts/generate_synthetic_bench.py that produces 150 synthetic dispute
scenarios into data/synthetic/, split across three difficulty tiers (50 each):
  - "clean": full AWB scan (as a real image, not a placeholder), valid POD signature image, and a
    CRM chat log containing an explicit delivery admission.
  - "partial": missing exactly one of the three evidence sources (rotate which one across the 50).
  - "adversarial": AWB text present but low-quality/blurred image, POD signature ambiguous or absent,
    chat log with NO admission (customer maintains non-receipt, or chat is empty).
Each scenario gets a manifest.json entry recording the ground truth for every field the extraction
pipeline is supposed to output later (awb_number, delivery_status, pod_signature_verified,
customer_chat_admission, expected_completeness_bucket: "high"/"low"), so Phase 6 can score against
it. Print a summary table of scenario counts per tier when the script finishes.
```

### Phase 1 Checkup — do not proceed until all pass
- [ ] Send a real Razorpay test-mode webhook (via the Razorpay dashboard's "test webhook" feature or a manually HMAC-signed curl) and confirm in your own terminal that a `401` is returned when you deliberately corrupt the signature, and `200` when it's correct. Do this yourself — don't accept "tests pass" as a substitute for one live check.
- [ ] `ls data/synthetic/clean | wc -l`, same for `partial` and `adversarial` — confirm 50/50/50, not just "150 total" (an agent can pad one tier and shortchange another).
- [ ] Open 2–3 AWB images from `adversarial/` yourself and visually confirm they're actually degraded, not just copies of the clean set with a different filename.
- [ ] `cat data/synthetic/partial/*/manifest.json | jq .missing_field | sort | uniq -c` — confirm the "missing" evidence type is genuinely rotated across scenarios, not always the same field.

---

## Phase 2 — Evidence Extraction Pipeline

**Goal:** the Gemini 3 Flash Preview extraction call, returning a `completeness_score` that actually reflects evidence quality — this is the piece that determines whether the demo auto-submits or drafts.

### Task 2.1 — Structured extraction call
```
PROMPT →
Implement app/engines/evidence/extract.py per the revised spec §8: a Pydantic
DisputeExtractionOutput model (awb_number, recipient_name, delivery_status, delivery_timestamp,
pod_signature_verified, customer_chat_admission, contradiction_quote, completeness_score,
legal_summary) and analyze_dispute_evidence(awb_image_bytes, pod_image_bytes, chat_log_text) using
gemini-3-flash-preview with response_schema set to that model and temperature=0.1.
The prompt must explicitly instruct the model to reflect missing/unreadable sources honestly in
completeness_score rather than guessing — include that instruction verbatim from the spec.
Add retry-with-backoff (max 3 attempts) for transient API errors, and raise a clear typed exception
(not a bare Exception) if the model returns output that fails Pydantic validation after retries.
```

### Task 2.2 — Auto-submit / draft gate
```
PROMPT →
Implement app/engines/evidence/gate.py: decide_submission_path(extraction) returning "auto_submit"
if completeness_score >= 0.80 else "draft_for_human_review", per revised spec §8.
Wire this into handle_dispute_created(payload) from Task 1.1: on "auto_submit", proceed to dossier
generation (stub the actual PDF generation for now — return a fixed placeholder path); on
"draft_for_human_review", write a row to the disputes table with status="pending_review" and
auto_submitted=false, and do NOT call any Razorpay submission endpoint.
Write tests/test_gate.py with explicit boundary cases at completeness_score = 0.79, 0.80, 0.81.
```

### Phase 2 Checkup — do not proceed until all pass
- [ ] Run `analyze_dispute_evidence` against 5 real files from each synthetic tier (clean/partial/adversarial) from Phase 1 and paste the raw JSON output for at least one from each tier into your notes — don't just check that it "ran without error."
- [ ] Confirm by inspection: do `adversarial`-tier completeness scores actually come back lower than `clean`-tier ones? If an adversarial scenario scores 0.9, the honesty instruction in the prompt isn't working — fix the prompt before moving on, don't just lower the threshold to hide it.
- [ ] `pytest tests/test_gate.py -v` — read the actual pass/fail per boundary case.
- [ ] `grep -n "auto_submit\|draft_for_human_review" app/engines/evidence/*.py` — confirm both paths are reachable in the code, not just one branch that always wins.

---

## Phase 3 — Contest Submission Engine

**Goal:** real, correct calls to Razorpay's Documents and Disputes APIs — this is the part judges will most likely test live.

### Task 3.1 — Dossier PDF generation
```
PROMPT →
Implement app/engines/evidence/dossier.py: generate_dossier_pdf(extraction: DisputeExtractionOutput,
dispute_id: str) -> str (file path), using weasyprint to render a one-page evidence summary
(AWB number, delivery status/timestamp, POD verified yes/no, chat admission quote if any,
legal_summary) into data/dossiers/{dispute_id}.pdf. Include the completeness_score visibly on the
PDF itself, not just in the database — a human reviewing a "draft" case needs to see why.
```

### Task 3.2 — Documents API + Contest API integration
```
PROMPT →
Implement app/engines/evidence/submit.py:
1. upload_evidence_document(pdf_path) → POST https://api.razorpay.com/v1/documents with
   purpose="dispute_evidence", using RAZORPAY_KEY_ID/SECRET for basic auth. Return the doc_id.
2. contest_dispute(dispute_id, amount, summary, doc_id, action) → PATCH
   https://api.razorpay.com/v1/disputes/{dispute_id}/contest with shipping_proof=[doc_id],
   customer_communication=[doc_id], amount, summary, action. action must be "submit" for
   auto_submit-path cases and "draft" for human-reviewed cases per Razorpay's own draft/submit
   semantics — do not hardcode "submit" everywhere.
3. On any non-2xx response, write the full Razorpay error body to the disputes table
   (a new `last_error` column — add it via a migration) instead of swallowing it.
Wire this into the end of handle_dispute_created for the auto_submit path.
```

### Phase 3 Checkup — do not proceed until all pass
- [ ] Using Razorpay **test mode** keys, trigger one real end-to-end run: a synthetic clean-tier dispute → extraction → dossier PDF → `/v1/documents` upload → `/v1/disputes/{id}/contest`. Paste the actual Razorpay API response JSON from your terminal — not a log line saying "submitted successfully."
- [ ] Open the generated dossier PDF yourself and confirm the AWB number and quote in it match the source files, not garbled or truncated text.
- [ ] Deliberately break something (wrong dispute ID, expired test dispute, malformed doc_id) and confirm `last_error` in the database actually contains Razorpay's real error message — grep the DB row, don't trust a "handled gracefully" claim.
- [ ] Confirm in code (`grep -n 'action' app/engines/evidence/submit.py`) that the draft path really passes `action="draft"` — this is an easy place for an agent to hardcode `"submit"` and silently defeat the whole completeness gate from Phase 2.

---

## Phase 4 — Velocity & Ratio Shield

**Goal:** the sliding-window micro-transaction detector and the rolling dispute-ratio monitor, per revised spec §9.

### Task 4.1 — Sliding-window velocity detector
```
PROMPT →
Implement app/engines/velocity/shield.py: evaluate_transaction_velocity(ip_address, bin_number,
amount_in_inr) exactly per revised spec §9 (micro_count thresholds at 3 → FLAG_FOR_REVIEW and
5 → CHALLENGE_STEP_UP_OTP, window >10 events/60s → CHALLENGE_STEP_UP_OTP, else ALLOW), using
Upstash Redis as specified. Write tests/test_velocity.py that simulates a 12-request burst from one
fingerprint within 60 seconds and asserts the exact sequence of returned actions matches the
threshold logic, not just "eventually returns something other than ALLOW."
```

### Task 4.2 — Rolling dispute-ratio monitor
```
PROMPT →
Implement app/engines/velocity/ratio_monitor.py: compute_dispute_ratio() querying the disputes and
a (new, add via migration) successful_orders table for a rolling 30-day window, returning the ratio
as a float. Add get_ratio_status(ratio) → "safe" (<0.30%), "watch" (0.30–0.45%), "danger" (>=0.45%)
per the spec's 0.45% pre-threshold. This function only reads and reports — it must not call any
Razorpay endpoint or take any blocking action itself; wire the "danger" status to a log line only.
```

### Phase 4 Checkup — do not proceed until all pass
- [ ] `pytest tests/test_velocity.py -v` — read the actual assertion output for the 12-request burst; confirm the 3rd, 5th, and 11th requests specifically produce the documented transitions, not just that some request eventually gets flagged.
- [ ] Manually call `evaluate_transaction_velocity` from a Python shell with a real Upstash connection and watch the counter increment via the Upstash dashboard yourself — confirms it's actually hitting Redis, not a mocked stub left over from tests.
- [ ] `grep -rn "PATCH\|POST.*razorpay" app/engines/velocity/` — this should return **nothing**. Task 4.2 explicitly said read-only/log-only; if Gemini added an auto-block API call here, that's scope creep beyond what the spec allows and needs to be removed.

---

## Phase 5 — Merchant Dashboard

**Goal:** a Next.js view that shows real data from the pipeline above — not mock/hardcoded numbers.

### Task 5.1 — Dashboard scaffold + live data
```
PROMPT →
Scaffold a Next.js 14 + Tailwind app in dashboard/ with three views:
1. Dispute feed: list of rows from the disputes table (status, completeness_score, auto_submitted,
   last_error) fetched from a new FastAPI endpoint GET /api/disputes.
2. Health gauge: current dispute ratio and status ("safe"/"watch"/"danger") from
   GET /api/velocity/ratio, calling compute_dispute_ratio()/get_ratio_status() from Task 4.2.
3. Bot-attack log: recent risk_velocity_logs rows where risk_action_taken != "ALLOW", from
   GET /api/velocity/logs.
All three views must show a visible "no data yet" state — do not hardcode placeholder numbers that
would still render if the backend returns an empty list.
```

### Phase 5 Checkup — do not proceed until all pass
- [ ] Stop the FastAPI backend, reload the dashboard, and confirm each of the three views shows the explicit empty/error state — not a frozen last-good render or, worse, hardcoded demo numbers that never actually came from the API.
- [ ] Restart the backend, run one synthetic dispute through the full Phase 1–3 pipeline, and confirm the exact same row appears in the dashboard within a normal refresh — visually compare the DB row and the on-screen row field-by-field.
- [ ] `grep -rn "999900\|hardcod\|mock\|TODO" dashboard/` — flag anything that looks like a leftover placeholder value before the demo.

---

## Phase 6 — Held-Out Evaluation (the honesty-critical phase)

**Goal:** replace every "target" number from the revised spec's §5 with a real, measured number from `evaluate_risk.py`. This phase is the one Track 02 actually grades you on — do not skip or shortcut it.

### Task 6.1 — Evaluation harness
```
PROMPT →
Write scripts/evaluate_risk.py that runs the full Phase 2–4 pipeline against every scenario in
data/synthetic/ (Task 1.2) and computes, against the manifest.json ground truth:
  - AWB/POD OCR precision (exact-match fields vs. ground truth)
  - Chat contradiction recall (customer_chat_admission correctly identified, tier by tier)
  - Card-testing interception rate (replay a simulated burst per Task 4.1's test pattern against
    the "adversarial" tier's fingerprint data)
  - False-positive checkout friction rate (using a separate "legitimate shopper" batch you generate,
    NOT the adversarial tier — reusing adversarial data here would understate false positives)
Output a confusion matrix per metric and a single results.json. Do not average across difficulty
tiers in a way that hides tier-level performance — report clean/partial/adversarial separately too.
```

### Phase 6 Checkup — do not proceed until all pass
- [ ] Run `python scripts/evaluate_risk.py` yourself and read `results.json` directly — do not let a summary paragraph substitute for the actual numbers.
- [ ] Compare `results.json` against the "Design Target" column in the revised spec §5. If a real number is *below* target, that's the correct thing to write in the final pitch deck — the whole point of this phase is that the shipped number is whatever it actually is.
- [ ] Spot-check 5 scenarios by hand: open the source files, read the extraction output, and confirm the confusion-matrix classification (true positive / false positive / etc.) for each is actually correct — this catches bugs in the evaluation harness itself, not just the pipeline.
- [ ] Confirm tier-level breakdown exists in `results.json` (`clean`, `partial`, `adversarial` each scored separately) — a single blended number is not what Track 02 asked for and hides exactly the failure mode (thin-evidence auto-submits) this whole plan was designed to prevent.

---

## Phase 7 — Demo Packaging

**Goal:** a reproducible, judge-proof live demo.

### Task 7.1 — Demo script + reset
```
PROMPT →
Write scripts/demo_reset.py that clears all disputes/risk_velocity_logs test data and re-seeds
3 known-good demo scenarios (one clean auto-submit, one partial draft-for-review, one blocked
card-testing burst), so the live demo is repeatable and doesn't depend on leftover state from
earlier testing. Write docs/DEMO_SCRIPT.md walking through exactly what to click/run for each of
the 3 scenarios, including the expected dashboard state after each step.
```

### Phase 7 Checkup — before you consider this done
- [ ] Run `demo_reset.py` twice in a row and confirm the second run produces an identical starting state to the first — a non-idempotent reset script will embarrass you mid-demo.
- [ ] Have someone else (not the person who built it) follow `DEMO_SCRIPT.md` cold and confirm they get the documented dashboard state at each step without needing your help.
- [ ] Final gate: re-read revised spec §10 (Known Limitations) and confirm you can answer, out loud, without notes, what happens when a judge asks "what if the bank rejects this anyway" or "what stops this from auto-submitting garbage evidence." If you can't answer cleanly, that's a spec-understanding gap, not a coding gap — fix it before the demo, not during Q&A.
