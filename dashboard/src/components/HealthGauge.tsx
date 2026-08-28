import React from "react";
import { Activity, ShieldAlert, CheckCircle2, AlertCircle, AlertOctagon } from "lucide-react";

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
  const ratio = report?.dispute_ratio_percentage ?? 0;
  const status = report?.status ?? "safe";

  const getStatusColor = (st: string) => {
    switch (st) {
      case "danger":
        return {
          bg: "bg-rose-500/10",
          border: "border-rose-500/30",
          text: "text-rose-400",
          badge: "bg-rose-500 text-white",
          label: "DANGER — ACQUIRING BANK RISK",
          icon: AlertOctagon,
        };
      case "watch":
        return {
          bg: "bg-amber-500/10",
          border: "border-amber-500/30",
          text: "text-amber-400",
          badge: "bg-amber-500 text-slate-900",
          label: "WATCHLIST — APPROACHING CAP",
          icon: AlertCircle,
        };
      default:
        return {
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/30",
          text: "text-emerald-400",
          badge: "bg-emerald-500 text-slate-900",
          label: "SAFE REGULATORY ZONE",
          icon: CheckCircle2,
        };
    }
  };

  const style = getStatusColor(status);
  const StatusIcon = style.icon;

  // Percentage bar width clamped 0 - 100% (based on a 1.0% scale)
  const barWidth = Math.min((ratio / 0.80) * 100, 100);

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-semibold text-white">Dispute-to-Turnover Ratio</h2>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Rolling 30-Day Window</span>
        </div>

        {loading && (
          <div className="py-8 text-center text-slate-400 animate-pulse text-xs">
            Calculating ratio from order volume...
          </div>
        )}

        {error && !loading && (
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 text-xs">
            Dispute ratio data currently disconnected.
          </div>
        )}

        {!loading && !error && (
          <div>
            {/* Primary Ratio Display */}
            <div className="flex items-baseline space-x-3 mb-3">
              <span className={`text-4xl font-extrabold tracking-tight font-mono ${style.text}`}>
                {ratio.toFixed(2)}%
              </span>
              <span className={`px-2.5 py-1 text-[11px] font-bold uppercase rounded-md tracking-wider ${style.badge}`}>
                {style.label}
              </span>
            </div>

            {/* Gauge Progress Bar with Threshold Markers */}
            <div className="relative pt-2 pb-6">
              <div className="w-full h-3.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 relative">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    status === "danger"
                      ? "bg-gradient-to-r from-amber-500 to-rose-500"
                      : status === "watch"
                      ? "bg-gradient-to-r from-emerald-500 to-amber-500"
                      : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.max(barWidth, 3)}%` }}
                />
              </div>

              {/* Threshold tick marks */}
              <div className="absolute left-[37.5%] top-6 -translate-x-1/2 text-center">
                <div className="w-0.5 h-2 bg-slate-700 mx-auto" />
                <span className="text-[10px] text-slate-400 font-mono">0.30% Safe</span>
              </div>
              <div className="absolute left-[56.25%] top-6 -translate-x-1/2 text-center">
                <div className="w-0.5 h-2 bg-amber-500/80 mx-auto" />
                <span className="text-[10px] text-amber-400 font-mono">0.45% Alert</span>
              </div>
              <div className="absolute left-[81.25%] top-6 -translate-x-1/2 text-center">
                <div className="w-0.5 h-2 bg-rose-500/80 mx-auto" />
                <span className="text-[10px] text-rose-400 font-mono">0.65% Hard Cap</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-xs text-slate-400">
        <div className="flex items-start space-x-2">
          <StatusIcon className={`w-4 h-4 ${style.text} flex-shrink-0 mt-0.5`} />
          <p className="leading-relaxed">
            {status === "danger"
              ? "Pre-threshold breach! Ratio is above 0.45%. Settlement review cycle can be triggered by acquiring banks (HDFC/ICICI)."
              : status === "watch"
              ? "Approaching warning threshold. Step-up auth friction active to protect merchant settlement limits."
              : "Dispute volume is healthy. Autonomous representments actively recovering contested capital."}
          </p>
        </div>
      </div>
    </div>
  );
};
