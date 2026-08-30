"use client";

import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";

export default function AnalyticsPage() {
  const reasons = [
    { label: "Goods not received", pct: 64, color: "var(--gold)" },
    { label: "Unauthorized transaction", pct: 22, color: "var(--taupe)" },
    { label: "Duplicate charge", pct: 8, color: "var(--amber)" },
    { label: "Service not provided", pct: 6, color: "var(--rose)" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Page Head */}
        <div className="pagehead">
          <div className="eyebrow">30-Day Trajectory · Carrier Reliability</div>
          <h1>Risk Analytics</h1>
          <p>Statutory net financial impact and loss-prevention scorecard.</p>
        </div>

        {/* 4 Stat Cards */}
        <div className="stat-row">
          <div className="stat">
            <div className="stat-label">Net financial value generated</div>
            <div className="stat-num">₹2,49,950</div>
            <div className="stat-delta up">↗ Capital recovered</div>
          </div>

          <div className="stat">
            <div className="stat-label">Arbitration penalties avoided</div>
            <div className="stat-num">₹25,000</div>
            <div className="stat-delta up">Protected by refusing weak auto-submits</div>
          </div>

          <div className="stat">
            <div className="stat-label">Acquiring bank settlement risk</div>
            <div className="stat-num" style={{ color: "var(--sage)" }}>0.00%</div>
            <div className="stat-delta up">Below 0.45% cap</div>
          </div>

          <div className="stat">
            <div className="stat-label">Velocity shield blocks</div>
            <div className="stat-num">1,247</div>
            <div className="stat-delta up">-64% burst volume</div>
          </div>
        </div>

        {/* Two Columns: 30-day rolling trajectory & Dispute reason breakdown */}
        <div className="cols">
          {/* Column 1: Trajectory */}
          <div className="panel">
            <div className="panel-head">
              <h3>30-day rolling trajectory</h3>
              <span className="meta">0.00%</span>
            </div>
            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px", color: "var(--text-secondary)" }}>
                <span>Safe zone (&lt;0.30%)</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>normal ops</span>
              </div>
              <div style={{ height: "5px", borderRadius: "3px", background: "rgba(41,28,14,0.06)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: "46%", background: "var(--sage)", opacity: 0.55, borderRadius: "3px" }} />
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px", color: "var(--text-secondary)" }}>
                <span>Watchlist (0.30–0.45%)</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>step-up auth</span>
              </div>
              <div style={{ height: "5px", borderRadius: "3px", background: "rgba(41,28,14,0.06)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: "24%", background: "var(--amber)", opacity: 0.5, borderRadius: "3px" }} />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px", color: "var(--text-secondary)" }}>
                <span>Danger cap (≥0.45%)</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>settlement freeze</span>
              </div>
              <div style={{ height: "5px", borderRadius: "3px", background: "rgba(41,28,14,0.06)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: "12%", background: "var(--rose)", opacity: 0.4, borderRadius: "3px" }} />
              </div>
            </div>
          </div>

          {/* Column 2: Dispute reason breakdown */}
          <div className="panel">
            <div className="panel-head">
              <h3>Dispute reason breakdown</h3>
            </div>
            <div>
              {reasons.map((r) => (
                <div key={r.label} className="reason-row">
                  <div className="reason-dot" style={{ background: r.color }} />
                  <div className="reason-lbl">{r.label}</div>
                  <div className="reason-bg">
                    <span style={{ width: `${r.pct}%`, background: r.color }} />
                  </div>
                  <div className="reason-pct">{r.pct}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Logistics carrier win-rate index */}
        <div className="panel" style={{ marginTop: "16px" }}>
          <div className="panel-head">
            <h3>Logistics carrier win-rate index</h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px", marginTop: "4px" }}>
            <div style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "18px 20px", background: "var(--surface-warm)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <b style={{ fontSize: "13.5px", color: "var(--text)", fontWeight: 500 }}>BlueDart Express</b>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: "var(--sage)", background: "var(--sage-soft)", padding: "3px 9px", borderRadius: "20px" }}>
                  98.4%
                </span>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "10px", lineHeight: 1.5 }}>
                High-resolution digital signature pads give strong POD verification.
              </p>
            </div>

            <div style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "18px 20px", background: "var(--surface-warm)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <b style={{ fontSize: "13.5px", color: "var(--text)", fontWeight: 500 }}>Delhivery Logistics</b>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: "var(--sage)", background: "var(--sage-soft)", padding: "3px 9px", borderRadius: "20px" }}>
                  96.1%
                </span>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "10px", lineHeight: 1.5 }}>
                Automated OTP delivery confirmation offers unassailable courier proof.
              </p>
            </div>

            <div style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "18px 20px", background: "var(--surface-warm)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <b style={{ fontSize: "13.5px", color: "var(--text)", fontWeight: 500 }}>Shadowfax</b>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: "var(--sage)", background: "var(--sage-soft)", padding: "3px 9px", borderRadius: "20px" }}>
                  92.8%
                </span>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "10px", lineHeight: 1.5 }}>
                Hyperlocal geo-coordinates provide strong non-repudiation backing.
              </p>
            </div>
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
