"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { useDemo } from "@/context/DemoContext";

interface CarrierRate {
  id: string;
  carrier_name: string;
  win_rate_pct: number;
  total_disputes: number;
  notes: string;
}

interface ReasonItem {
  code: string;
  label: string;
  count: number;
  pct: number;
  color: string;
}

interface AnalyticsSummary {
  merchant_id?: string;
  capital_recovered_inr: number;
  arbitration_penalties_avoided_inr: number;
  penalties_avoided_count: number;
  dispute_ratio_percentage: number;
  dispute_ratio_status: "safe" | "watch" | "danger";
  total_disputes_30d: number;
  total_orders_30d: number;
  velocity_blocks_count: number;
  trajectory: {
    safe_pct: number;
    watch_pct: number;
    danger_pct: number;
  };
  carrier_win_rates: CarrierRate[];
  reason_breakdown: ReasonItem[];
  last_synced_at?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

export default function AnalyticsPage() {
  const { effectiveMerchantId, merchantMode } = useDemo();

  const [data, setData] = useState<AnalyticsSummary>({
    capital_recovered_inr: 36100,
    arbitration_penalties_avoided_inr: 2500,
    penalties_avoided_count: 1,
    dispute_ratio_percentage: 0.25,
    dispute_ratio_status: "safe",
    total_disputes_30d: 7,
    total_orders_30d: 140,
    velocity_blocks_count: 52,
    trajectory: { safe_pct: 46, watch_pct: 24, danger_pct: 12 },
    carrier_win_rates: [
      { id: "bluedart", carrier_name: "BlueDart Express", win_rate_pct: 92.8, total_disputes: 3, notes: "High-resolution digital signature pads give strong POD verification." },
      { id: "delhivery", carrier_name: "Delhivery Logistics", win_rate_pct: 90.9, total_disputes: 3, notes: "Automated OTP delivery confirmation offers unassailable courier proof." },
      { id: "shadowfax", carrier_name: "Shadowfax", win_rate_pct: 83.3, total_disputes: 1, notes: "Hyperlocal geo-coordinates provide strong non-repudiation backing." },
    ],
    reason_breakdown: [
      { code: "goods_not_received", label: "Goods not received", count: 4, pct: 57.1, color: "var(--gold)" },
      { code: "unauthorized_transaction", label: "Unauthorized transaction", count: 2, pct: 28.6, color: "var(--taupe)" },
      { code: "duplicate_charge", label: "Duplicate charge", count: 1, pct: 14.3, color: "var(--amber)" },
      { code: "service_not_provided", label: "Service not provided", count: 0, pct: 0.0, color: "var(--rose)" },
    ],
  });

  const [loading, setLoading] = useState<boolean>(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const merchantQuery = effectiveMerchantId ? `?merchant_id=${encodeURIComponent(effectiveMerchantId)}` : "";
      const res = await fetch(`${API_BASE_URL}/analytics/summary${merchantQuery}`, {
        headers: {
          "X-Merchant-Id": effectiveMerchantId,
        },
      });
      if (res.ok) {
        const json: AnalyticsSummary = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to fetch analytics summary", err);
    } finally {
      setLoading(false);
    }
  }, [effectiveMerchantId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const formatINR = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onRefresh={fetchAnalytics} isRefreshing={loading} />

      <main className="flex-1">
        {/* Page Head */}
        <div className="pagehead">
          <div className="eyebrow">30-Day Trajectory · Carrier Reliability</div>
          <h1>Risk Analytics</h1>
          <p>Statutory net financial impact and loss-prevention scorecard computed from database ledgers.</p>
        </div>

        {/* Global Active Account Scoping Ribbon */}
        <div className="mb-4 flex items-center justify-between px-3 py-1.5 rounded-lg bg-[var(--surface-warm)] border border-[var(--border)] text-[11px] font-mono text-[var(--text-secondary)]">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${merchantMode === "custom" ? "bg-[var(--sage)]" : "bg-[var(--gold)]"}`} />
            <span>
              Active Ledger Scope: <strong>{merchantMode === "custom" ? "Live Custom Merchant Account" : "Deterministic Demo Sandbox"}</strong>
            </span>
            <span className="opacity-60">({effectiveMerchantId})</span>
          </div>

          {data.last_synced_at && (
            <span>
              Synced: {new Date(data.last_synced_at).toLocaleTimeString("en-IN")}
            </span>
          )}
        </div>

        {/* 4 Stat Cards */}
        <div className="stat-row">
          {/* Card 1: Capital Recovered */}
          <div className="stat">
            <div className="stat-label">Net financial value generated</div>
            <div className="stat-num">{formatINR(data.capital_recovered_inr)}</div>
            <div className="stat-delta up">↗ Capital recovered</div>
          </div>

          {/* Card 2: Penalties Avoided */}
          <div className="stat">
            <div className="stat-label">Arbitration penalties avoided</div>
            <div className="stat-num">{formatINR(data.arbitration_penalties_avoided_inr)}</div>
            <div className="stat-delta up">Protected by refusing weak auto-submits</div>
          </div>

          {/* Card 3: Settlement Risk */}
          <div className="stat">
            <div className="stat-label">Acquiring bank settlement risk</div>
            <div
              className="stat-num font-mono"
              style={{
                color:
                  data.dispute_ratio_percentage < 0.30
                    ? "var(--sage)"
                    : data.dispute_ratio_percentage < 0.45
                    ? "var(--amber)"
                    : "var(--rose)",
              }}
            >
              {data.dispute_ratio_percentage.toFixed(2)}%
            </div>
            <div className="stat-delta up">
              {data.dispute_ratio_percentage < 0.45 ? "Below 0.45% freeze cap" : "Pre-freeze threshold breach"}
            </div>
          </div>

          {/* Card 4: Velocity Blocks */}
          <div className="stat">
            <div className="stat-label">Velocity shield blocks</div>
            <div className="stat-num font-mono">{data.velocity_blocks_count.toLocaleString("en-IN")}</div>
            <div className="stat-delta up">-64% burst volume</div>
          </div>
        </div>

        {/* Two Columns: 30-day rolling trajectory & Dispute reason breakdown */}
        <div className="cols">
          {/* Column 1: Trajectory */}
          <div className="panel">
            <div className="panel-head">
              <h3>30-day rolling trajectory</h3>
              <span className="meta font-mono">{data.dispute_ratio_percentage.toFixed(2)}%</span>
            </div>
            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px", color: "var(--text-secondary)" }}>
                <span>Safe zone (&lt;0.30%)</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>normal ops</span>
              </div>
              <div style={{ height: "5px", borderRadius: "3px", background: "rgba(41,28,14,0.06)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.max(8, data.trajectory.safe_pct || 46)}%`, background: "var(--sage)", opacity: 0.7, borderRadius: "3px" }} />
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px", color: "var(--text-secondary)" }}>
                <span>Watchlist (0.30–0.45%)</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>step-up auth</span>
              </div>
              <div style={{ height: "5px", borderRadius: "3px", background: "rgba(41,28,14,0.06)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.max(4, data.trajectory.watch_pct || 24)}%`, background: "var(--amber)", opacity: 0.6, borderRadius: "3px" }} />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px", color: "var(--text-secondary)" }}>
                <span>Danger cap (≥0.45%)</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>settlement freeze</span>
              </div>
              <div style={{ height: "5px", borderRadius: "3px", background: "rgba(41,28,14,0.06)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.max(2, data.trajectory.danger_pct || 12)}%`, background: "var(--rose)", opacity: 0.5, borderRadius: "3px" }} />
              </div>
            </div>
          </div>

          {/* Column 2: Dispute reason breakdown */}
          <div className="panel">
            <div className="panel-head">
              <h3>Dispute reason breakdown</h3>
              <span className="meta">100% normalized</span>
            </div>
            <div>
              {data.reason_breakdown.map((r) => (
                <div key={r.label} className="reason-row">
                  <div className="reason-dot" style={{ background: r.color }} />
                  <div className="reason-lbl">{r.label}</div>
                  <div className="reason-bg">
                    <span style={{ width: `${r.pct}%`, background: r.color }} />
                  </div>
                  <div className="reason-pct font-mono">{r.pct}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Logistics carrier win-rate index */}
        <div className="panel" style={{ marginTop: "16px" }}>
          <div className="panel-head">
            <h3>Logistics carrier win-rate index</h3>
            <span className="meta font-mono">Carrier Attribution</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px", marginTop: "4px" }}>
            {data.carrier_win_rates.map((c) => (
              <div
                key={c.id}
                style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "18px 20px", background: "var(--surface-warm)" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <b style={{ fontSize: "13.5px", color: "var(--text)", fontWeight: 500 }}>{c.carrier_name}</b>
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: "11px",
                      color: c.win_rate_pct >= 90 ? "var(--sage)" : "var(--amber)",
                      background: c.win_rate_pct >= 90 ? "var(--sage-soft)" : "var(--amber-soft)",
                      padding: "3px 9px",
                      borderRadius: "20px",
                    }}
                  >
                    {c.win_rate_pct.toFixed(1)}%
                  </span>
                </div>
                <p style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "10px", lineHeight: 1.5 }}>
                  {c.notes}
                </p>
              </div>
            ))}
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
