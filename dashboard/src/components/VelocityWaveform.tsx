"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Activity, 
  Flame, 
  Zap, 
  ShieldCheck, 
  Radio, 
  Sparkles,
  ArrowUpRight
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
  const [avgLatencyMs, setAvgLatencyMs] = useState<number>(1.3);
  const [burstCount, setBurstCount] = useState<number>(0);
  const burstCountdownRef = useRef<number>(0);

  // Initialize 60 seconds of fluid history
  useEffect(() => {
    const initial: WaveformPoint[] = [];
    const now = Math.floor(Date.now() / 1000);
    for (let i = 59; i >= 0; i--) {
      const isPastSpike = i >= 22 && i <= 26;
      const isPastFlag = i >= 27 && i <= 29;
      initial.push({
        second: 59 - i,
        allowed: Math.floor(9 + Math.sin(i / 3) * 3 + Math.random() * 2),
        flagged: isPastFlag ? Math.floor(3 + Math.random() * 2) : 0,
        challenged: isPastSpike ? Math.floor(8 + Math.random() * 6) : 0,
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
          : Math.floor(10 + Math.sin(Date.now() / 2000) * 3 + Math.random() * 3);

        const flagged = isBursting ? Math.floor(4 + Math.random() * 3) : 0;
        const challenged = isBursting ? Math.floor(10 + Math.random() * 12) : 0;

        if (challenged > 0) {
          setBurstCount((c) => c + challenged);
        }

        const totalReq = allowed + flagged + challenged;
        setCurrentRPS(totalReq);
        setAvgLatencyMs(Number((1.1 + Math.random() * 0.4).toFixed(1)));

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
  const svgHeight = 200;
  const paddingX = 8;
  const paddingY = 20;
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
    <div className="relative rounded-3xl p-7 overflow-hidden transition-all duration-500 bg-zinc-900/40 backdrop-blur-2xl border border-white/[0.07] shadow-[0_16px_48px_rgba(0,0,0,0.4)]">
      {/* Subtle Ambient Radial Mesh Behind Waveform */}
      <div 
        className={`absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-colors duration-700 ${
          isSimulatingBurst ? "bg-rose-500/15" : "bg-cyan-500/10"
        }`} 
      />
      <div 
        className={`absolute -bottom-24 -right-24 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-colors duration-700 ${
          isSimulatingBurst ? "bg-amber-500/15" : "bg-indigo-500/10"
        }`} 
      />

      {/* Header Bar */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div className="flex items-center space-x-3.5">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all duration-500 ${
            isSimulatingBurst 
              ? "bg-gradient-to-tr from-rose-500 to-amber-500 shadow-rose-500/30 scale-105" 
              : "bg-gradient-to-tr from-cyan-500 to-indigo-600 shadow-cyan-500/25"
          }`}>
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Live 60-Second Sliding-Window Waveform
              </h2>
              {isSimulatingBurst ? (
                <span className="flex items-center space-x-1 px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping mr-1" />
                  Burst Intercepted
                </span>
              ) : (
                <span className="flex items-center space-x-1 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1" />
                  Stream Active
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Sub-2ms Redis token bucket evaluation · Zero checkout friction on genuine shoppers
            </p>
          </div>
        </div>

        {/* Live Telemetry Pills & Attack Trigger */}
        <div className="flex items-center space-x-2.5 self-start md:self-auto">
          <div className="px-3.5 py-2 rounded-2xl bg-white/[0.04] border border-white/[0.06] text-center min-w-[84px]">
            <span className="text-[9px] text-slate-400 uppercase font-mono tracking-wider block">Window RPS</span>
            <span className="text-sm font-bold font-mono text-cyan-300">{currentRPS} req/s</span>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-white/[0.04] border border-white/[0.06] text-center min-w-[84px]">
            <span className="text-[9px] text-slate-400 uppercase font-mono tracking-wider block">Edge Ping</span>
            <span className="text-sm font-bold font-mono text-emerald-300">{avgLatencyMs}ms</span>
          </div>

          <button
            onClick={triggerLiveAttack}
            disabled={isSimulatingBurst}
            className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs font-semibold transition-all duration-300 shadow-lg ${
              isSimulatingBurst
                ? "bg-rose-950/60 border border-rose-500/40 text-rose-300 cursor-not-allowed"
                : "bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white shadow-rose-500/25 hover:scale-[1.02] active:scale-[0.98]"
            }`}
          >
            <Flame className={`w-4 h-4 ${isSimulatingBurst ? "animate-bounce" : ""}`} />
            <span>{isSimulatingBurst ? "Evaluating Burst..." : "Inject Bot Sweep"}</span>
          </button>
        </div>
      </div>

      {/* Fluid Spline SVG Waveform Area */}
      <div className="relative z-10 my-3 rounded-2xl p-4 bg-black/40 border border-white/[0.05] overflow-hidden">
        {/* Soft Ambient Horizontal Gridlines */}
        <div className="absolute inset-0 flex flex-col justify-between p-4 opacity-10 pointer-events-none">
          <div className="w-full border-b border-white" />
          <div className="w-full border-b border-white" />
          <div className="w-full border-b border-white" />
          <div className="w-full border-b border-white" />
        </div>

        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-48 overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Fluid Multi-stop Ambient Gradient Underfill */}
            <linearGradient id="splineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop 
                offset="0%" 
                stopColor={isSimulatingBurst ? "#f43f5e" : "#06b6d4"} 
                stopOpacity={isSimulatingBurst ? "0.55" : "0.35"} 
              />
              <stop 
                offset="50%" 
                stopColor={isSimulatingBurst ? "#fb923c" : "#6366f1"} 
                stopOpacity={isSimulatingBurst ? "0.2" : "0.1"} 
              />
              <stop offset="100%" stopColor="#060911" stopOpacity="0.0" />
            </linearGradient>

            {/* Glowing Neon Stroke Filter */}
            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Minimal Floating Threshold Guidelines (Soft Opacity) */}
          <line
            x1={paddingX}
            y1={yBurstThreshold}
            x2={svgWidth - paddingX}
            y2={yBurstThreshold}
            stroke="#f59e0b"
            strokeWidth="1"
            strokeDasharray="4 6"
            opacity="0.25"
          />
          <line
            x1={paddingX}
            y1={yOtpThreshold}
            x2={svgWidth - paddingX}
            y2={yOtpThreshold}
            stroke="#f43f5e"
            strokeWidth="1"
            strokeDasharray="4 6"
            opacity="0.3"
          />

          {/* Spline Area Fill */}
          <path d={areaPath} fill="url(#splineGradient)" />

          {/* Spline Glowing Stroke */}
          <path
            d={splinePath}
            fill="none"
            stroke={isSimulatingBurst ? "#fb7185" : "#22d3ee"}
            strokeWidth="3"
            strokeLinecap="round"
            filter="url(#neonGlow)"
            className="transition-all duration-300"
          />

          {/* Micro Challenge Spark Nodes */}
          {coords.map((pt, i) => {
            if (pt.challenged > 0) {
              return (
                <g key={i}>
                  <circle cx={pt.x} cy={pt.y} r="4" fill="#f43f5e" />
                  <circle cx={pt.x} cy={pt.y} r="8" fill="none" stroke="#f43f5e" strokeWidth="1" opacity="0.6" className="animate-ping" />
                </g>
              );
            }
            if (pt.flagged > 0) {
              return <circle key={i} cx={pt.x} cy={pt.y} r="3" fill="#f59e0b" opacity="0.8" />;
            }
            return null;
          })}

          {/* Live-Head Pulsing Beacon Node */}
          <circle cx={lastPt.x} cy={lastPt.y} r="4.5" fill="#ffffff" />
          <circle
            cx={lastPt.x}
            cy={lastPt.y}
            r="9"
            fill="none"
            stroke={isSimulatingBurst ? "#f43f5e" : "#22d3ee"}
            strokeWidth="2"
            className="animate-ping"
            style={{ transformOrigin: `${lastPt.x}px ${lastPt.y}px` }}
          />
        </svg>

        {/* Minimal Floating Threshold Badges */}
        <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mt-2 px-1">
          <span className="text-slate-500">-60s Horizon</span>
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1 text-amber-400/80">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Flag Review (&gt;12 req/min)</span>
            </span>
            <span className="flex items-center space-x-1 text-rose-400/80">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>Step-Up OTP (&gt;18 req/min)</span>
            </span>
          </div>
          <span className="text-cyan-400 font-bold flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping mr-1" />
            0s (Now)
          </span>
        </div>
      </div>

      {/* Stream Deck Telemetry Footer */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
        <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center space-x-3">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-md shadow-cyan-400/50 flex-shrink-0" />
          <div>
            <div className="font-semibold text-slate-200">Allowed Shopper Volume</div>
            <div className="text-[10px] text-slate-400">Zero mutation friction on legitimate checkouts</div>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center space-x-3">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-md shadow-amber-400/50 flex-shrink-0" />
          <div>
            <div className="font-semibold text-amber-300">Flagged For Review (Tier 1)</div>
            <div className="text-[10px] text-slate-400">Micro-transaction card-testing velocity tracking</div>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center space-x-3">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-md shadow-rose-500/50 flex-shrink-0" />
          <div>
            <div className="font-semibold text-rose-300">Challenged Step-Up OTP (Tier 2)</div>
            <div className="text-[10px] text-slate-400">Automated step-up friction applied to bot bursts</div>
          </div>
        </div>
      </div>
    </div>
  );
};
