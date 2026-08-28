import React from "react";
import { ShieldAlert, ShieldX, Clock, Cpu, Filter } from "lucide-react";

export interface VelocityLogItem {
  id: string;
  fingerprint_hash: string;
  amount: number; // paise
  is_micro_transaction: boolean;
  risk_action_taken: string;
  created_at: string;
}

interface BotAttackLogProps {
  logs: VelocityLogItem[] | null;
  loading: boolean;
  error: string | null;
}

export const BotAttackLog: React.FC<BotAttackLogProps> = ({ logs, loading, error }) => {
  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return iso;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "CHALLENGE_STEP_UP_OTP":
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-md">
            CHALLENGE (OTP)
          </span>
        );
      case "FLAG_FOR_REVIEW":
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-md">
            FLAG FOR REVIEW
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700 rounded-md">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <h2 className="text-base font-semibold text-white">Preemptive Velocity Shield</h2>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Upstash Sliding Window</span>
        </div>

        {loading && (
          <div className="py-8 text-center text-slate-400 animate-pulse text-xs">
            Polling intercepted bot activities...
          </div>
        )}

        {error && !loading && (
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 text-xs">
            Velocity stream currently offline.
          </div>
        )}

        {!loading && !error && logs && logs.length === 0 && (
          <div className="py-10 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
            <Cpu className="w-7 h-7 text-slate-600 mx-auto mb-2" />
            <h4 className="text-xs font-medium text-slate-300">No bot-attack spikes active</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Micro-transaction card-testing bursts will be challenged and logged here.
            </p>
          </div>
        )}

        {!loading && !error && logs && logs.length > 0 && (
          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-slate-900/80 border border-slate-800/80 rounded-xl flex items-center justify-between hover:border-slate-700 transition"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 flex-shrink-0">
                    <ShieldX className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs text-slate-200 font-medium">
                        {log.fingerprint_hash.substring(0, 14)}...
                      </span>
                      {log.is_micro_transaction && (
                        <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded">
                          MICRO-TXN
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center space-x-2 mt-0.5">
                      <span>₹{(log.amount / 100).toFixed(2)}</span>
                      <span>·</span>
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-0.5" />
                        {formatTime(log.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  {getActionBadge(log.risk_action_taken)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
        <span>Gating: Step-up OTP Friction</span>
        <span>Window: 60s Sliding Counter</span>
      </div>
    </div>
  );
};
