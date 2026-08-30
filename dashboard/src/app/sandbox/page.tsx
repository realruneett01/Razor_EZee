"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";

interface Scenario {
  id: string;
  title: string;
  desc: string;
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

  const scenarios: Scenario[] = [
    {
      id: "clean",
      title: "Clean dispute — auto-submit",
      desc: "Full AWB, verified POD, chat admission (score 1.00)",
    },
    {
      id: "partial",
      title: "Partial dispute — draft for review",
      desc: "Missing chat admission, holds in draft mode (score 0.75)",
    },
    {
      id: "burst",
      title: "Bot card-testing micro burst",
      desc: "₹2.00 micro-transaction triggers step-up OTP",
    },
    {
      id: "turnover",
      title: "Normal order paid event",
      desc: "Syncs turnover for the 30-day dispute denominator",
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
      ? "Auto-submitted to Razorpay"
      : sel.title.includes("draft")
      ? "Held in draft review queue"
      : sel.title.includes("burst")
      ? "Step-up OTP challenge dispatched"
      : "Order turnover synced";

    const ok = sel.title.includes("auto-submit") || sel.title.includes("turnover");

    const steps = [
      { t: "00:00:00.012", msg: "Webhook received · HMAC verified", pass: true },
      { t: "00:00:00.045", msg: "Payload normalized · dispute schema validated", pass: true },
      { t: "00:00:00.128", msg: "Evidence packet assembled · AWB + POD + chat", pass: true },
      { t: "00:00:00.312", msg: `Confidence score computed · ${score}`, pass: ok },
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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Page Head */}
        <div className="pagehead">
          <div className="eyebrow">HMAC Verified · Real-Time Pipeline Trace</div>
          <h1>Simulator</h1>
          <p>Dispatch a simulated webhook and watch the extraction pipeline decide in real time.</p>
        </div>

        {/* Two Columns: Scenario Dispatcher & Pipeline Trace */}
        <div className="cols">
          {/* Column 1: Scenarios */}
          <div className="panel">
            <div className="panel-head">
              <h3>Scenario dispatcher</h3>
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
              {running ? "Simulating Pipeline…" : "Trigger live webhook event"}
            </button>
          </div>

          {/* Column 2: Execution Trace */}
          <div className="panel">
            <div className="panel-head">
              <h3>Pipeline execution trace</h3>
              {traces.length > 0 && <span className="meta">{traces.length} steps</span>}
            </div>

            {traces.length === 0 ? (
              <div className="empty">
                <div className="glyph">✦</div>
                <p>Trigger a simulated webhook to watch the AI pipeline trace in real time.</p>
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
