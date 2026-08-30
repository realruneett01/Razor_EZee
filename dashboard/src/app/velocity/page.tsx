"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { StatusBadge } from "@/components/StatusBadge";
import { formatFingerprint, formatTxnCategory } from "@/lib/formatters";

interface TelemetryResponse {
  is_active: boolean;
  events_in_window: number;
  current_rps: number;
  status: "IDLE" | "VERIFIED" | "MONITORED" | "STEP_UP";
  window_seconds: number;
  timeline_60s: number[];
  recent_logs: any[];
  policy: {
    micro_transaction_threshold: number;
    sliding_window_seconds: number;
    warning_threshold_count: number;
    step_up_threshold_count: number;
  };
  edge_latency_ms: number;
}

interface TelemetryEntry {
  id: string;
  tag: string;
  status: string;
  label: string;
  rawAction: string;
  amount: number;
  time: string;
  isSimulated?: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

export default function VelocityShieldPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const spikeEnergyRef = useRef<number>(0);
  const activityIntensityRef = useRef<number>(0); // Driven strictly by actual RPS / events
  const timelineRef = useRef<number[]>(new Array(60).fill(0));
  const mouseRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0.5,
    y: 0.5,
    targetX: 0.5,
    targetY: 0.5,
  });

  const [probeCeiling, setProbeCeiling] = useState<number>(10);
  const [windowHorizon, setWindowHorizon] = useState<number>(60);
  const [currentRPS, setCurrentRPS] = useState<number>(0.0);
  const [eventsInWindow, setEventsInWindow] = useState<number>(0);
  const [edgeLatency, setEdgeLatency] = useState<number>(1.2);
  const [shieldStatus, setShieldStatus] = useState<string>("IDLE");
  const [simulating, setSimulating] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [feedData, setFeedData] = useState<TelemetryEntry[]>([]);

  // 1. Fetch Real Telemetry from Backend Redis Engine
  const fetchTelemetry = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/velocity/telemetry`);
      if (res.ok) {
        const data: TelemetryResponse = await res.json();
        setCurrentRPS(data.current_rps);
        setEventsInWindow(data.events_in_window);
        setShieldStatus(data.status);
        setEdgeLatency(data.edge_latency_ms);
        timelineRef.current = data.timeline_60s;

        // Drive wave activity strictly from real events
        const maxBucket = Math.max(...data.timeline_60s, 0);
        activityIntensityRef.current = Math.min(1.5, (data.events_in_window * 0.1) + (data.current_rps * 0.4) + (maxBucket * 0.2));

        if (data.policy) {
          setProbeCeiling(data.policy.micro_transaction_threshold);
          setWindowHorizon(data.policy.sliding_window_seconds);
        }
      }
    } catch (err) {
      console.error("Telemetry sync error", err);
    }
  }, []);

  // 2. Fetch Historical & Active Logs
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/velocity/logs`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const mapped: TelemetryEntry[] = data.map((l) => ({
            id: formatFingerprint(l.fingerprint_hash),
            tag: `${formatTxnCategory(l.is_micro_transaction ? "MICRO_TXN" : "STANDARD")} · ₹${((l.amount || 0) / 100).toFixed(2)}`,
            status: l.risk_action_taken === "CHALLENGE_STEP_UP_OTP" ? "step" : l.risk_action_taken === "FLAG_FOR_REVIEW" ? "review" : "verified",
            label: l.risk_action_taken === "CHALLENGE_STEP_UP_OTP" ? "Step-up" : l.risk_action_taken === "FLAG_FOR_REVIEW" ? "Flagged" : "Verified",
            rawAction: l.risk_action_taken,
            amount: (l.amount || 0) / 100,
            time: l.created_at ? new Date(l.created_at).toLocaleTimeString("en-IN") : "Recent",
            isSimulated: l.is_simulated || false,
          }));
          setFeedData(mapped);
        }
      }
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll real telemetry every 1.5s (Zero polling interval artifacts)
  useEffect(() => {
    fetchTelemetry();
    fetchLogs();
    const interval = setInterval(fetchTelemetry, 1500);
    return () => clearInterval(interval);
  }, [fetchTelemetry, fetchLogs]);

  // 3. Dynamic Threshold Slider Updates via POST /api/velocity/policy
  const handlePolicyChange = async (newCeiling?: number, newHorizon?: number) => {
    const updatedCeiling = newCeiling !== undefined ? newCeiling : probeCeiling;
    const updatedHorizon = newHorizon !== undefined ? newHorizon : windowHorizon;

    if (newCeiling !== undefined) setProbeCeiling(newCeiling);
    if (newHorizon !== undefined) setWindowHorizon(newHorizon);

    try {
      await fetch(`${API_BASE_URL}/velocity/policy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          micro_threshold: updatedCeiling,
          window_seconds: updatedHorizon,
        }),
      });
    } catch (err) {
      console.error("Failed to update policy", err);
    }
  };

  // 4. Waveform Canvas Renderer (With True Zero-State / Flatline Handling)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = (rect.height || 200) * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const numPoints = 120;
    const startTime = Date.now();

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const W = rect.width || 900;
      const H = rect.height || 200;

      ctx.clearRect(0, 0, W, H);

      // Grid background lines
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

      // Threshold reference lines
      ctx.setLineDash([3, 4]);
      // Step-Up Danger Line (>18/min)
      ctx.strokeStyle = "rgba(160,64,64,0.22)";
      ctx.beginPath();
      ctx.moveTo(0, H * 0.28);
      ctx.lineTo(W, H * 0.28);
      ctx.stroke();

      // Warning Monitored Line (>12/min)
      ctx.strokeStyle = "rgba(184,134,11,0.22)";
      ctx.beginPath();
      ctx.moveTo(0, H * 0.48);
      ctx.lineTo(W, H * 0.48);
      ctx.stroke();
      ctx.setLineDash([]);

      // Parallax lerp
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.04;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.04;
      const px = (mouseRef.current.x - 0.5) * 14;
      const py = (mouseRef.current.y - 0.5) * 8;

      const elapsed = (Date.now() - startTime) * 0.001;

      // Activity factor: strictly 0 when no events/activity occur
      const intensity = activityIntensityRef.current;
      const spike = spikeEnergyRef.current;
      const isIdle = intensity <= 0.01 && spike <= 0.02;

      // Resting zero baseline height (flatline level)
      const baselineY = H * 0.72;

      const points: { x: number; y: number }[] = [];
      const echoPoints: { x: number; y: number }[] = [];

      for (let i = 0; i < numPoints; i++) {
        const x = (i / (numPoints - 1)) * W + px;

        let y: number;
        let echoY: number;

        if (isIdle) {
          // TRUE ZERO STATE: Flatline with subtle sub-pixel breathing edge sensor pulse
          const breath = Math.sin(elapsed * 1.8 + i * 0.1) * 0.6;
          y = baselineY + breath + py * 0.2;
          echoY = baselineY + 12 + breath + py * 0.2;
        } else {
          // ACTIVE TELEMETRY STATE: Dynamic wave scaling proportionally with real event volume
          const waveSpeed = 1.2 + intensity * 1.5;
          const wave1 = Math.sin(i * 0.09 - elapsed * waveSpeed) * (8 + intensity * 12);
          const wave2 = Math.sin(i * 0.04 - elapsed * (waveSpeed * 0.5)) * (4 + intensity * 8);
          const microNoise = Math.sin(elapsed * 3.5 + i * 0.3) * (1.5 + intensity * 2);

          // Kinetic attack burst profile centered on canvas
          const spikeProfile = spike * Math.exp(-Math.pow(i - 65, 2) / 140) * 65;

          y = baselineY - (wave1 + wave2 + microNoise + spikeProfile) + py;
          y = Math.max(H * 0.15, Math.min(H * 0.88, y));

          const echoWave = Math.sin(i * 0.07 - elapsed * (waveSpeed * 0.8) + 0.8) * (5 + intensity * 6);
          echoY = baselineY + 14 - (echoWave + spikeProfile * 0.4) + py;
          echoY = Math.max(H * 0.2, Math.min(H * 0.92, echoY));
        }

        points.push({ x, y });
        echoPoints.push({ x, y: echoY });
      }

      // 1. Fill Area Gradient
      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        if (i === 0) ctx.moveTo(points[i].x, points[i].y);
        else ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.lineTo(W + px, H);
      ctx.lineTo(px, H);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, isIdle ? "rgba(176,125,58,0.02)" : "rgba(176,125,58,0.08)");
      grad.addColorStop(0.5, "rgba(176,125,58,0.02)");
      grad.addColorStop(1, "rgba(176,125,58,0.0)");
      ctx.fillStyle = grad;
      ctx.fill();

      // 2. Trailing Echo Line (Only visible when active)
      if (!isIdle) {
        ctx.beginPath();
        for (let i = 0; i < echoPoints.length; i++) {
          if (i === 0) ctx.moveTo(echoPoints[i].x, echoPoints[i].y);
          else ctx.lineTo(echoPoints[i].x, echoPoints[i].y);
        }
        ctx.strokeStyle = "rgba(176,125,58,0.18)";
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }

      // 3. Glow Stroke Layer
      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        if (i === 0) ctx.moveTo(points[i].x, points[i].y);
        else ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.strokeStyle = isIdle ? "rgba(176,125,58,0.08)" : "rgba(176,125,58,0.15)";
      ctx.lineWidth = isIdle ? 3 : 6;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();

      // 4. Main Line
      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        if (i === 0) ctx.moveTo(points[i].x, points[i].y);
        else ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.strokeStyle = isIdle ? "rgba(176,125,58,0.45)" : "#B07D3A";
      ctx.lineWidth = isIdle ? 1.5 : 2.2;
      if (!isIdle) {
        ctx.shadowColor = "rgba(176,125,58,0.30)";
        ctx.shadowBlur = 8;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 5. Active Edge Beacon Dot
      const lastPt = points[points.length - 1];
      if (lastPt) {
        ctx.beginPath();
        ctx.arc(lastPt.x - 2, lastPt.y, isIdle ? 2.5 : 4, 0, Math.PI * 2);
        ctx.fillStyle = isIdle ? "var(--sage)" : "#B07D3A";
        ctx.fill();

        if (!isIdle) {
          ctx.beginPath();
          ctx.arc(lastPt.x - 2, lastPt.y, 7, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(176,125,58,0.35)";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // 6. Burst Particles
      if (spikeEnergyRef.current > 0.25) {
        for (let k = 0; k < 6; k++) {
          const si = 65 + Math.floor((Math.random() - 0.5) * 24);
          if (si >= 0 && si < points.length) {
            const sx = points[si].x + (Math.random() * 24 - 12);
            const sy = points[si].y + (Math.random() * 20 - 10);
            ctx.beginPath();
            ctx.arc(sx, sy, Math.random() * 1.8 + 0.8, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(176,125,58,${spikeEnergyRef.current * 0.6})`;
            ctx.fill();
          }
        }
      }

      // Smooth decay
      spikeEnergyRef.current *= 0.93;
      activityIntensityRef.current *= 0.98;

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
      window.removeEventListener("resize", resizeCanvas);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  // 5. Real Backend Attack Simulator Dispatcher
  const handleSimulateAttack = async (scenario: "sweep" | "burst" | "standard") => {
    setSimulating(true);
    spikeEnergyRef.current = 1.4;

    try {
      const res = await fetch(`${API_BASE_URL}/velocity/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.steps && data.steps.length > 0) {
          // Progressively display each step from real backend evaluation
          for (const step of data.steps) {
            const entry: TelemetryEntry = {
              id: formatFingerprint(step.log_entry.fingerprint_hash),
              tag: `${formatTxnCategory(step.log_entry.is_micro_transaction ? "MICRO_TXN" : "STANDARD")} · ₹${step.amount.toFixed(2)}`,
              status: step.action === "CHALLENGE_STEP_UP_OTP" ? "step" : step.action === "FLAG_FOR_REVIEW" ? "review" : "verified",
              label: step.action === "CHALLENGE_STEP_UP_OTP" ? "Step-up" : step.action === "FLAG_FOR_REVIEW" ? "Flagged" : "Verified",
              rawAction: step.action,
              amount: step.amount,
              time: "Just now",
              isSimulated: true,
            };
            setFeedData((prev) => [entry, ...prev.slice(0, 19)]);
            spikeEnergyRef.current = 1.0;
            await new Promise((r) => setTimeout(r, 220));
          }
        }
        await fetchTelemetry();
      }
    } catch (err) {
      console.error("Simulation error", err);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onRefresh={() => { fetchTelemetry(); fetchLogs(); }} isRefreshing={loading} />

      <main className="flex-1">
        {/* Page Head */}
        <div className="pagehead">
          <div className="eyebrow">Redis Sliding Window · Sub-2ms Edge Evaluation</div>
          <h1>Velocity Shield</h1>
          <p>Zero-mutation edge defense against card-testing and velocity bursts.</p>
        </div>

        {/* Waveform Panel with Real Zero-State Flatline Indicator */}
        <div className="wave-panel">
          <canvas ref={canvasRef} className="wave-canvas" style={{ width: "100%", height: "200px" }} />
          <div className="wave-overlay">
            <span className="wave-tag font-mono">
              -60s horizon · {currentRPS.toFixed(1)} req/s · {eventsInWindow} in window {eventsInWindow === 0 && "(idle flatline)"}
            </span>
            <span className="wave-tag font-mono">
              sub-2ms live edge ({edgeLatency}ms)
            </span>
          </div>
          <div className="wave-legend">
            <span>
              <span className="dot" style={{ background: "var(--sage)" }} /> verified (0-12/min)
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
              <span className="meta">{simulating ? "Evaluating on Redis…" : "Ready"}</span>
            </div>
            <button
              className="action-card"
              onClick={() => handleSimulateAttack("sweep")}
              disabled={simulating}
            >
              <div className="action-icon gold">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <div>
                <div className="action-title">Card Sweep (Micro-Probes)</div>
                <div className="action-desc">5× ₹2.50 probes evaluated sequentially on Redis</div>
              </div>
            </button>

            <button
              className="action-card"
              onClick={() => handleSimulateAttack("burst")}
              disabled={simulating}
            >
              <div className="action-icon burgundy">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v4m0 12v4m10-10h-4M6 12H2m15.07-7.07l-2.83 2.83M9.76 14.24l-2.83 2.83m11.14 0l-2.83-2.83M9.76 9.76L6.93 6.93" />
                </svg>
              </div>
              <div>
                <div className="action-title">Burst Wave (Velocity Surge)</div>
                <div className="action-desc">10× ₹850.00 surges hitting 60s sliding window</div>
              </div>
            </button>

            <button
              className="action-card"
              onClick={() => handleSimulateAttack("standard")}
              disabled={simulating}
            >
              <div className="action-icon sage">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <div className="action-title">Standard Order</div>
                <div className="action-desc">1× ₹1,450.00 standard frictionless checkout</div>
              </div>
            </button>
          </div>

          {/* Column 2: Protection Thresholds */}
          <div className="panel">
            <div className="panel-head">
              <h3>Protection Thresholds</h3>
              <span className="meta font-mono text-[var(--gold)]">Live Binding</span>
            </div>
            <div className="slider-block">
              <div className="slider-top">
                <span>Micro-probe sub-threshold ceiling</span>
                <span className="v font-mono">₹{probeCeiling}.00</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={probeCeiling}
                onChange={(e) => handlePolicyChange(Number(e.target.value), undefined)}
              />
            </div>

            <div className="slider-block" style={{ marginBottom: 0 }}>
              <div className="slider-top">
                <span>Sliding window horizon</span>
                <span className="v font-mono">{windowHorizon} sec</span>
              </div>
              <input
                type="range"
                min="15"
                max="120"
                value={windowHorizon}
                onChange={(e) => handlePolicyChange(undefined, Number(e.target.value))}
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
                <span style={{ color: "var(--gold)" }}>●</span> Read-only edge evaluation. Zero live settlement mutation.
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

          {feedData.length === 0 ? (
            <div className="empty" style={{ padding: "30px 0" }}>
              <div className="glyph">◌</div>
              <p>No risk events recorded in the active sliding window.</p>
              <p className="text-[11px] opacity-75 mt-1">
                Dispatch a simulation above or trigger a live webhook to observe real-time edge telemetry.
              </p>
            </div>
          ) : (
            <div className="feed" style={{ maxHeight: "320px" }}>
              {feedData.map((r, i) => (
                <div key={i} className="feed-row">
                  <div className="flex items-center gap-2">
                    <span className="feed-id">{r.id}</span>
                    <span className="feed-tag">{r.tag}</span>
                    {r.isSimulated && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--gold-soft)] text-[var(--gold)] border border-[var(--gold)]/20">
                        SIMULATED
                      </span>
                    )}
                    {r.time && <span className="feed-amt text-[10px] opacity-60">({r.time})</span>}
                  </div>
                  <StatusBadge verdict={r.rawAction || r.label} />
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
