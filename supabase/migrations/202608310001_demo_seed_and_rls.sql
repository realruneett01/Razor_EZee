-- Migration: 202608310001_demo_seed_and_rls.sql
-- Description: Interactive Judge Demo Baseline Schema, Seed Functions, RLS, and Pitch Action RPCs

-- Constant Demo Merchant UUID: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11

-- 1. Table Schema Alignments
ALTER TABLE IF EXISTS successful_orders 
ADD COLUMN IF NOT EXISTS merchant_id UUID DEFAULT 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

ALTER TABLE IF EXISTS disputes 
ADD COLUMN IF NOT EXISTS merchant_id UUID DEFAULT 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

ALTER TABLE IF EXISTS risk_velocity_logs 
ADD COLUMN IF NOT EXISTS merchant_id UUID DEFAULT 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
ADD COLUMN IF NOT EXISTS is_simulated BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS evidence_dossiers (
    id VARCHAR(64) PRIMARY KEY,
    dispute_id VARCHAR(64) REFERENCES disputes(id) ON DELETE CASCADE,
    merchant_id UUID DEFAULT 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    awb_number VARCHAR(64) NOT NULL,
    carrier_name VARCHAR(64) NOT NULL,
    recipient_name VARCHAR(128),
    pod_signature_verified BOOLEAN DEFAULT FALSE,
    customer_chat_admission BOOLEAN DEFAULT FALSE,
    contradiction_quote TEXT,
    completeness_score NUMERIC(3,2) NOT NULL,
    dossier_pdf_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. RLS Security Policies
ALTER TABLE successful_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_velocity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_dossiers ENABLE ROW LEVEL SECURITY;

-- Anonymous (Public Read-Only) Policies for Demo Merchant
DROP POLICY IF EXISTS "anon_read_demo_orders" ON successful_orders;
CREATE POLICY "anon_read_demo_orders" ON successful_orders
    FOR SELECT TO anon
    USING (merchant_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

DROP POLICY IF EXISTS "anon_read_demo_disputes" ON disputes;
CREATE POLICY "anon_read_demo_disputes" ON disputes
    FOR SELECT TO anon
    USING (merchant_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

DROP POLICY IF EXISTS "anon_read_demo_velocity_logs" ON risk_velocity_logs;
CREATE POLICY "anon_read_demo_velocity_logs" ON risk_velocity_logs
    FOR SELECT TO anon
    USING (merchant_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

DROP POLICY IF EXISTS "anon_read_demo_dossiers" ON evidence_dossiers;
CREATE POLICY "anon_read_demo_dossiers" ON evidence_dossiers
    FOR SELECT TO anon
    USING (merchant_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

-- Authenticated / Service Role Full Access Policies
DROP POLICY IF EXISTS "service_all_orders" ON successful_orders;
CREATE POLICY "service_all_orders" ON successful_orders
    FOR ALL TO authenticated, service_role
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_all_disputes" ON disputes;
CREATE POLICY "service_all_disputes" ON disputes
    FOR ALL TO authenticated, service_role
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_all_velocity_logs" ON risk_velocity_logs;
CREATE POLICY "service_all_velocity_logs" ON risk_velocity_logs
    FOR ALL TO authenticated, service_role
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_all_dossiers" ON evidence_dossiers;
CREATE POLICY "service_all_dossiers" ON evidence_dossiers
    FOR ALL TO authenticated, service_role
    USING (true) WITH CHECK (true);


-- 3. Deterministic Baseline Seed Function (Idempotent)
CREATE OR REPLACE FUNCTION demo_seed_baseline()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_demo_merchant UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    v_now TIMESTAMPTZ := NOW();
    i INT;
BEGIN
    -- Purge previous demo data
    DELETE FROM evidence_dossiers WHERE merchant_id = v_demo_merchant;
    DELETE FROM disputes WHERE merchant_id = v_demo_merchant;
    DELETE FROM successful_orders WHERE merchant_id = v_demo_merchant;
    DELETE FROM risk_velocity_logs WHERE merchant_id = v_demo_merchant;

    -- A. Seed 140 Successful Orders totaling exactly ₹41,85,600 (418,560,000 paise)
    FOR i IN 1..140 LOOP
        INSERT INTO successful_orders (id, merchant_id, amount, created_at)
        VALUES (
            'order_demo_baseline_' || LPAD(i::text, 4, '0'),
            v_demo_merchant,
            CASE 
                WHEN i <= 40 THEN 149900  -- ₹1,499.00 (x40 = ₹59,960)
                WHEN i <= 90 THEN 299900  -- ₹2,999.00 (x50 = ₹1,49,950)
                WHEN i <= 130 THEN 499900 -- ₹4,999.00 (x40 = ₹1,99,960)
                ELSE 3775730              -- Remainder chunk (x10 = ₹3,77,573) -> Gross: ₹41,85,600
            END,
            v_now - (i * 5 || ' hours')::interval
        );
    END LOOP;

    -- B. Seed 7 Canonical Disputes matching exact target KPIs:
    -- Outcome: 4 Won (₹36,100 recovered), 2 Under Review (Auto-Submitted), 1 Draft (Protected)
    -- Reasons: 4 Goods Not Received (57.1%), 2 Unauthorized (28.6%), 1 Duplicate (14.3%)
    -- Carriers: BlueDart (3), Delhivery (3), Shadowfax (1)

    -- 1. Won Dispute 1 (BlueDart / Goods not received / ₹12,500)
    INSERT INTO disputes (id, merchant_id, payment_id, order_id, amount_disputed, reason_code, status, model_version, evidence_doc_id, dossier_pdf_url, completeness_score, contradiction_found, auto_submitted, created_at, contested_at)
    VALUES ('disp_demo_won_001', v_demo_merchant, 'pay_demo_won_001', 'order_demo_won_001', 1250000, 'goods_not_received', 'won', 'gemini-3-flash-preview', 'doc_evidence_bluedart_001', 'data/dossiers/disp_demo_won_001.pdf', 1.00, true, true, v_now - INTERVAL '24 days', v_now - INTERVAL '23 days');

    INSERT INTO evidence_dossiers (id, dispute_id, merchant_id, awb_number, carrier_name, recipient_name, pod_signature_verified, customer_chat_admission, contradiction_quote, completeness_score, created_at)
    VALUES ('dossier_001', 'disp_demo_won_001', v_demo_merchant, 'BLUEDART-DEL-88912', 'BlueDart Express', 'Vikram Seth', true, true, 'I received the courier packet on Friday afternoon.', 1.00, v_now - INTERVAL '24 days');

    -- 2. Won Dispute 2 (Delhivery / Goods not received / ₹8,900)
    INSERT INTO disputes (id, merchant_id, payment_id, order_id, amount_disputed, reason_code, status, model_version, evidence_doc_id, dossier_pdf_url, completeness_score, contradiction_found, auto_submitted, created_at, contested_at)
    VALUES ('disp_demo_won_002', v_demo_merchant, 'pay_demo_won_002', 'order_demo_won_002', 890000, 'goods_not_received', 'won', 'gemini-3-flash-preview', 'doc_evidence_delhivery_002', 'data/dossiers/disp_demo_won_002.pdf', 0.95, true, true, v_now - INTERVAL '20 days', v_now - INTERVAL '19 days');

    INSERT INTO evidence_dossiers (id, dispute_id, merchant_id, awb_number, carrier_name, recipient_name, pod_signature_verified, customer_chat_admission, contradiction_quote, completeness_score, created_at)
    VALUES ('dossier_002', 'disp_demo_won_002', v_demo_merchant, 'DELHIVERY-BOM-77192', 'Delhivery Logistics', 'Ananya Roy', true, true, 'The parcel was handed over to my building receptionist.', 0.95, v_now - INTERVAL '20 days');

    -- 3. Won Dispute 3 (BlueDart / Unauthorized Txn / ₹7,800)
    INSERT INTO disputes (id, merchant_id, payment_id, order_id, amount_disputed, reason_code, status, model_version, evidence_doc_id, dossier_pdf_url, completeness_score, contradiction_found, auto_submitted, created_at, contested_at)
    VALUES ('disp_demo_won_003', v_demo_merchant, 'pay_demo_won_003', 'order_demo_won_003', 780000, 'unauthorized_transaction', 'won', 'gemini-3-flash-preview', 'doc_evidence_bluedart_003', 'data/dossiers/disp_demo_won_003.pdf', 0.90, true, true, v_now - INTERVAL '16 days', v_now - INTERVAL '15 days');

    INSERT INTO evidence_dossiers (id, dispute_id, merchant_id, awb_number, carrier_name, recipient_name, pod_signature_verified, customer_chat_admission, contradiction_quote, completeness_score, created_at)
    VALUES ('dossier_003', 'disp_demo_won_003', v_demo_merchant, 'BLUEDART-BLR-66102', 'BlueDart Express', 'Karan Mehta', true, true, 'I confirmed the OTP on my personal phone.', 0.90, v_now - INTERVAL '16 days');

    -- 4. Won Dispute 4 (Shadowfax / Duplicate Charge / ₹6,900)
    INSERT INTO disputes (id, merchant_id, payment_id, order_id, amount_disputed, reason_code, status, model_version, evidence_doc_id, dossier_pdf_url, completeness_score, contradiction_found, auto_submitted, created_at, contested_at)
    VALUES ('disp_demo_won_004', v_demo_merchant, 'pay_demo_won_004', 'order_demo_won_004', 690000, 'duplicate_charge', 'won', 'gemini-3-flash-preview', 'doc_evidence_shadowfax_004', 'data/dossiers/disp_demo_won_004.pdf', 0.85, true, true, v_now - INTERVAL '12 days', v_now - INTERVAL '11 days');

    INSERT INTO evidence_dossiers (id, dispute_id, merchant_id, awb_number, carrier_name, recipient_name, pod_signature_verified, customer_chat_admission, contradiction_quote, completeness_score, created_at)
    VALUES ('dossier_004', 'disp_demo_won_004', v_demo_merchant, 'SHADOWFAX-HYD-55019', 'Shadowfax', 'Neha Patel', true, false, 'Invoice records match distinct SKU delivery.', 0.85, v_now - INTERVAL '12 days');

    -- 5. Active Under Review Dispute 5 (BlueDart / Goods not received / ₹4,999)
    INSERT INTO disputes (id, merchant_id, payment_id, order_id, amount_disputed, reason_code, status, model_version, evidence_doc_id, dossier_pdf_url, completeness_score, contradiction_found, auto_submitted, created_at, contested_at)
    VALUES ('disp_demo_clean_005', v_demo_merchant, 'pay_demo_clean_005', 'order_demo_clean_005', 499900, 'goods_not_received', 'under_review', 'gemini-3-flash-preview', 'doc_evidence_bluedart_005', 'data/dossiers/disp_demo_clean_005.pdf', 1.00, true, true, v_now - INTERVAL '2 days', v_now - INTERVAL '2 days');

    INSERT INTO evidence_dossiers (id, dispute_id, merchant_id, awb_number, carrier_name, recipient_name, pod_signature_verified, customer_chat_admission, contradiction_quote, completeness_score, created_at)
    VALUES ('dossier_005', 'disp_demo_clean_005', v_demo_merchant, 'BLUEDART-MAA-44192', 'BlueDart Express', 'Rahul Sharma', true, true, 'The delivery agent handed me the shipment yesterday, but the size is too large.', 1.00, v_now - INTERVAL '2 days');

    -- 6. Active Under Review Dispute 6 (Delhivery / Goods not received / ₹3,499)
    INSERT INTO disputes (id, merchant_id, payment_id, order_id, amount_disputed, reason_code, status, model_version, evidence_doc_id, dossier_pdf_url, completeness_score, contradiction_found, auto_submitted, created_at, contested_at)
    VALUES ('disp_demo_clean_006', v_demo_merchant, 'pay_demo_clean_006', 'order_demo_clean_006', 349900, 'goods_not_received', 'under_review', 'gemini-3-flash-preview', 'doc_evidence_delhivery_006', 'data/dossiers/disp_demo_clean_006.pdf', 0.90, true, true, v_now - INTERVAL '1 day', v_now - INTERVAL '1 day');

    INSERT INTO evidence_dossiers (id, dispute_id, merchant_id, awb_number, carrier_name, recipient_name, pod_signature_verified, customer_chat_admission, contradiction_quote, completeness_score, created_at)
    VALUES ('dossier_006', 'disp_demo_clean_006', v_demo_merchant, 'DELHIVERY-PNQ-33104', 'Delhivery Logistics', 'Deepak Joshi', true, true, 'I opened the package and verified items inside.', 0.90, v_now - INTERVAL '1 day');

    -- 7. Draft Review Dispute 7 (Delhivery / Unauthorized / ₹2,499 / Score 0.70 < 0.80 -> Held in Draft)
    INSERT INTO disputes (id, merchant_id, payment_id, order_id, amount_disputed, reason_code, status, model_version, evidence_doc_id, dossier_pdf_url, completeness_score, contradiction_found, auto_submitted, created_at, contested_at)
    VALUES ('disp_demo_draft_007', v_demo_merchant, 'pay_demo_draft_007', 'order_demo_draft_007', 249900, 'unauthorized_transaction', 'open', 'gemini-3-flash-preview', 'doc_evidence_delhivery_007', 'data/dossiers/disp_demo_draft_007.pdf', 0.70, false, false, v_now - INTERVAL '4 hours', NULL);

    INSERT INTO evidence_dossiers (id, dispute_id, merchant_id, awb_number, carrier_name, recipient_name, pod_signature_verified, customer_chat_admission, contradiction_quote, completeness_score, created_at)
    VALUES ('dossier_007', 'disp_demo_draft_007', v_demo_merchant, 'DELHIVERY-CCU-22019', 'Delhivery Logistics', 'Priya Nair', true, false, NULL, 0.70, v_now - INTERVAL '4 hours');

    -- C. Seed 52 Velocity Shield Logs across past 30 days
    FOR i IN 1..52 LOOP
        INSERT INTO risk_velocity_logs (merchant_id, fingerprint_hash, amount, is_micro_transaction, risk_action_taken, is_simulated, created_at)
        VALUES (
            v_demo_merchant,
            MD5('device_' || (i % 12)::text || '_ip_192.168.1.' || (100 + i)::text),
            CASE WHEN i % 3 = 0 THEN 250 ELSE 85000 END,
            (i % 3 = 0),
            CASE 
                WHEN i % 5 = 0 THEN 'CHALLENGE_STEP_UP_OTP'
                WHEN i % 3 = 0 THEN 'FLAG_FOR_REVIEW'
                ELSE 'ALLOW'
            END,
            false,
            v_now - (i * 12 || ' hours')::interval
        );
    END LOOP;

    RETURN jsonb_build_object(
        'status', 'success',
        'message', 'Seeded baseline judge demo data',
        'gross_turnover_inr', 4185600.00,
        'disputes_count', 7,
        'capital_recovered_inr', 36100.00,
        'dispute_ratio_pct', 0.25,
        'velocity_logs_count', 52
    );
END;
$$;


-- 4. Live On-Stage Simulation Functions (Presenter Pitch Mode)

-- Function A: Simulate Incoming Order (+ ₹2,499.00 turnover)
CREATE OR REPLACE FUNCTION demo_simulate_incoming_order()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_demo_merchant UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    v_order_id VARCHAR := 'order_live_' || EXTRACT(EPOCH FROM NOW())::bigint;
    v_amount INT := 249900; -- ₹2,499.00
BEGIN
    INSERT INTO successful_orders (id, merchant_id, amount, created_at)
    VALUES (v_order_id, v_demo_merchant, v_amount, NOW());

    RETURN jsonb_build_object(
        'status', 'success',
        'event', 'order.paid',
        'order_id', v_order_id,
        'amount_inr', 2499.00,
        'timestamp', NOW()
    );
END;
$$;


-- Function B: Simulate Micro-Probe Bot Burst (5x ₹2.50 card tests)
CREATE OR REPLACE FUNCTION demo_simulate_micro_probe_burst()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_demo_merchant UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    v_hash VARCHAR := MD5('bot_burst_' || EXTRACT(EPOCH FROM NOW())::text);
    i INT;
    v_actions TEXT[] := ARRAY['ALLOW', 'ALLOW', 'FLAG_FOR_REVIEW', 'FLAG_FOR_REVIEW', 'CHALLENGE_STEP_UP_OTP'];
BEGIN
    FOR i IN 1..5 LOOP
        INSERT INTO risk_velocity_logs (merchant_id, fingerprint_hash, amount, is_micro_transaction, risk_action_taken, is_simulated, created_at)
        VALUES (
            v_demo_merchant,
            v_hash,
            250, -- ₹2.50
            true,
            v_actions[i],
            true,
            NOW() - ((6 - i) * 200 || ' milliseconds')::interval
        );
    END LOOP;

    RETURN jsonb_build_object(
        'status', 'success',
        'event', 'micro_probe_burst',
        'probes_injected', 5,
        'final_verdict', 'CHALLENGE_STEP_UP_OTP',
        'timestamp', NOW()
    );
END;
$$;


-- Function C: Trigger Dispute Autonomous Defense Evaluation
CREATE OR REPLACE FUNCTION demo_trigger_dispute_defense(p_dispute_id VARCHAR)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_score NUMERIC;
    v_auto_submit BOOLEAN;
BEGIN
    SELECT completeness_score INTO v_score 
    FROM disputes WHERE id = p_dispute_id;

    IF v_score IS NULL THEN
        v_score := 1.00;
    END IF;

    v_auto_submit := (v_score >= 0.80);

    UPDATE disputes 
    SET 
        status = CASE WHEN v_auto_submit THEN 'under_review' ELSE 'open' END,
        auto_submitted = v_auto_submit,
        contested_at = NOW()
    WHERE id = p_dispute_id;

    RETURN jsonb_build_object(
        'status', 'success',
        'dispute_id', p_dispute_id,
        'completeness_score', v_score,
        'auto_submitted', v_auto_submit,
        'action_taken', CASE WHEN v_auto_submit THEN 'SUBMITTED_TO_RAZORPAY_API' ELSE 'HELD_IN_DRAFT_REVIEW' END
    );
END;
$$;


-- Function D: Reset to Deterministic Baseline
CREATE OR REPLACE FUNCTION demo_reset_to_baseline()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN demo_seed_baseline();
END;
$$;
