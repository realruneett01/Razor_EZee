"use client";

import React, { useState } from "react";
import { 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  AlertOctagon, 
  ShieldAlert, 
  Info,
  ExternalLink
} from "lucide-react";

export interface RatioReport {
  rolling_days: number;
  dispute_ratio_percentage: number;
  status: "safe" | "watch" | "danger";
  threshold_safe: number;
  threshold_danger: number;
  timestamp: string;
}

interface HealthGaugeProps {
  report: RatioReport | null;
  loading: boolean;
  error: string | null;
}

export const HealthGauge: React.FC<HealthGaugeProps> = ({ report, loading, error }) => {
  const [hoveredThreshold, setHoveredThreshold] = useState<string | null>(null);

  const ratio = report?.dispute_ratio_percentage ?? 0.18;
  const status = report?.status ?? (ratio >= 0.45 ? "danger" : ratio >= 0.30 ? "watch" : "safe");

  // Gauge scale: 0.00% to 0.80% maximum
  const maxScale = 0.80;
  const clampedRatio = Math.min(Math.max(ratio, 0), maxScale);
  const ratioFraction = clampedRatio / maxScale;

  // SVG Radial Dial Geometry
  // Arc spans 240 degrees (from 150 deg to 390 deg)
  const radius = 72;
  const strokeWidth = 14;
  const cx = 110;
  const cy = 100;
  const arcLength = 2 * Math.PI * radius * (240 / 360); // Total arc length ~ 301.6px
  const progressOffset = arcLength * (1 - ratioFraction);

  const getStatusDetails = (st: string) => {
    switch (st) {
      case "danger":
        return {
          text: "text-rose-400",
          border: "border-rose-500/40",
          bg: "bg-rose-950/40",
          badge: "bg-rose-500 text-white",
          glow: "rgba(244, 63, 94, 0.35)",
          label: "DANGER — HARD CAP BREACH",
          sublabel: "Acquiring banks will freeze settlements",
          icon: AlertOctagon,
        };
      case "watch":
        return {
          text: "text-amber-400",
          border: "border-amber-500/40",
          bg: "bg-amber-950/40",
          badge: "bg-amber-500 text-slate-900",
          glow: "rgba(245, 158, 11, 0.35)",
          label: "WARNING — APPROACHING CAP",
          sublabel: "Step-up OTP challenge activated",
          icon: AlertCircle,
        };
      default:
        return {
          text: "text-emerald-400",
          border: "border-emerald-500/40",
          bg: "bg-emerald-950/40",
          badge: "bg-emerald-500 text-slate-900",
          glow: "rgba(16, 185, 129, 0.35)",
          label: "SAFE REGULATORY ZONE",
          sublabel: "Autonomous recovery running smoothly",
          icon: CheckCircle2,
        };
    }
  };

  const currentDetails = getStatusDetails(status);
  const StatusIcon = currentDetails.icon;

  // Threshold tick angles in degrees (offset by 150)
  // 0.30% -> (0.30 / 0.80) * 240 = 90 deg -> 150 + 90 = 240 deg
  // 0.45% -> (0.45 / 0.80) * 240 = 135 deg -> 150 + 135 = 285 deg
  // 0.65% -> (0.65 / 0.80) * 240 = 195 deg -> 150 + 195 = 345 deg

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden">
      {/* Background ambient glow based on status */}
      <div 
        className="absolute top-0 right-0 w-56 h-56 rounded-full blur-3xl pointer-events-none opacity-20 -mr-20 -mt-20 transition-colors duration-500"
        style={{ backgroundColor: status === "danger" ? "#f43f5e" : status === "watch" ? "#f59e0b" : "#10b981" }}
      />

      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-semibold text-white">Circular Regulatory Dial</h2>
          </div>
          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-full text-[11px] font-mono text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>Rolling 30-Day Ratio</span>
          </div>
        </div>

        {loading && (
          <div className="py-16 text-center text-slate-400 animate-pulse text-xs">
            Calculating dispute ratio from rolling turnover...
          </div>
        )}

        {error && !loading && (
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 text-xs">
            Dispute ratio monitoring stream offline.
          </div>
        )}

        {!loading && !error && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 my-2">
            {/* SVG Circular Radial Gauge */}
            <div className="relative w-56 h-52 flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 220 200">
                <defs>
                  {/* Gauge Sector Gradients */}
                  <linearGradient id="gaugeSafeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#059669" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                  <linearGradient id="gaugeWatchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#d97706" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                  <linearGradient id="gaugeDangerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#e11d48" />
                    <stop offset="100%" stopColor="#f43f5e" />
                  </linearGradient>
                </defs>

                {/* Background Track Arc */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${arcLength} ${2 * Math.PI * radius}`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  transform={`rotate(150 ${cx} ${cy})`}
                />

                {/* Highlighted Sector: Safe Zone (0 - 0.30%) */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill="none"
                  stroke="rgba(16, 185, 129, 0.3)"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${arcLength * (0.30 / 0.80)} ${2 * Math.PI * radius}`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  transform={`rotate(150 ${cx} ${cy})`}
                />

                {/* Highlighted Sector: Warning Zone (0.30 - 0.45%) */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill="none"
                  stroke="rgba(245, 158, 11, 0.35)"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${arcLength * ((0.45 - 0.30) / 0.80)} ${2 * Math.PI * radius}`}
                  strokeDashoffset={`-${arcLength * (0.30 / 0.80)}`}
                  transform={`rotate(150 ${cx} ${cy})`}
                />

                {/* Highlighted Sector: Hard Freeze Zone (0.45 - 0.80%) */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill="none"
                  stroke="rgba(244, 63, 94, 0.35)"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${arcLength * ((0.80 - 0.45) / 0.80)} ${2 * Math.PI * radius}`}
                  strokeDashoffset={`-${arcLength * (0.45 / 0.80)}`}
                  strokeLinecap="round"
                  transform={`rotate(150 ${cx} ${cy})`}
                />

                {/* Active Dynamic Value Progress Arc */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill="none"
                  stroke={status === "danger" ? "url(#gaugeDangerGrad)" : status === "watch" ? "url(#gaugeWatchGrad)" : "url(#gaugeSafeGrad)"}
                  strokeWidth={strokeWidth + 2}
                  strokeDasharray={`${arcLength} ${2 * Math.PI * radius}`}
                  strokeDashoffset={progressOffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                  transform={`rotate(150 ${cx} ${cy})`}
                  style={{ filter: `drop-shadow(0 0 6px ${currentDetails.glow})` }}
                />
              </svg>

              {/* Center Metrics Readout */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                <span className={`text-3xl font-extrabold tracking-tight font-mono ${currentDetails.text}`}>
                  {ratio.toFixed(2)}%
                </span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
                  Dispute Ratio
                </span>
                <span className={`mt-1.5 px-2 py-0.5 text-[9px] font-bold uppercase rounded tracking-wider ${currentDetails.badge}`}>
                  {status}
                </span>
              </div>
            </div>

            {/* Threshold Breakdown Cards */}
            <div className="flex-1 space-y-2.5 text-xs w-full">
              {/* Safe Threshold Card */}
              <div 
                onMouseEnter={() => setHoveredThreshold("safe")}
                onMouseLeave={() => setHoveredThreshold(null)}
                className={`p-2.5 rounded-xl border transition cursor-default ${
                  hoveredThreshold === "safe" || ratio <= 0.30
                    ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-200"
                    : "bg-slate-900/80 border-slate-800 text-slate-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                    <span className="font-semibold text-white">0.00% &ndash; 0.30%</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-emerald-400">SAFE ZONE</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Normal operating bandwidth. Razorpay standard settlement schedule.</p>
              </div>

              {/* Warning Threshold Card */}
              <div 
                onMouseEnter={() => setHoveredThreshold("watch")}
                onMouseLeave={() => setHoveredThreshold(null)}
                className={`p-2.5 rounded-xl border transition cursor-default ${
                  hoveredThreshold === "watch" || (ratio > 0.30 && ratio <= 0.45)
                    ? "bg-amber-950/40 border-amber-500/50 text-amber-200"
                    : "bg-slate-900/80 border-slate-800 text-slate-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
                    <span className="font-semibold text-white">0.30% &ndash; 0.45%</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-amber-400">WARNING ALERT</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Visa/Mastercard watchlist. Preemptive Velocity OTP friction stepped up.</p>
              </div>

              {/* Hard Freeze Threshold Card */}
              <div 
                onMouseEnter={() => setHoveredThreshold("danger")}
                onMouseLeave={() => setHoveredThreshold(null)}
                className={`p-2.5 rounded-xl border transition cursor-default ${
                  hoveredThreshold === "danger" || ratio > 0.45
                    ? "bg-rose-950/40 border-rose-500/50 text-rose-200"
                    : "bg-slate-900/80 border-slate-800 text-slate-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
                    <span className="font-semibold text-white">&gt; 0.45% &ndash; 0.65%</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-rose-400">HARD FREEZE CAP</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Acquiring bank freeze risk (HDFC/ICICI). Razorpay account under audit.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Regulatory Summary Footer */}
      <div className={`mt-4 p-3.5 rounded-xl border ${currentDetails.border} ${currentDetails.bg} text-xs flex items-start space-x-2.5`}>
        <StatusIcon className={`w-4 h-4 ${currentDetails.text} flex-shrink-0 mt-0.5`} />
        <div>
          <div className={`font-semibold ${currentDetails.text}`}>{currentDetails.label}</div>
          <p className="text-slate-300 text-[11px] leading-relaxed mt-0.5">
            {status === "danger"
              ? "Critical regulatory alert! 30-day dispute ratio has exceeded 0.45%. Preemptive Velocity Shield is blocking high-risk card testing to prevent acquiring bank settlement freezes."
              : status === "watch"
              ? "Ratio is elevated (0.30% - 0.45%). Adaptive step-up OTP friction is activated on suspicious BINs to keep total dispute volume beneath the card network threshold."
              : "Dispute ratio is firmly within the safe operating envelope (< 0.30%). Autonomous multimodal evidence dossiers are continuously recovering contested funds."}
          </p>
        </div>
      </div>
    </div>
  );
};
