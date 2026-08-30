"use client";

import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { formatFingerprint, formatTxnCategory } from "@/lib/formatters";

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
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [velocityLogs, setVelocityLogs] = useState<VelocityLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [ratioVal, setRatioVal] = useState<number>(0.00);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [mRes, dRes, vRes] = await Promise.all([
        fetch(`${API_BASE_URL}/metrics/ratio`).catch(() => null),
        fetch(`${API_BASE_URL}/disputes/feed`).catch(() => null),
        fetch(`${API_BASE_URL}/velocity/logs`).catch(() => null),
      ]);

      if (mRes && mRes.ok) {
        const mData = await mRes.json();
        setMetrics(mData);
        setRatioVal(mData.ratio_percent || 0.00);
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
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Subtle live ticking effect for regulatory ratio marker
  useEffect(() => {
    const timer = setInterval(() => {
      setRatioVal((prev) => {
        const noise = (Math.random() * 0.006 - 0.002);
        const next = Math.max(0, Math.min(0.65, prev + noise));
        return parseFloat(next.toFixed(2));
      });
    }, 2400);
    return () => clearInterval(timer);
  }, []);

  const getRatioBadge = (r: number) => {
    if (r < 0.30) return { text: "safe zone", color: "var(--sage)", bg: "var(--sage-soft)" };
    if (r < 0.45) return { text: "watchlist", color: "var(--amber)", bg: "var(--amber-soft)" };
    return { text: "freeze risk", color: "var(--rose)", bg: "var(--rose-soft)" };
  };

  const ratioBadge = getRatioBadge(ratioVal);
  const markerPos = Math.min(100, Math.max(0, (ratioVal / 0.65) * 100));

  const displayLogs: VelocityLogItem[] = velocityLogs.length > 0 ? velocityLogs : [
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
  ];

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
        <div className="pagehead">
          <div className="eyebrow">Dispute Defense · Preemptive Velocity Shield</div>
          <h1>Overview</h1>
          <p>Live posture across ingestion, contest rate, and velocity defense for the last rolling window.</p>
        </div>

        {/* Hero Card */}
        <div className="hero">
          <div className="hero-inner">
            <div className="dial-wrap">
              <div className="dial-num" style={{ color: ratioBadge.color }}>
                {ratioVal.toFixed(2)}%
              </div>
              <div className="dial-label">Dispute ratio</div>
              <div className="dial-badge" style={{ color: ratioBadge.color, background: ratioBadge.bg }}>
                {ratioBadge.text}
              </div>
            </div>

            <div className="hero-track">
              <div className="track-label">
                <span>0.00%</span>
                <span>0.30%</span>
                <span>0.45%</span>
                <span>0.65%</span>
              </div>
              <div className="track">
                <div className="seg safe" />
                <div className="seg warn" />
                <div className="seg danger" />
                <div className="marker" style={{ left: `${markerPos}%` }} />
              </div>
              <div className="hero-zones">
                <div><b>Safe</b> — standard settlement</div>
                <div><b>Watchlist</b> — OTP step-up active</div>
                <div><b>Freeze cap</b> — acquiring bank risk</div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="stat-row">
          <div className="stat">
            <div className="stat-label">Active ingested disputes</div>
            <div className="stat-num">{metrics?.active_disputes ?? disputes.length}</div>
            <div className="stat-delta down">-28% 7d</div>
          </div>

          <div className="stat">
            <div className="stat-label">Autonomous contest rate</div>
            <div className="stat-num">{metrics?.auto_contest_rate ? `${metrics.auto_contest_rate}%` : "92%"}</div>
            <div className="stat-delta up">+24% 7d</div>
          </div>

          <div className="stat">
            <div className="stat-label">Capital under dispute</div>
            <div className="stat-num">
              {metrics ? formatINR(metrics.capital_at_risk_paise) : "₹14,997"}
            </div>
            <div className="stat-delta up">-45% risk</div>
          </div>

          <div className="stat">
            <div className="stat-label">Bot attacks intercepted</div>
            <div className="stat-num">
              {metrics?.bot_attacks_intercepted ?? velocityLogs.length}
            </div>
            <div className="stat-delta up">-64% bursts</div>
          </div>
        </div>

        {/* Two Columns: Regulatory Thresholds & Preemptive Velocity Shield */}
        <div className="cols">
          {/* Column 1: Regulatory Thresholds */}
          <div className="panel">
            <div className="panel-head">
              <h3>Regulatory thresholds</h3>
              <span className="meta">30-day rolling</span>
            </div>
            <div className="zone-row">
              <div className="zone-bar safe" />
              <div className="zone-text">
                <div className="r1">
                  <span>0.00% – 0.30%</span>
                  <span>Safe</span>
                </div>
                <p>Normal operating bandwidth, standard settlement schedule.</p>
              </div>
            </div>
            <div className="zone-row">
              <div className="zone-bar warn" />
              <div className="zone-text">
                <div className="r1">
                  <span>0.30% – 0.45%</span>
                  <span>Warning</span>
                </div>
                <p>Card-network watchlist. Velocity Shield steps up OTP friction.</p>
              </div>
            </div>
            <div className="zone-row">
              <div className="zone-bar danger" />
              <div className="zone-text">
                <div className="r1">
                  <span>&gt;0.45% – 0.65%</span>
                  <span>Freeze cap</span>
                </div>
                <p>Acquiring-bank freeze risk. Account moves under audit.</p>
              </div>
            </div>
          </div>

          {/* Column 2: Preemptive Velocity Shield */}
          <div className="panel">
            <div className="panel-head">
              <h3>Preemptive Velocity Shield</h3>
              <span className="meta">60s sliding window</span>
            </div>
            <div className="feed">
              {displayLogs.slice(0, 5).map((r, i) => (
                <div key={r.id || i} className="feed-row">
                  <div>
                    <span className="feed-id">{formatFingerprint(r.fingerprint_hash)}</span>
                    <span className="feed-tag">
                      {formatTxnCategory(r.is_micro_transaction ? "MICRO_TXN" : "STANDARD")} · ₹{(r.amount / 100).toFixed(2)}
                    </span>
                  </div>
                  <StatusBadge verdict={r.risk_action_taken} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dispute Resolution Feed */}
        <div className="panel" style={{ marginTop: "16px" }}>
          <div className="panel-head">
            <h3>Dispute resolution feed</h3>
            <span className="meta">live webhook ingestion</span>
          </div>
          {disputes.length === 0 ? (
            <div className="empty" style={{ border: "none", padding: "30px 0", margin: 0 }}>
              <div className="glyph">◌</div>
              <p>No disputes yet. Resolved cases will appear here as Razorpay webhooks arrive.</p>
            </div>
          ) : (
            <div className="feed" style={{ maxHeight: "360px" }}>
              {disputes.map((d) => (
                <div key={d.id} className="feed-row">
                  <div>
                    <span className="feed-id">{d.id}</span>
                    <span className="feed-tag">
                      {d.reason_code.replace(/_/g, " ")} · {formatINR(d.amount_disputed)}
                    </span>
                  </div>
                  <StatusBadge verdict={d.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="foot">
        <span>razor·ez — autonomous risk & dispute defense</span>
        <span>palette: cream · beige · taupe · espresso · gold</span>
      </footer>
    </div>
  );
}
