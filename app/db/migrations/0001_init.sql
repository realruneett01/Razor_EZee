CREATE TABLE disputes (
    id VARCHAR(64) PRIMARY KEY, -- Razorpay dispute id, e.g. disp_AHfqOvkldwsbqt
    payment_id VARCHAR(64) NOT NULL,
    order_id VARCHAR(64) NOT NULL,
    amount_disputed INTEGER NOT NULL, -- paise
    reason_code VARCHAR(32) NOT NULL,
    status VARCHAR(32) DEFAULT 'open', -- open | under_review | won | lost
    model_version VARCHAR(32) DEFAULT 'gemini-3-flash-preview',
    evidence_doc_id VARCHAR(64),
    dossier_pdf_url TEXT,
    completeness_score NUMERIC(3,2), -- gates auto-submit vs. draft-for-review
    contradiction_found BOOLEAN DEFAULT FALSE,
    auto_submitted BOOLEAN DEFAULT FALSE, -- distinguishes auto vs. human-approved submits
    last_error TEXT, -- captures full Razorpay non-2xx error bodies
    contested_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE successful_orders (
    id VARCHAR(64) PRIMARY KEY, -- Razorpay order id / payment id
    amount INTEGER NOT NULL, -- paise
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE risk_velocity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fingerprint_hash VARCHAR(128) NOT NULL, -- hash(IP + User-Agent + BIN)
    amount INTEGER NOT NULL,
    is_micro_transaction BOOLEAN DEFAULT FALSE,
    risk_action_taken VARCHAR(32) DEFAULT 'ALLOW', -- ALLOW | CHALLENGE_OTP | BLOCK
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
