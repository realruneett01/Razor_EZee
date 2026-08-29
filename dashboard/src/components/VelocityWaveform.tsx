"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Activity, 
  ShieldAlert, 
  ShieldCheck, 
  Zap, 
  Play, 
  Lock, 
  Flame, 
  Sparkles,
  AlertTriangle,
  RotateCcw
} from "lucide-react";

interface WaveformPoint {
  second: number; // 0 to 59
  allowed: number;
  flagged: number;
  challenged: number;
  label: string;
}

interface VelocityWaveformProps {
  onTriggerBurst?: () => void;
  externalBurstActive?: boolean;
}

export const VelocityWaveform: React.FC<VelocityWaveformProps> = ({
  onTriggerBurst,
  externalBurstActive = false,
}) => {
  const [data, setData] = useState<WaveformPoint[]>([]);
  const [isSimulatingBurst, setIsSimulatingBurst] = useState<boolean>(false);
  const [currentRPS, setCurrentRPS] = useState<number>(14);
  const [blockedCount, setBlockedCount] = useState<number>(0);
  const [avgLatencyMs, setAvgLatencyMs] = useState<number>(1.4);
  const burstCountdownRef = useRef<number>(0);

  // Initialize 60 seconds of history
  useEffect(() => {
    const initial: WaveformPoint[] = [];
    const now = Math.floor(Date.now() / 1000);
    for (let i = 59; i >= 0; i--) {
      const isPastSpike = i >= 20 && i <= 25;
      const isPastFlag = i >= 26 && i <= 28;
      initial.push({
        second: 59 - i,
        allowed: Math.floor(8 + Math.random() * 8),
        flagged: isPastFlag ? Math.floor(3 + Math.random() * 3) : 0,
        challenged: isPastSpike ? Math.floor(6 + Math.random() * 8) : 0,
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

  // 1-second sliding-window heartbeat ticker
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
          ? Math.floor(4 + Math.random() * 4)
          : Math.floor(10 + Math.random() * 8);

        const flagged = isBursting ? Math.floor(3 + Math.random() * 4) : 0;
        const challenged = isBursting ? Math.floor(8 + Math.random() * 12) : 0;

        if (challenged > 0) {
          setBlockedCount((c) => c + challenged);
        }

        const totalReq = allowed + flagged + challenged;
        setCurrentRPS(totalReq);
        setAvgLatencyMs(Number((1.2 + Math.random() * 0.4).toFixed(1)));

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

  // SVG Waveform Geometry Calculations (Width: 600, Height: 160)
  const svgWidth = 600;
  const svgHeight = 160;
  const paddingX = 12;
  const paddingY = 16;
  const innerWidth = svgWidth - paddingX * 2;
  const innerHeight = svgHeight - paddingY * 2;

  // Max transaction count in a single second for scaling (min 25)
  const maxVal = Math.max(
    25,
    ...data.map((d) => d.allowed + d.flagged + d.challenged)
  );

  // Compute coordinate points
  const points = data.map((d, idx) => {
    const x = paddingX + (idx / (data.length - 1 || 1)) * innerWidth;
    const total = d.allowed + d.flagged + d.challenged;
    const yTotal = svgHeight - paddingY - (total / maxVal) * innerHeight;
    const yAllowed = svgHeight - paddingY - (d.allowed / maxVal) * innerHeight;
    return {
      x,
      yTotal,
      yAllowed,
      challenged: d.challenged,
      flagged: d.flagged,
      allowed: d.allowed,
      raw: d,
    };
  });

  // Construct smooth SVG path for Baseline & Spikes
  const totalLinePath = points.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.x},${pt.yTotal}`;
    const prev = arr[i - 1];
    const cp1x = prev.x + (pt.x - prev.x) / 2;
    const cp1y = prev.yTotal;
    const cp2x = prev.x + (pt.x - prev.x) / 2;
    const cp2y = pt.yTotal;
    return `${acc} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${pt.x},${pt.yTotal}`;
  }, "");

  const lastPt = points[points.length - 1] || { x: svgWidth, yTotal: svgHeight };
  const firstPt = points[0] || { x: 0, yTotal: svgHeight };
  const totalAreaPath = `${totalLinePath} L ${lastPt.x},${svgHeight - paddingY} L ${firstPt.x},${svgHeight - paddingY} Z`;

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 relative overflow-hidden">
      {/* Dynamic ambient burst alert glow */}
      {isSimulatingBurst && (
        <div className="absolute inset-0 bg-rose-500/5 animate-pulse pointer-events-none rounded-2xl" />
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Live 60-Second Sliding-Window Waveform
              </h2>
              {isSimulatingBurst ? (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full animate-pulse">
                  BURST INTERCEPTED
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-1" />
                  LIVE STREAM
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time checkout RPS · Card-testing burst pulses · Sub-2ms Redis token bucket evaluation
            </p>
          </div>
        </div>

        {/* Live Metrics Pill Boxes */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-center min-w-[70px]">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">RPS</span>
            <span className="text-sm font-bold font-mono text-cyan-400">{currentRPS} req/s</span>
          </div>

          <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-center min-w-[75px]">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Edge Latency</span>
            <span className="text-sm font-bold font-mono text-emerald-400">{avgLatencyMs}ms</span>
          </div>

          <button
            onClick={triggerLiveAttack}
            disabled={isSimulatingBurst}
            className="flex items-center space-x-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-950 text-white font-semibold rounded-xl text-xs transition shadow-lg shadow-rose-600/20 disabled:opacity-60"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{isSimulatingBurst ? "Burst Active..." : "Inject Bot Attack"}</span>
          </button>
        </div>
      </div>

      {/* Interactive SVG Real-Time Waveform Chart */}
      <div className="relative bg-slate-950/80 border border-slate-800/90 rounded-xl p-4 overflow-hidden">
        {/* Grid Background Lines */}
        <div className="absolute inset-0 grid grid-rows-4 grid-cols-6 opacity-15 pointer-events-none">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="border-r border-b border-slate-600" />
          ))}
        </div>

        {/* SVG Container */}
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-44 overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Ambient Waveform Area Gradient */}
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={isSimulatingBurst ? "#f43f5e" : "#06b6d4"} stopOpacity="0.45" />
              <stop offset="60%" stopColor={isSimulatingBurst ? "#e11d48" : "#3b82f6"} stopOpacity="0.15" />
              <stop offset="100%" stopColor="#080C14" stopOpacity="0.0" />
            </linearGradient>

            {/* Threshold Line Filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Hard Threshold Line (10 req/s Micro Burst Cap) */}
          <line
            x1={paddingX}
            y1={svgHeight - paddingY - (10 / maxVal) * innerHeight}
            x2={svgWidth - paddingX}
            y2={svgHeight - paddingY - (10 / maxVal) * innerHeight}
            stroke="#f59e0b"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.6"
          />
          <text
            x={svgWidth - paddingX - 4}
            y={svgHeight - paddingY - (10 / maxVal) * innerHeight - 4}
            fill="#fbbf24"
            fontSize="9"
            textAnchor="end"
            fontFamily="monospace"
          >
            Burst Threshold (10 tx/min)
          </text>

          {/* Hard Freeze Step-Up OTP Cap (16 req/s) */}
          <line
            x1={paddingX}
            y1={svgHeight - paddingY - (16 / maxVal) * innerHeight}
            x2={svgWidth - paddingX}
            y2={svgHeight - paddingY - (16 / maxVal) * innerHeight}
            stroke="#f43f5e"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.7"
          />
          <text
            x={svgWidth - paddingX - 4}
            y={svgHeight - paddingY - (16 / maxVal) * innerHeight - 4}
            fill="#fb7185"
            fontSize="9"
            textAnchor="end"
            fontFamily="monospace"
          >
            Step-Up OTP Trigger (&gt;15 tx/min)
          </text>

          {/* Waveform Area Fill */}
          <path d={totalAreaPath} fill="url(#waveGradient)" />

          {/* Waveform Outline Path */}
          <path
            d={totalLinePath}
            fill="none"
            stroke={isSimulatingBurst ? "#fb7185" : "#22d3ee"}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
          />

          {/* Challenge & Spike Highlight Markers */}
          {points.map((pt, i) => {
            if (pt.challenged > 0) {
              return (
                <g key={i}>
                  {/* Vertical burst beam */}
                  <line
                    x1={pt.x}
                    y1={pt.yTotal}
                    x2={pt.x}
                    y2={svgHeight - paddingY}
                    stroke="#f43f5e"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                    opacity="0.8"
                  />
                  {/* Glowing alert point */}
                  <circle cx={pt.x} cy={pt.yTotal} r="4.5" fill="#f43f5e" />
                  <circle
                    cx={pt.x}
                    cy={pt.yTotal}
                    r="8"
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="1"
                    className="animate-ping origin-center"
                    opacity="0.7"
                  />
                </g>
              );
            }
            if (pt.flagged > 0) {
              return (
                <circle
                  key={i}
                  cx={pt.x}
                  cy={pt.yTotal}
                  r="3.5"
                  fill="#f59e0b"
                />
              );
            }
            return null;
          })}

          {/* Current Live Head Point */}
          <circle cx={lastPt.x} cy={lastPt.yTotal} r="4" fill="#ffffff" />
          <circle
            cx={lastPt.x}
            cy={lastPt.yTotal}
            r="8"
            fill="none"
            stroke="#22d3ee"
            strokeWidth="1.5"
            className="animate-ping origin-center"
          />
        </svg>

        {/* Time Labels beneath X-Axis */}
        <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-1 px-1">
          <span>-60s (Past Window)</span>
          <span>-45s</span>
          <span>-30s</span>
          <span>-15s</span>
          <span className="text-cyan-400 font-bold">0s (Now)</span>
        </div>
      </div>

      {/* Legend & Telemetry Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
        {/* Allowed Stream */}
        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50 flex-shrink-0" />
          <div>
            <div className="font-semibold text-slate-200">Allowed Shopper Volume</div>
            <div className="text-[11px] text-slate-400">Normal checkout transactions passing with zero friction</div>
          </div>
        </div>

        {/* Flagged Review */}
        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50 flex-shrink-0" />
          <div>
            <div className="font-semibold text-amber-300">Flagged For Review (Tier 1)</div>
            <div className="text-[11px] text-slate-400">Approaching 3x micro-txn or burst velocity threshold</div>
          </div>
        </div>

        {/* Challenged OTP */}
        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50 flex-shrink-0" />
          <div>
            <div className="font-semibold text-rose-300">Challenged Step-Up OTP (Tier 2)</div>
            <div className="text-[11px] text-slate-400">Malicious bot spikes blocked; genuine cardholders verified</div>
          </div>
        </div>
      </div>
    </div>
  );
};
