"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Activity, 
  Flame, 
  Zap, 
  ShieldCheck, 
  Radio
} from "lucide-react";

interface WaveformPoint {
  second: number;
  allowed: number;
  flagged: number;
  challenged: number;
  label: string;
}

interface VelocityWaveformProps {
  onTriggerBurst?: () => void;
  externalBurstActive?: boolean;
}

// Monotone cubic spline helper for ultra-smooth Bezier curves
function getSplineSvgPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x},${pts[0].y}`;
  
  let path = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i === 0 ? 0 : i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }
  return path;
}

export const VelocityWaveform: React.FC<VelocityWaveformProps> = ({
  onTriggerBurst,
  externalBurstActive = false,
}) => {
  const [data, setData] = useState<WaveformPoint[]>([]);
  const [isSimulatingBurst, setIsSimulatingBurst] = useState<boolean>(false);
  const [currentRPS, setCurrentRPS] = useState<number>(14);
  const [avgLatencyMs, setAvgLatencyMs] = useState<number>(1.2);
  const burstCountdownRef = useRef<number>(0);

  // Initialize 60 seconds of fluid history
  useEffect(() => {
    const initial: WaveformPoint[] = [];
    const now = Math.floor(Date.now() / 1000);
    for (let i = 59; i >= 0; i--) {
      const isPastSpike = i >= 24 && i <= 27;
      const isPastFlag = i >= 28 && i <= 30;
      initial.push({
        second: 59 - i,
        allowed: Math.floor(9 + Math.sin(i / 4) * 2.5 + Math.random() * 2),
        flagged: isPastFlag ? Math.floor(2 + Math.random() * 2) : 0,
        challenged: isPastSpike ? Math.floor(7 + Math.random() * 5) : 0,
        label: new Date((now - i) * 1000).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      });
    }
    setData(initial);
  }, []);

  // Sync external burst
  useEffect(() => {
    if (externalBurstActive) {
      burstCountdownRef.current = 6;
      setIsSimulatingBurst(true);
    }
  }, [externalBurstActive]);

  // Real-time 1-second sliding-window stream
  useEffect(() => {
    const interval = setInterval(() => {
      setData((prevData) => {
        if (prevData.length === 0) return prevData;

        const isBursting = burstCountdownRef.current > 0;
        if (burstCountdownRef.current > 0) {
          burstCountdownRef.current -= 1;
          if (burstCountdownRef.current === 0) {
            setIsSimulatingBurst(false);
          }
        }

        const allowed = isBursting
          ? Math.floor(4 + Math.random() * 3)
          : Math.floor(10 + Math.sin(Date.now() / 2500) * 2.5 + Math.random() * 2);

        const flagged = isBursting ? Math.floor(3 + Math.random() * 3) : 0;
        const challenged = isBursting ? Math.floor(9 + Math.random() * 10) : 0;

        const totalReq = allowed + flagged + challenged;
        setCurrentRPS(totalReq);
        setAvgLatencyMs(Number((1.1 + Math.random() * 0.3).toFixed(1)));

        const nextSecond = (prevData[prevData.length - 1]?.second ?? 0) + 1;
        const nowLabel = new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });

        const newPoint: WaveformPoint = {
          second: nextSecond,
          allowed,
          flagged,
          challenged,
          label: nowLabel,
        };

        return [...prevData.slice(1), newPoint];
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const triggerLiveAttack = () => {
    burstCountdownRef.current = 6;
    setIsSimulatingBurst(true);
    if (onTriggerBurst) {
      onTriggerBurst();
    }
  };

  // SVG Geometry Dimensions
  const svgWidth = 800;
  const svgHeight = 180;
  const paddingX = 8;
  const paddingY = 16;
  const innerWidth = svgWidth - paddingX * 2;
  const innerHeight = svgHeight - paddingY * 2;

  const maxVal = Math.max(
    28,
    ...data.map((d) => d.allowed + d.flagged + d.challenged)
  );

  const coords = data.map((d, idx) => {
    const x = paddingX + (idx / (data.length - 1 || 1)) * innerWidth;
    const total = d.allowed + d.flagged + d.challenged;
    const y = svgHeight - paddingY - (total / maxVal) * innerHeight;
    return { x, y, challenged: d.challenged, flagged: d.flagged, allowed: d.allowed };
  });

  const splinePath = getSplineSvgPath(coords);
  const lastPt = coords[coords.length - 1] || { x: svgWidth - paddingX, y: svgHeight - paddingY };
  const firstPt = coords[0] || { x: paddingX, y: svgHeight - paddingY };
  const areaPath = `${splinePath} L ${lastPt.x},${svgHeight - paddingY} L ${firstPt.x},${svgHeight - paddingY} Z`;

  // Threshold Y Coordinates
  const yBurstThreshold = svgHeight - paddingY - (12 / maxVal) * innerHeight;
  const yOtpThreshold = svgHeight - paddingY - (18 / maxVal) * innerHeight;

  return (
    <div className="rounded-2xl p-6 bg-zinc-900/30 backdrop-blur-xl border border-white/[0.08] shadow-lg space-y-4">
      {/* Streamlined Single-Line Header & Telemetry Ribbon */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Live 60-Second Sliding-Window Waveform
            </h2>
          </div>
          {/* Horizontal Text Ribbon Telemetry */}
          <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1 font-mono">
            <span>RPS: <strong className="text-cyan-300 font-semibold">{currentRPS} req/s</strong></span>
            <span>·</span>
            <span>Edge Ping: <strong className="text-emerald-300 font-semibold">{avgLatencyMs}ms</strong></span>
            <span>·</span>
            <span>Window: <span className="text-slate-300">60s Atomic</span></span>
            <span>·</span>
            <span className={isSimulatingBurst ? "text-rose-400 font-bold" : "text-emerald-400"}>
              {isSimulatingBurst ? "● BURST DETECTED" : "● STREAM ACTIVE"}
            </span>
          </div>
        </div>

        {/* Compact Action Trigger */}
        <button
          onClick={triggerLiveAttack}
          disabled={isSimulatingBurst}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
            isSimulatingBurst
              ? "bg-rose-950/50 border border-rose-500/30 text-rose-300 cursor-not-allowed"
              : "bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 border border-white/[0.1] active:scale-95"
          }`}
        >
          <Flame className={`w-3.5 h-3.5 ${isSimulatingBurst ? "text-rose-400 animate-bounce" : "text-amber-400"}`} />
          <span>{isSimulatingBurst ? "Evaluating Burst..." : "Inject Bot Attack"}</span>
        </button>
      </div>

      {/* Refined Waveform Canvas: 1.5px Slender Spline + Ample Whitespace */}
      <div className="relative pt-2 pb-1 overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-44 overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Subtle, Lightweight Gradient Underfill */}
            <linearGradient id="splineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop 
                offset="0%" 
                stopColor={isSimulatingBurst ? "#f43f5e" : "#06b6d4"} 
                stopOpacity={isSimulatingBurst ? "0.25" : "0.15"} 
              />
              <stop offset="100%" stopColor="#060911" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Minimal Floating Threshold Guidelines (Clean & Soft) */}
          <line
            x1={paddingX}
            y1={yBurstThreshold}
            x2={svgWidth - paddingX}
            y2={yBurstThreshold}
            stroke="#f59e0b"
            strokeWidth="1"
            strokeDasharray="4 6"
            opacity="0.2"
          />
          <line
            x1={paddingX}
            y1={yOtpThreshold}
            x2={svgWidth - paddingX}
            y2={yOtpThreshold}
            stroke="#f43f5e"
            strokeWidth="1"
            strokeDasharray="4 6"
            opacity="0.25"
          />

          {/* Spline Area Fill */}
          <path d={areaPath} fill="url(#splineGradient)" />

          {/* 1.5px Slender Spline Line */}
          <path
            d={splinePath}
            fill="none"
            stroke={isSimulatingBurst ? "#fb7185" : "#38bdf8"}
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Peak Challenge Nodes */}
          {coords.map((pt, i) => {
            if (pt.challenged > 0) {
              return (
                <circle
                  key={i}
                  cx={pt.x}
                  cy={pt.y}
                  r="3"
                  fill="#f43f5e"
                />
              );
            }
            if (pt.flagged > 0) {
              return (
                <circle
                  key={i}
                  cx={pt.x}
                  cy={pt.y}
                  r="2"
                  fill="#f59e0b"
                />
              );
            }
            return null;
          })}

          {/* High-Precision Live-Head Lead Node */}
          <circle cx={lastPt.x} cy={lastPt.y} r="3.5" fill="#ffffff" />
          <circle cx={lastPt.x} cy={lastPt.y} r="1.5" fill={isSimulatingBurst ? "#f43f5e" : "#0284c7"} />
        </svg>

        {/* Minimal Timeline Footer */}
        <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mt-1 px-1">
          <span>-60s Horizon</span>
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1 text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>Allowed</span>
            </span>
            <span className="flex items-center space-x-1 text-amber-400/80">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Review (&gt;12/min)</span>
            </span>
            <span className="flex items-center space-x-1 text-rose-400/80">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>OTP Challenge (&gt;18/min)</span>
            </span>
          </div>
          <span className="text-cyan-400 font-semibold">0s (Now)</span>
        </div>
      </div>
    </div>
  );
};
