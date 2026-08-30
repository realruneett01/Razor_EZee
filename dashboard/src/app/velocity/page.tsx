"use client";

import React, { useEffect, useRef, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { StatusBadge } from "@/components/StatusBadge";
import { formatFingerprint, formatTxnCategory } from "@/lib/formatters";

interface TelemetryEntry {
  id: string;
  tag: string;
  status: string;
  label: string;
  rawAction?: string;
  amount?: number;
  time?: string;
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

export default function VelocityShieldPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const spikeEnergyRef = useRef<number>(0);
  const mouseRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0.5,
    y: 0.5,
    targetX: 0.5,
    targetY: 0.5,
  });

  const [probeCeiling, setProbeCeiling] = useState<number>(10);
  const [windowHorizon, setWindowHorizon] = useState<number>(60);
  const [currentRPS, setCurrentRPS] = useState<number>(14);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [feedData, setFeedData] = useState<TelemetryEntry[]>([
    { id: "a4f8…42ca", tag: "micro-probe · ₹2.50", status: "step", label: "Step-up", rawAction: "OTP_CHALLENGE", time: "Just now" },
    { id: "7bc2…8840", tag: "micro-probe · ₹5.00", status: "review", label: "Flagged", rawAction: "FLAG_REVIEW", time: "14s ago" },
    { id: "c389…72f0", tag: "checkout · ₹850.00", status: "step", label: "Step-up", rawAction: "OTP_CHALLENGE", time: "38s ago" },
    { id: "991e…a455", tag: "checkout · ₹1,450.00", status: "verified", label: "Verified", rawAction: "ALLOW", time: "52s ago" },
    { id: "e2d1…b102", tag: "micro-probe · ₹2.50", status: "step", label: "Step-up", rawAction: "OTP_CHALLENGE", time: "59s ago" },
  ]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/velocity/logs`);
      if (res.ok) {
        const data: VelocityLogItem[] = await res.json();
        if (data && data.length > 0) {
          const mapped: TelemetryEntry[] = data.map((l) => ({
            id: formatFingerprint(l.fingerprint_hash),
            tag: `${formatTxnCategory(l.is_micro_transaction ? "MICRO_TXN" : "STANDARD")} · ₹${(l.amount / 100).toFixed(2)}`,
            status: l.risk_action_taken === "OTP_CHALLENGE" ? "step" : l.risk_action_taken === "FLAG_REVIEW" ? "review" : "verified",
            label: l.risk_action_taken === "OTP_CHALLENGE" ? "Step-up" : l.risk_action_taken === "FLAG_REVIEW" ? "Flagged" : "Verified",
            rawAction: l.risk_action_taken,
            amount: l.amount / 100,
            time: new Date(l.created_at).toLocaleTimeString("en-IN"),
          }));
          setFeedData(mapped);
        }
      }
    } catch (err) {
      console.error("Failed to fetch velocity logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Live RPS fluctuation
  useEffect(() => {
    const rpsTimer = setInterval(() => {
      setCurrentRPS(Math.floor(11 + Math.random() * 8));
    }, 1500);
    return () => clearInterval(rpsTimer);
  }, []);

  // Waveform canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const W = 900;
    const H = 200;
    canvas.width = W;
    canvas.height = H;

    const wavePoints: { base: number; offset: number; phase: number }[] = [];
    for (let i = 0; i < 140; i++) {
      wavePoints.push({
        base: Math.sin(i * 0.12) * 18 + Math.sin(i * 0.04) * 8 + Math.cos(i * 0.07) * 5,
        offset: Math.random() * 5 - 2.5,
        phase: Math.random() * Math.PI * 2,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = "rgba(41,28,14,0.04)";
      ctx.lineWidth = 1;
      for (let y = 25; y < H; y += 28) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      for (let x = 0; x < W; x += 55) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }

      // Threshold lines
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = "rgba(160,64,64,0.15)";
      ctx.beginPath();
      ctx.moveTo(0, H * 0.32);
      ctx.lineTo(W, H * 0.32);
      ctx.stroke();
      ctx.strokeStyle = "rgba(184,134,11,0.15)";
      ctx.beginPath();
      ctx.moveTo(0, H * 0.50);
      ctx.lineTo(W, H * 0.50);
      ctx.stroke();
      ctx.setLineDash([]);

      // Parallax lerp
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.035;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.035;
      const px = (mouseRef.current.x - 0.5) * 18;
      const py = (mouseRef.current.y - 0.5) * 8;
      const t = Date.now() * 0.001;

      // Glow line
      ctx.beginPath();
      for (let i = 0; i < wavePoints.length; i++) {
        const x = (i / (wavePoints.length - 1)) * W + px;
        const p = wavePoints[i];
        const noise = Math.sin(t + p.phase + i * 0.15) * 3.5;
        const spike = spikeEnergyRef.current * Math.exp(-Math.pow(i - 70, 2) / 180) * 50;
        const y = H / 2 + p.base + p.offset + noise + spike + py;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "rgba(176,125,58,0.15)";
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();

      // Main line
      ctx.beginPath();
      for (let i = 0; i < wavePoints.length; i++) {
        const x = (i / (wavePoints.length - 1)) * W + px;
        const p = wavePoints[i];
        const noise = Math.sin(t + p.phase + i * 0.15) * 3.5;
        const spike = spikeEnergyRef.current * Math.exp(-Math.pow(i - 70, 2) / 180) * 50;
        const y = H / 2 + p.base + p.offset + noise + spike + py;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "#B07D3A";
      ctx.lineWidth = 2.2;
      ctx.shadowColor = "rgba(176,125,58,0.25)";
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Echo line
      ctx.beginPath();
      for (let i = 0; i < wavePoints.length; i++) {
        const x = (i / (wavePoints.length - 1)) * W + px;
        const p = wavePoints[i];
        const noise = Math.sin(t * 0.8 + p.phase * 0.7 + i * 0.12) * 2.5;
        const spike = spikeEnergyRef.current * Math.exp(-Math.pow(i - 70, 2) / 220) * 30;
        const y = H / 2 + p.base * 0.5 + noise + spike * 0.6 + py + 18;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "rgba(176,125,58,0.15)";
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Fill gradient
      ctx.beginPath();
      for (let i = 0; i < wavePoints.length; i++) {
        const x = (i / (wavePoints.length - 1)) * W + px;
        const p = wavePoints[i];
        const noise = Math.sin(t + p.phase + i * 0.15) * 3.5;
        const spike = spikeEnergyRef.current * Math.exp(-Math.pow(i - 70, 2) / 180) * 50;
        const y = H / 2 + p.base + p.offset + noise + spike + py;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.lineTo(W + px, H);
      ctx.lineTo(px, H);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "rgba(176,125,58,0.06)");
      grad.addColorStop(0.6, "rgba(176,125,58,0.02)");
      grad.addColorStop(1, "rgba(176,125,58,0)");
      ctx.fillStyle = grad;
      ctx.fill();

      // Spark particles on spike
      if (spikeEnergyRef.current > 0.3) {
        for (let k = 0; k < 5; k++) {
          const si = 70 + Math.floor((Math.random() - 0.5) * 30);
          if (si >= 0 && si < wavePoints.length) {
            const sx = (si / (wavePoints.length - 1)) * W + px;
            const sy =
              H / 2 +
              wavePoints[si].base +
              wavePoints[si].offset +
              py +
              Math.sin(t + wavePoints[si].phase + si * 0.15) * 3.5 +
              spikeEnergyRef.current * Math.exp(-Math.pow(si - 70, 2) / 180) * 50;
            ctx.beginPath();
            ctx.arc(
              sx + Math.random() * 20 - 10,
              sy + Math.random() * 20 - 10,
              Math.random() * 1.5 + 0.5,
              0,
              Math.PI * 2
            );
            ctx.fillStyle = `rgba(176,125,58,${spikeEnergyRef.current * 0.4})`;
            ctx.fill();
          }
        }
      }

      spikeEnergyRef.current *= 0.93;
      animId = requestAnimationFrame(draw);
    };

    draw();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.targetX = (e.clientX - rect.left) / rect.width;
      mouseRef.current.targetY = (e.clientY - rect.top) / rect.height;
    };
    const handleMouseLeave = () => {
      mouseRef.current.targetX = 0.5;
      mouseRef.current.targetY = 0.5;
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const randId = () => {
    const h = "0123456789abcdef";
    let s = "";
    for (let i = 0; i < 4; i++) s += h[Math.floor(Math.random() * 16)];
    s += "…";
    for (let i = 0; i < 4; i++) s += h[Math.floor(Math.random() * 16)];
    return s;
  };

  const injectAttack = async (type: "sweep" | "burst" | "standard") => {
    setSimulating(true);
    spikeEnergyRef.current = 1;

    if (type === "sweep") {
      // Step through 5 micro-probes sequentially
      for (let i = 1; i <= 5; i++) {
        spikeEnergyRef.current = 0.8 + i * 0.1;
        const action = i >= 5 ? "OTP_CHALLENGE" : i >= 3 ? "FLAG_REVIEW" : "ALLOW";
        const label = i >= 5 ? "Step-up" : i >= 3 ? "Flagged" : "Verified";
        const status = i >= 5 ? "step" : i >= 3 ? "review" : "verified";
        const entry: TelemetryEntry = {
          id: randId(),
          tag: `micro-probe #${i} · ₹2.50`,
          status,
          label,
          rawAction: action,
          time: new Date().toLocaleTimeString("en-IN"),
        };
        setFeedData((prev) => [entry, ...prev.slice(0, 14)]);
        await new Promise((r) => setTimeout(r, 320));
      }
    } else if (type === "burst") {
      // 10x high frequency surge
      for (let i = 1; i <= 10; i++) {
        spikeEnergyRef.current = 1.2;
        const action = i > 7 ? "OTP_CHALLENGE" : i > 4 ? "FLAG_REVIEW" : "ALLOW";
        const label = i > 7 ? "Step-up" : i > 4 ? "Flagged" : "Verified";
        const status = i > 7 ? "step" : i > 4 ? "review" : "verified";
        const entry: TelemetryEntry = {
          id: randId(),
          tag: `velocity surge #${i} · ₹850.00`,
          status,
          label,
          rawAction: action,
          time: new Date().toLocaleTimeString("en-IN"),
        };
        setFeedData((prev) => [entry, ...prev.slice(0, 14)]);
        await new Promise((r) => setTimeout(r, 180));
      }
    } else {
      const entry: TelemetryEntry = {
        id: randId(),
        tag: "regular checkout · ₹1,450.00",
        status: "verified",
        label: "Verified",
        rawAction: "ALLOW",
        time: new Date().toLocaleTimeString("en-IN"),
      };
      setFeedData((prev) => [entry, ...prev.slice(0, 14)]);
    }

    setSimulating(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onRefresh={fetchLogs} isRefreshing={loading} />

      <main className="flex-1">
        {/* Page Head */}
        <div className="pagehead">
          <div className="eyebrow">Redis Sliding Window · Sub-2ms Edge Evaluation</div>
          <h1>Velocity Shield</h1>
          <p>Zero-mutation edge defense against card-testing and velocity bursts.</p>
        </div>

        {/* Waveform Panel with Real-Time RPS Counter */}
        <div className="wave-panel">
          <canvas ref={canvasRef} className="wave-canvas" />
          <div className="wave-overlay">
            <span className="wave-tag">-60s horizon · {currentRPS} req/s</span>
            <span className="wave-tag">sub-2ms live edge</span>
          </div>
          <div className="wave-legend">
            <span>
              <span className="dot" style={{ background: "var(--sage)" }} /> verified
            </span>
            <span>
              <span className="dot" style={{ background: "var(--amber)" }} /> monitored (&gt;12/min)
            </span>
            <span>
              <span className="dot" style={{ background: "var(--burgundy)" }} /> step-up (&gt;18/min)
            </span>
          </div>
        </div>

        {/* Two Columns: Synthetic Attack Simulator & Protection Thresholds */}
        <div className="cols">
          {/* Column 1: Attack Simulator */}
          <div className="panel">
            <div className="panel-head">
              <h3>Synthetic Attack Simulator</h3>
              <span className="meta">{simulating ? "Injecting Attack…" : "Ready"}</span>
            </div>
            <button
              className="action-card"
              onClick={() => injectAttack("sweep")}
              disabled={simulating}
            >
              <div className="action-icon gold">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <div>
                <div className="action-title">Card Sweep</div>
                <div className="action-desc">5× ₹2.50 micro-probes (gates at req 3 & 5)</div>
              </div>
            </button>

            <button
              className="action-card"
              onClick={() => injectAttack("burst")}
              disabled={simulating}
            >
              <div className="action-icon burgundy">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v4m0 12v4m10-10h-4M6 12H2m15.07-7.07l-2.83 2.83M9.76 14.24l-2.83 2.83m11.14 0l-2.83-2.83M9.76 9.76L6.93 6.93" />
                </svg>
              </div>
              <div>
                <div className="action-title">Burst Wave</div>
                <div className="action-desc">10× ₹850.00 velocity surges in 60s window</div>
              </div>
            </button>

            <button
              className="action-card"
              onClick={() => injectAttack("standard")}
              disabled={simulating}
            >
              <div className="action-icon sage">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <div className="action-title">Standard Order</div>
                <div className="action-desc">1× ₹1,450.00 regular checkout</div>
              </div>
            </button>
          </div>

          {/* Column 2: Protection Thresholds */}
          <div className="panel">
            <div className="panel-head">
              <h3>Protection Thresholds</h3>
            </div>
            <div className="slider-block">
              <div className="slider-top">
                <span>Micro-probe sub-threshold ceiling</span>
                <span className="v">₹{probeCeiling}.00</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={probeCeiling}
                onChange={(e) => setProbeCeiling(Number(e.target.value))}
              />
            </div>

            <div className="slider-block" style={{ marginBottom: 0 }}>
              <div className="slider-top">
                <span>Sliding window horizon</span>
                <span className="v">{windowHorizon} sec</span>
              </div>
              <input
                type="range"
                min="15"
                max="120"
                value={windowHorizon}
                onChange={(e) => setWindowHorizon(Number(e.target.value))}
              />
            </div>

            <div
              style={{
                marginTop: "14px",
                padding: "12px 14px",
                borderRadius: "10px",
                background: "rgba(176,125,58,0.04)",
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                <span style={{ color: "var(--gold)" }}>●</span> Read-only edge evaluation. Zero live settlement impact.
              </div>
            </div>
          </div>
        </div>

        {/* Intercepted Telemetry Feed */}
        <div className="panel" style={{ marginTop: "16px" }}>
          <div className="panel-head">
            <h3>Intercepted Telemetry Feed</h3>
            <span className="meta">{feedData.length} recorded</span>
          </div>
          <div className="feed">
            {feedData.map((r, i) => (
              <div key={i} className="feed-row">
                <div className="flex items-center gap-2">
                  <span className="feed-id">{r.id}</span>
                  <span className="feed-tag">{r.tag}</span>
                  {r.time && <span className="feed-amt text-[10px] opacity-60">({r.time})</span>}
                </div>
                <StatusBadge verdict={r.rawAction || r.label} />
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
