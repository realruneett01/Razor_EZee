"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Code, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";

interface Scenario {
  id: string;
  title: string;
  desc: string;
  payload: any;
}

interface TraceStep {
  t: string;
  msg: string;
  pass: boolean;
}

export default function SimulatorPage() {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [running, setRunning] = useState<boolean>(false);
  const [traces, setTraces] = useState<TraceStep[]>([]);
  const [showPayload, setShowPayload] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const scenarios: Scenario[] = [
    {
      id: "clean",
      title: "Clean dispute — auto-submit",
      desc: "Full AWB, verified POD, chat admission (score 1.00)",
      payload: {
        event: "payment.dispute.created",
        payload: {
          dispute: {
            id: "disp_sim_1001",
            payment_id: "pay_sample_test_001",
            order_id: "order_sample_test_001",
            amount: 499900,
            reason_code: "goods_not_received",
            created_at: Math.floor(Date.now() / 1000),
          },
        },
      },
    },
    {
      id: "partial",
      title: "Partial dispute — draft for review",
      desc: "Missing chat admission, holds in draft mode (score 0.75)",
      payload: {
        event: "payment.dispute.created",
        payload: {
          dispute: {
            id: "disp_sim_partial_2002",
            payment_id: "pay_sample_partial_002",
            order_id: "order_sample_partial_002",
            amount: 249900,
            reason_code: "unauthorized_transaction",
            created_at: Math.floor(Date.now() / 1000),
          },
        },
      },
    },
    {
      id: "burst",
      title: "Bot card-testing micro burst",
      desc: "₹2.00 micro-transaction triggers step-up OTP",
      payload: {
        event: "payment.failed",
        payload: {
          payment: {
            id: "pay_failed_micro_3003",
            amount: 200,
            notes: {
              ip_address: "198.51.100.99",
              bin_number: "400012",
            },
          },
        },
      },
    },
    {
      id: "turnover",
      title: "Normal order paid event",
      desc: "Syncs turnover for the 30-day dispute denominator",
      payload: {
        event: "order.paid",
        payload: {
          order: {
            id: "order_paid_4004",
            amount: 150000,
            status: "paid",
          },
        },
      },
    },
  ];

  const triggerScenario = () => {
    setRunning(true);
    setTraces([]);

    const sel = scenarios[selectedIdx];
    const score = sel.title.includes("auto-submit")
      ? "1.00"
      : sel.title.includes("draft")
      ? "0.75"
      : "0.42";
    const result = sel.title.includes("auto-submit")
      ? "Auto-submitted to Razorpay with action='submit'"
      : sel.title.includes("draft")
      ? "Held in draft review queue (refused auto-submit to prevent penalty)"
      : sel.title.includes("burst")
      ? "Step-up OTP friction challenge dispatched"
      : "Order turnover synced to 30-day denominator";

    const ok = sel.title.includes("auto-submit") || sel.title.includes("turnover");

    const steps = [
      { t: "00:00:00.012", msg: "Webhook received · HMAC-SHA256 signature verified", pass: true },
      { t: "00:00:00.045", msg: "Payload normalized · dispute schema validated", pass: true },
      { t: "00:00:00.128", msg: "Evidence packet assembled · BlueDart AWB + POD signature + WhatsApp chat", pass: true },
      { t: "00:00:00.312", msg: `Honesty Safety Gate confidence score computed · ${score}`, pass: ok },
      { t: "00:00:00.589", msg: result, pass: ok },
    ];

    steps.forEach((s, idx) => {
      setTimeout(() => {
        setTraces((prev) => [s, ...prev]);
        if (idx === steps.length - 1) {
          setRunning(false);
        }
      }, (idx + 1) * 200);
    });
  };

  const copyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(scenarios[selectedIdx].payload, null, 2));
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
            <Code className="w-3.5 h-3.5" />
            <span>{showPayload ? "Hide JSON Payload" : "Inspect JSON Payload"}</span>
            {showPayload ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* JSON Payload Inspector Collapsible */}
        {showPayload && (
          <div className="panel mb-4 bg-[var(--surface-warm)] text-xs font-mono space-y-2">
            <div className="flex justify-between items-center pb-2 border-b border-[var(--border)]">
              <span className="text-[var(--text-secondary)]">Simulated Request Payload ({scenarios[selectedIdx].id})</span>
              <button onClick={copyPayload} className="text-[var(--gold)] hover:underline flex items-center gap-1 text-[11px]">
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copied" : "Copy JSON"}</span>
              </button>
            </div>
            <pre className="p-3 bg-white border border-[var(--border)] rounded-lg overflow-x-auto text-[11px] text-[var(--text)]">
              {JSON.stringify(scenarios[selectedIdx].payload, null, 2)}
            </pre>
          </div>
        )}

        {/* Two Columns: Scenario Dispatcher & Pipeline Trace */}
        <div className="cols">
          {/* Column 1: Scenarios */}
          <div className="panel">
            <div className="panel-head">
              <h3>Scenario Dispatcher</h3>
            </div>
            <div>
              {scenarios.map((s, i) => {
                const isSelected = selectedIdx === i;
                return (
                  <div
                    key={s.id}
                    className={`radio-row ${isSelected ? "selected" : ""}`}
                    onClick={() => setSelectedIdx(i)}
                  >
                    <div className="rdot" />
                    <div className="rt">
                      <strong>{s.title}</strong>
                      <div>{s.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center", marginTop: "10px" }}
              onClick={triggerScenario}
              disabled={running}
            >
              {running ? "Executing Pipeline…" : "Trigger Live Webhook Event"}
            </button>
          </div>

          {/* Column 2: Execution Trace */}
          <div className="panel">
            <div className="panel-head">
              <h3>Pipeline Execution Trace</h3>
              {traces.length > 0 && <span className="meta">{traces.length} steps complete</span>}
            </div>

            {traces.length === 0 ? (
              <div className="empty">
                <div className="glyph">✦</div>
                <p>Trigger a simulated webhook on the left to watch the AI pipeline trace in real time.</p>
              </div>
            ) : (
              <div className="feed" style={{ maxHeight: "380px" }}>
                {traces.map((s, i) => (
                  <div key={i} className="trace-step" style={{ animation: "fadeIn .25s ease" }}>
                    <span className="trace-time">{s.t}</span>
                    <span className="trace-msg">{s.msg}</span>
                    <span className={`trace-badge badge ${s.pass ? "verified" : "review"}`}>
                      {s.pass ? "Pass" : "Hold"}
                    </span>
                  </div>
                ))}
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
