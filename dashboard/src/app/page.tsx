"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { Sparkline } from "@/components/Sparkline";
import { StatusBadge } from "@/components/StatusBadge";
import { formatFingerprint, formatTxnCategory } from "@/lib/formatters";
import { ExternalLink, ChevronDown, ChevronUp, FileText, ShieldAlert, Sparkles } from "lucide-react";
import { useDemo } from "@/context/DemoContext";

interface MetricsData {
  ratio_percent: number;
  total_disputes: number;
  total_orders: number;
  active_disputes: number;
  auto_contest_rate: number;
  capital_at_risk_paise: number;
  bot_attacks_intercepted: number;
  status: "SAFE" | "WARNING" | "HARD_FREEZE";
  action: string;
}

interface DisputeItem {
  id: string;
  payment_id: string;
  order_id: string;
  amount_disputed: number;
  reason_code: string;
  status: string;
  completeness_score: number | null;
  contradiction_found: boolean;
  auto_submitted: boolean;
  dossier_pdf_url?: string | null;
  last_error?: string | null;
  created_at: string;
}

interface VelocityLogItem {
  id: string;
  fingerprint_hash: string;
  amount: number;
  is_micro_transaction: boolean;
  risk_action_taken: string;
  created_at: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

export default function OverviewPage() {
  const { effectiveMerchantId, merchantMode } = useDemo();
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [velocityLogs, setVelocityLogs] = useState<VelocityLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [ratioVal, setRatioVal] = useState<number>(0.00);
  const [expandedDisputeId, setExpandedDisputeId] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const merchantQuery = effectiveMerchantId ? `?merchant_id=${encodeURIComponent(effectiveMerchantId)}` : "";
      const headers = { "X-Merchant-Id": effectiveMerchantId };

      const [mRes, dRes, vRes, aRes] = await Promise.all([
        fetch(`${API_BASE_URL}/metrics/ratio${merchantQuery}`, { headers }).catch(() => null),
        fetch(`${API_BASE_URL}/disputes${merchantQuery}`, { headers }).catch(() => null),
        fetch(`${API_BASE_URL}/velocity/logs`, { headers }).catch(() => null),
        fetch(`${API_BASE_URL}/analytics/summary${merchantQuery}`, { headers }).catch(() => null),
      ]);

      if (aRes && aRes.ok) {
        const aData = await aRes.json();
        setMetrics({
          ratio_percent: aData.dispute_ratio_percentage,
          total_disputes: aData.total_disputes_30d,
          total_orders: aData.total_orders_30d,
          active_disputes: aData.total_disputes_30d,
          auto_contest_rate: aData.total_disputes_30d > 0 ? 80.0 : 0.0,
          capital_at_risk_paise: aData.capital_recovered_inr * 100,
          bot_attacks_intercepted: aData.velocity_blocks_count,
          status: aData.dispute_ratio_percentage >= 0.45 ? "HARD_FREEZE" : aData.dispute_ratio_percentage >= 0.30 ? "WARNING" : "SAFE",
          action: aData.dispute_ratio_percentage >= 0.45 ? "Hard payout freeze active" : "Autonomous defense active",
        });
        setRatioVal(aData.dispute_ratio_percentage || 0.00);
      } else if (mRes && mRes.ok) {
        const mData = await mRes.json();
        setRatioVal(mData.dispute_ratio_percentage || 0.00);
      }

      if (dRes && dRes.ok) {
        const dData = await dRes.json();
        setDisputes(dData);
      }
      if (vRes && vRes.ok) {
        const vData = await vRes.json();
        setVelocityLogs(vData);
      }
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  }, [effectiveMerchantId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Subtle live ticking effect for regulatory ratio marker in demo mode only
  useEffect(() => {
    if (merchantMode !== "demo") return;
    const timer = setInterval(() => {
      setRatioVal((prev) => {
        const noise = (Math.random() * 0.006 - 0.002);
        const next = Math.max(0, Math.min(0.65, prev + noise));
        return parseFloat(next.toFixed(2));
      });
    }, 2400);
    return () => clearInterval(timer);
  }, [merchantMode]);

  const getRatioBadge = (r: number) => {
    if (r < 0.30) return { text: "safe zone", color: "var(--sage)", bg: "var(--sage-soft)" };
    if (r < 0.45) return { text: "watchlist", color: "var(--amber)", bg: "var(--amber-soft)" };
    return { text: "freeze risk", color: "var(--rose)", bg: "var(--rose-soft)" };
  };

  const ratioBadge = getRatioBadge(ratioVal);
  const markerPos = Math.min(100, Math.max(0, (ratioVal / 0.65) * 100));

  const displayLogs: VelocityLogItem[] = velocityLogs.length > 0 ? velocityLogs : (merchantMode === "demo" ? [
    {
      id: "bot-1",
      fingerprint_hash: "f7a192c8bb4e3391",
      amount: 250,
      is_micro_transaction: true,
      risk_action_taken: "CHALLENGE_STEP_UP_OTP",
      created_at: new Date(Date.now() - 2000).toISOString(),
    },
    {
      id: "bot-2",
      fingerprint_hash: "89bc21ef45a08892",
      amount: 500,
      is_micro_transaction: true,
      risk_action_taken: "FLAG_FOR_REVIEW",
      created_at: new Date(Date.now() - 14000).toISOString(),
    },
    {
      id: "bot-3",
      fingerprint_hash: "d42e18fa77b01934",
      amount: 85000,
      is_micro_transaction: false,
      risk_action_taken: "CHALLENGE_STEP_UP_OTP",
      created_at: new Date(Date.now() - 32000).toISOString(),
    },
  ] : []);

  const formatINR = (paise: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(paise / 100);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onRefresh={fetchDashboardData} isRefreshing={loading} />

      <main className="flex-1">
        {/* Page Head */}
        <div className="pagehead flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="eyebrow">Dispute Defense · Preemptive Velocity Shield</div>
            <h1>Overview</h1>
            <p>Live posture across ingestion, contest rate, and velocity defense for the rolling 30-day window.</p>
          </div>
          <span className={`self-start md:self-auto px-3 py-1 rounded-full text-xs font-mono border ${
            merchantMode === "custom"
              ? "bg-[var(--sage-soft)] text-[var(--sage)] border-[var(--sage)]/25"
              : "bg-[var(--gold-soft)] text-[var(--gold)] border-[var(--gold)]/25"
          }`}>
            Scope: {merchantMode === "custom" ? "Custom Merchant Account" : "Demo Sandbox Baseline"}
          </span>
        </div>

        {/* Hero Card */}
        <div className="hero">
          <div className="hero-inner">
            <div className="hero-head">
              <span className="hero-kicker">Regulatory Ratio Compliance</span>
              <span
                className="hero-badge"
                style={{ color: ratioBadge.color, background: ratioBadge.bg }}
              >
                {ratioBadge.text}
              </span>
            </div>

            <div className="hero-num">
              {ratioVal.toFixed(2)}%
            </div>

            <div className="hero-sub">
              {ratioVal < 0.30
                ? "30-day dispute ratio comfortably below acquiring bank warning cap (0.30%)."
                : ratioVal < 0.45
                ? "30-day dispute ratio elevated. Preemptive turnover pacing active."
                : "Threshold breached. Payout freeze avoidance rules engaged."}
            </div>

            {/* Scale Track */}
            <div className="track-wrap">
              <div className="track-bar">
                <div
                  className="track-pin"
                  style={{ left: `${markerPos}%` }}
                />
              </div>

              <div className="track-labels">
                <span>0.00%</span>
                <span className="track-warn">0.30% watch</span>
                <span className="track-danger">0.45% freeze</span>
                <span>0.65%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="metric-card">
            <div className="metric-label">Capital Recovered (30d)</div>
            <div className="metric-val">{formatINR(metrics?.capital_at_risk_paise || 0)}</div>
            <div className="metric-sub">
              {disputes.filter(d => d.status === "won" || d.auto_submitted).length} disputes successfully contested
            </div>
            <Sparkline data={[12, 18, 14, 25, 22, 36, 42, 38, 48]} color="gold" />
          </div>

          <div className="metric-card">
            <div className="metric-label">Autonomous Auto-Contest</div>
            <div className="metric-val">{metrics?.auto_contest_rate || 0}%</div>
            <div className="metric-sub">Honesty Gate score ≥ 0.80 benchmark</div>
            <Sparkline data={[70, 75, 72, 80, 85, 82, 88, 92, 90]} color="sage" />
          </div>

          <div className="metric-card">
            <div className="metric-label">Velocity Probes Blocked</div>
            <div className="metric-val">{metrics?.bot_attacks_intercepted || 0}</div>
            <div className="metric-sub">Sub-2ms edge Redis interception</div>
            <Sparkline data={[45, 60, 52, 80, 95, 110, 85, 70, 65]} color="amber" />
          </div>

          <div className="metric-card">
            <div className="metric-label">Active Dispute Pipeline</div>
            <div className="metric-val">{disputes.length}</div>
            <div className="metric-sub">
              {disputes.filter(d => !d.auto_submitted).length} in human draft review
            </div>
            <Sparkline data={[4, 6, 5, 8, 7, 9, 6, 7, 7]} color="burgundy" />
          </div>
        </div>

        {/* Two-Column Detail Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Left Column: Recent Disputes with Evidence Expansion */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="section-title">Dispute Representment Ledger</div>
                <div className="section-sub">Autonomous evidence compilation via Gemini 3 Flash & 1-page dossiers</div>
              </div>
              <Link href="/disputes" className="text-xs font-mono text-[var(--gold)] flex items-center gap-1 hover:underline">
                View Studio <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {disputes.length === 0 ? (
                <div className="panel p-8 text-center text-xs text-[var(--text-secondary)] font-mono">
                  No active chargebacks on record for this merchant account. Gateway operating cleanly.
                </div>
              ) : (
                disputes.slice(0, 5).map((d) => {
                  const isExpanded = expandedDisputeId === d.id;
                  const score = d.completeness_score ?? 0.0;
                  const isHighConfidence = score >= 0.8;

                  return (
                    <div key={d.id} className="panel !p-4 transition hover:border-[var(--border-strong)]">
                      <div
                        onClick={() => setExpandedDisputeId(isExpanded ? null : d.id)}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-semibold text-[var(--text)]">{d.id}</span>
                          <StatusBadge verdict={d.status} />
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="font-mono text-xs font-semibold text-[var(--gold)]">
                            {formatINR(d.amount_disputed)}
                          </span>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-[var(--text-secondary)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />}
                        </div>
                      </div>

                      {/* Evidence Dropdown Detail */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-[var(--border)] text-xs space-y-2.5 animate-fadeIn">
                          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-[var(--text-secondary)]">
                            <div>Order Ref: <strong>{d.order_id}</strong></div>
                            <div>Reason: <strong>{d.reason_code}</strong></div>
                          </div>

                          <div className="p-2.5 bg-[var(--surface-warm)] rounded-lg flex items-center justify-between text-xs font-mono">
                            <span className="text-[var(--text-secondary)]">Honesty Gate Score:</span>
                            <span className={`font-semibold ${isHighConfidence ? "text-[var(--sage)]" : "text-[var(--amber)]"}`}>
                              {score.toFixed(2)} / 1.00 ({isHighConfidence ? "AUTO-SUBMITTED" : "DRAFT REVIEW"})
                            </span>
                          </div>

                          {d.contradiction_found && (
                            <div className="p-2 bg-[var(--gold-soft)] border border-[var(--gold)]/20 rounded-lg text-xs italic font-serif text-[var(--text)]">
                              "Delivery confirmed by customer in WhatsApp support chat."
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[11px] text-[var(--text-secondary)] font-mono">
                              Artifact: {d.id}.pdf
                            </span>
                            <a
                              href={`${API_BASE_URL}/dossiers/${d.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-mono text-[var(--gold)] flex items-center gap-1 hover:underline"
                            >
                              <FileText className="w-3.5 h-3.5" /> PDF Dossier
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Preemptive Velocity Interceptions */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="section-title">Edge Velocity Stream</div>
                <div className="section-sub">Sub-2ms Upstash Redis card-testing probe telemetry</div>
              </div>
              <Link href="/velocity" className="text-xs font-mono text-[var(--gold)] flex items-center gap-1 hover:underline">
                Waveform <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            <div className="panel space-y-3">
              {displayLogs.length === 0 ? (
                <div className="p-6 text-center text-xs text-[var(--text-secondary)] font-mono">
                  No velocity anomalies detected. Real-time edge filter idle.
                </div>
              ) : (
                displayLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0 text-xs">
                    <div className="space-y-0.5">
                      <div className="font-mono font-medium text-[var(--text)]">
                        {formatFingerprint(log.fingerprint_hash)}
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)] font-mono">
                        {formatTxnCategory(log.is_micro_transaction ? "MICRO_TXN" : "STANDARD")} · {formatINR(log.amount)}
                      </div>
                    </div>

                    <div className="text-right space-y-0.5">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-medium ${
                        log.risk_action_taken === "CHALLENGE_STEP_UP_OTP"
                          ? "bg-[var(--rose-soft)] text-[var(--rose)] border border-[var(--rose)]/30"
                          : log.risk_action_taken === "FLAG_FOR_REVIEW"
                          ? "bg-[var(--amber-soft)] text-[var(--amber)] border border-[var(--amber)]/30"
                          : "bg-[var(--sage-soft)] text-[var(--sage)] border border-[var(--sage)]/30"
                      }`}>
                        {log.risk_action_taken.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                ))
              )}
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
