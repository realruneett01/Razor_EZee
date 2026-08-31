"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Code, ChevronDown, ChevronUp, Copy, Check, Terminal, Shield, Zap, CheckCircle2, AlertTriangle } from "lucide-react";
import { useDemo } from "@/context/DemoContext";

interface TraceStep {
  t: string;
  msg: string;
  status: "pass" | "hold" | "alert" | "info";
  badge: string;
}

interface Scenario {
  id: "clean" | "partial" | "burst" | "turnover";
  title: string;
  desc: string;
  icon: any;
  payload: any;
  steps: TraceStep[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

export default function SimulatorPage() {
  const { triggerSpikeEnergy, runAction } = useDemo();
  const [selectedId, setSelectedId] = useState<"clean" | "partial" | "burst" | "turnover">("clean");
  const [running, setRunning] = useState<boolean>(false);
  const [traces, setTraces] = useState<TraceStep[]>([]);
  const [showPayload, setShowPayload] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const scenarios: Scenario[] = [
    {
      id: "clean",
      title: "Clean dispute — auto-submit",
      desc: "Full AWB, verified POD, chat admission (score 1.00)",
      icon: CheckCircle2,
      payload: {
        event: "payment.dispute.created",
        payload: {
          dispute: {
            id: "disp_sim_clean_1001",
            payment_id: "pay_sample_test_001",
            order_id: "order_sample_test_001",
            amount: 499900,
            currency: "INR",
            reason_code: "goods_not_received",
            evidence_doc_id: "bluedart_awb_3849201948",
            created_at: Math.floor(Date.now() / 1000),
          },
        },
      },
      steps: [
        { t: "00:00:00.012", msg: "Webhook received · HMAC-SHA256 signature verified against X-Razorpay-Signature", status: "pass", badge: "Verified" },
        { t: "00:00:00.038", msg: "Dispute schema validated · disp_sim_clean_1001 (₹4,999.00) · Reason: goods_not_received", status: "pass", badge: "Ingested" },
        { t: "00:00:00.142", msg: "Carrier Logistics API matched · BlueDart AWB #3849201948 · Delivered 2026-08-28 14:22 IST", status: "pass", badge: "Courier Match" },
        { t: "00:00:00.285", msg: "Multimodal POD verified · Recipient biometric signature matched with geo-pin 19.0760, 72.8777", status: "pass", badge: "Signature Match" },
        { t: "00:00:00.410", msg: 'WhatsApp Support Chat mined · Customer admission quote extracted: "Received package yesterday"', status: "pass", badge: "Chat Admission" },
        { t: "00:00:00.540", msg: "Honesty Safety Gate evaluated · Completeness Score 1.00 (≥ 0.80 required threshold)", status: "pass", badge: "Gate Passed" },
        { t: "00:00:00.720", msg: "1-Page PDF evidence dossier compiled & submitted to Razorpay API with action='submit'", status: "pass", badge: "Auto-Submitted" },
      ],
    },
    {
      id: "partial",
      title: "Partial dispute — draft for review",
      desc: "Missing chat admission, holds in draft mode (score 0.70)",
      icon: AlertTriangle,
      payload: {
        event: "payment.dispute.created",
        payload: {
          dispute: {
            id: "disp_sim_partial_2002",
            payment_id: "pay_sample_partial_002",
            order_id: "order_sample_partial_002",
            amount: 249900,
            currency: "INR",
            reason_code: "unauthorized_transaction",
            evidence_doc_id: "delhivery_awb_9817264510",
            created_at: Math.floor(Date.now() / 1000),
          },
        },
      },
      steps: [
        { t: "00:00:00.012", msg: "Webhook received · HMAC-SHA256 signature verified against X-Razorpay-Signature", status: "pass", badge: "Verified" },
        { t: "00:00:00.035", msg: "Dispute schema validated · disp_sim_partial_2002 (₹2,499.00) · Reason: unauthorized_transaction", status: "pass", badge: "Ingested" },
        { t: "00:00:00.120", msg: "Carrier Logistics API matched · Delhivery AWB #9817264510 · Delivered successfully", status: "pass", badge: "Courier Match" },
        { t: "00:00:00.290", msg: "Multimodal extraction warning · WhatsApp chat lacks unambiguous customer transaction confirmation", status: "hold", badge: "Missing Proof" },
        { t: "00:00:00.435", msg: "Honesty Safety Gate computed confidence score 0.70 (< 0.80 required auto-submit threshold)", status: "hold", badge: "Score 0.70" },
        { t: "00:00:00.580", msg: "Autonomous submission REFUSED · Protected merchant from ₹2,500 acquiring bank arbitration penalty", status: "pass", badge: "Fee Avoided" },
        { t: "00:00:00.695", msg: "Dossier routed to merchant Draft Review Queue for optional manual merchant evidence enrichment", status: "hold", badge: "Draft Held" },
      ],
    },
    {
      id: "burst",
      title: "Bot card-testing micro burst",
      desc: "₹2.00 micro-transaction triggers step-up OTP",
      icon: Shield,
      payload: {
        event: "payment.failed",
        payload: {
          payment: {
            id: "pay_failed_micro_3003",
            amount: 200,
            currency: "INR",
            notes: {
              ip_address: "198.51.100.99",
              bin_number: "400012",
              user_agent: "SyntheticAttackBot/2.0",
            },
            created_at: Math.floor(Date.now() / 1000),
          },
        },
      },
      steps: [
        { t: "00:00:00.002", msg: "Edge Interceptor received transaction telemetry · IP 198.51.100.99 · BIN 400012", status: "pass", badge: "Edge Hit" },
        { t: "00:00:00.004", msg: "Amount evaluation · ₹2.00 detected as sub-threshold micro-probe (threshold ≤ ₹10.00)", status: "alert", badge: "Micro-Probe" },
        { t: "00:00:00.006", msg: "Upstash Redis sliding window evaluated in 1.2ms · IP cluster count: 5 events in 60s", status: "pass", badge: "Sliding Window" },
        { t: "00:00:00.008", msg: "Velocity threshold evaluated: Attempt 1-2 ALLOW · Attempt 3-4 FLAG · Attempt 5 BREACH", status: "alert", badge: "Threshold Breach" },
        { t: "00:00:00.011", msg: "Rate of Request spiked to 18.4 req/s · Velocity Shield waveform entered Burgundy Zone", status: "alert", badge: "Wave Spiked" },
        { t: "00:00:00.014", msg: "Preemptive Risk Mitigation: Enforced Step-Up 3D-Secure OTP friction challenge", status: "pass", badge: "Step-Up OTP" },
        { t: "00:00:00.018", msg: "Audit logged to risk_velocity_logs · Zero mutation on legitimate merchant settlements", status: "pass", badge: "Zero-Mutation" },
      ],
    },
    {
      id: "turnover",
      title: "Normal order paid event",
      desc: "Syncs turnover for the 30-day dispute denominator",
      icon: Zap,
      payload: {
        event: "order.paid",
        payload: {
          order: {
            id: "order_paid_4004",
            amount: 150000,
            currency: "INR",
            status: "paid",
            customer: {
              email: "buyer.verified@example.com",
              contact: "+919876543210",
            },
            created_at: Math.floor(Date.now() / 1000),
          },
        },
      },
      steps: [
        { t: "00:00:00.010", msg: "Webhook received · Event order.paid · Order ID: order_paid_4004", status: "pass", badge: "Verified" },
        { t: "00:00:00.024", msg: "HMAC-SHA256 signature verified against Razorpay Webhook Secret", status: "pass", badge: "HMAC Match" },
        { t: "00:00:00.065", msg: "Transaction parsed: ₹1,500.00 (150,000 paise) · Frictionless standard checkout verified", status: "pass", badge: "Frictionless" },
        { t: "00:00:00.110", msg: "Database updated · Ingested to successful_orders table with merchant UUID binding", status: "pass", badge: "DB Ingested" },
        { t: "00:00:00.180", msg: "30-Day rolling turnover denominator recalculated: ₹41,85,600.00 → ₹41,87,100.00", status: "pass", badge: "Turnover Synced" },
        { t: "00:00:00.245", msg: "Dispute-to-turnover ratio safely diluted: 0.250% → 0.249% (Safe Regulatory Zone < 0.30%)", status: "pass", badge: "Ratio Diluted" },
        { t: "00:00:00.310", msg: "Merchant health index: Settlement freeze risk remain 0.00% (Well below 0.45% freeze cap)", status: "pass", badge: "Safe Zone" },
      ],
    },
  ];

  const activeScenario = scenarios.find((s) => s.id === selectedId) || scenarios[0];

  const triggerScenario = async () => {
    setRunning(true);
    setTraces([]);

    // 1. Sync live backend simulation and graph kinetics
    try {
      if (selectedId === "clean") {
        triggerSpikeEnergy(0.9);
        await runAction("defend");
      } else if (selectedId === "partial") {
        triggerSpikeEnergy(0.5);
        await runAction("gate");
      } else if (selectedId === "burst") {
        triggerSpikeEnergy(1.8);
        await runAction("burst");
      } else if (selectedId === "turnover") {
        triggerSpikeEnergy(0.4);
        await runAction("order");
      }
    } catch (e) {
      console.debug("Simulator backend sync", e);
    }

    // 2. Animate the scenario's unique trace steps sequentially
    const steps = activeScenario.steps;
    steps.forEach((s, idx) => {
      setTimeout(() => {
        setTraces((prev) => [s, ...prev]);
        if (idx === steps.length - 1) {
          setRunning(false);
        }
      }, (idx + 1) * 230);
    });
  };

  const copyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(activeScenario.payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Page Head */}
        <div className="pagehead flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="eyebrow">HMAC Verified · Real-Time Pipeline Trace</div>
            <h1>Simulator & Webhook Sandbox</h1>
            <p>Dispatch a simulated webhook and watch the extraction pipeline decide in real time.</p>
          </div>

          <button
            onClick={() => setShowPayload(!showPayload)}
            className="btn btn-ghost !text-xs font-mono"
          >
            <Code className="w-3.5 h-3.5 text-[var(--gold)]" />
            <span>{showPayload ? "Hide JSON Payload" : "Inspect JSON Payload"}</span>
            {showPayload ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* JSON Payload Inspector Collapsible */}
        {showPayload && (
          <div className="panel mb-4 bg-[var(--surface-warm)] text-xs font-mono space-y-2 animate-fadeIn">
            <div className="flex justify-between items-center pb-2 border-b border-[var(--border)]">
              <span className="text-[var(--text-secondary)] font-medium">
                Simulated Request Payload: <strong className="text-[var(--text)]">{activeScenario.title}</strong> ({activeScenario.id})
              </span>
              <button onClick={copyPayload} className="text-[var(--gold)] hover:underline flex items-center gap-1 text-[11px]">
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copied" : "Copy JSON"}</span>
              </button>
            </div>
            <pre className="p-3 bg-white border border-[var(--border)] rounded-lg overflow-x-auto text-[11px] text-[var(--text)] font-mono">
              {JSON.stringify(activeScenario.payload, null, 2)}
            </pre>
          </div>
        )}

        {/* Two Columns: Scenario Dispatcher & Pipeline Trace */}
        <div className="cols">
          {/* Column 1: Scenarios */}
          <div className="panel">
            <div className="panel-head">
              <h3>Scenario Dispatcher</h3>
              <span className="meta font-mono">4 Scenarios</span>
            </div>
            <div>
              {scenarios.map((s) => {
                const isSelected = selectedId === s.id;
                const IconComponent = s.icon;
                return (
                  <div
                    key={s.id}
                    className={`radio-row ${isSelected ? "selected" : ""}`}
                    onClick={() => {
                      setSelectedId(s.id);
                      setTraces([]);
                    }}
                  >
                    <div className="rdot" />
                    <div className="rt flex-1">
                      <div className="flex items-center justify-between">
                        <strong className="flex items-center gap-1.5">
                          <IconComponent className={`w-3.5 h-3.5 ${
                            s.id === "clean" ? "text-[var(--sage)]" :
                            s.id === "partial" ? "text-[var(--amber)]" :
                            s.id === "burst" ? "text-[var(--burgundy)]" : "text-[var(--gold)]"
                          }`} />
                          {s.title}
                        </strong>
                      </div>
                      <div>{s.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center", marginTop: "12px" }}
              onClick={triggerScenario}
              disabled={running}
            >
              {running ? (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  Executing Pipeline Trace…
                </span>
              ) : (
                "Trigger Live Webhook Event"
              )}
            </button>
          </div>

          {/* Column 2: Scenario-Specific Execution Trace */}
          <div className="panel">
            <div className="panel-head">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[var(--gold)]" />
                <h3>Pipeline Execution Trace</h3>
              </div>
              {traces.length > 0 ? (
                <span className="meta font-mono text-[var(--sage)]">{traces.length} steps executed</span>
              ) : (
                <span className="meta font-mono">Awaiting Trigger</span>
              )}
            </div>

            {traces.length === 0 ? (
              <div className="empty">
                <div className="glyph">✦</div>
                <p>Trigger <strong>&quot;{activeScenario.title}&quot;</strong> on the left to watch its unique AI decision trace in real time.</p>
                <p className="text-[11px] opacity-75 mt-1">
                  Each scenario executes dedicated HMAC, schema, and routing logic.
                </p>
              </div>
            ) : (
              <div className="feed" style={{ maxHeight: "380px" }}>
                {traces.map((s, i) => {
                  const isPass = s.status === "pass";
                  const isHold = s.status === "hold";
                  const isAlert = s.status === "alert";

                  const badgeClass = isPass
                    ? "bg-[var(--sage-soft)] text-[var(--sage)] border-[var(--sage)]/25"
                    : isHold
                    ? "bg-[var(--amber-soft)] text-[var(--amber)] border-[var(--amber)]/25"
                    : isAlert
                    ? "bg-[var(--burgundy-soft)] text-[var(--burgundy)] border-[var(--burgundy)]/25"
                    : "bg-[var(--gold-soft)] text-[var(--gold)] border-[var(--gold)]/25";

                  return (
                    <div key={i} className="trace-step" style={{ animation: "fadeIn .25s ease" }}>
                      <span className="trace-time font-mono">{s.t}</span>
                      <span className="trace-msg text-[12px]">{s.msg}</span>
                      <span className={`trace-badge text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border ${badgeClass}`}>
                        {s.badge}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="foot">
        <span>razor·ez — autonomous risk & dispute defense</span>
        <span>palette: cream · beige · taupe · espresso · gold</span>
      </footer>
    </div>
  );
}
