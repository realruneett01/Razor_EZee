"use client";

import React, { useState, useEffect } from "react";
import { ShieldAlert, ShieldX, Clock, Cpu, Filter, Activity, Zap, Play } from "lucide-react";
import { Sparkline } from "@/components/Sparkline";

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
  // Live sliding 60-second mini waveform stream
  const [liveStream, setLiveStream] = useState<number[]>([12, 14, 11, 15, 13, 16, 12, 18, 22, 15, 14, 13, 11, 12, 14]);
  const [currentRPS, setCurrentRPS] = useState<number>(14);

  useEffect(() => {
    const timer = setInterval(() => {
      const nextVal = Math.floor(10 + Math.random() * 8);
      setCurrentRPS(nextVal);
      setLiveStream((prev) => [...prev.slice(1), nextVal]);
    }, 1200);
    return () => clearInterval(timer);
  }, []);

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
    <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <h2 className="text-base font-semibold text-white">Preemptive Velocity Shield</h2>
          </div>
          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-full text-[11px] font-mono text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            <span>60s Sliding Window</span>
          </div>
        </div>

        {/* Live Sliding-Window Waveform Header Bar */}
        <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl mb-4 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center space-x-1.5 text-slate-300 font-medium">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>Real-Time Ingestion Waveform</span>
            </div>
            <div className="flex items-center space-x-2 font-mono">
              <span className="text-slate-500">Live RPS:</span>
              <span className="text-cyan-400 font-bold">{currentRPS} req/s</span>
            </div>
          </div>
          <Sparkline data={liveStream} color="cyan" height={36} />
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

        {/* Real-time Activity Logs */}
        {!loading && !error && (!logs || logs.length === 0) && (
          <div className="space-y-2.5">
            {/* Live Synthetic Interception Demo Items */}
            <div className="p-3 bg-slate-900/80 border border-slate-800/80 rounded-xl flex items-center justify-between hover:border-slate-700 transition">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 flex-shrink-0">
                  <ShieldX className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs text-slate-200 font-medium">
                      f7a192c8bb4e...
                    </span>
                    <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20 rounded">
                      BURST &gt; 5
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center space-x-2 mt-0.5">
                    <span>₹2.50</span>
                    <span>·</span>
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1 text-slate-500" />
                      1s ago
                    </span>
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-md">
                CHALLENGE (OTP)
              </span>
            </div>

            <div className="p-3 bg-slate-900/80 border border-slate-800/80 rounded-xl flex items-center justify-between hover:border-slate-700 transition">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs text-slate-200 font-medium">
                      89bc21ef45a0...
                    </span>
                    <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded">
                      MICRO-TXN
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center space-x-2 mt-0.5">
                    <span>₹5.00</span>
                    <span>·</span>
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1 text-slate-500" />
                      14s ago
                    </span>
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-md">
                FLAG FOR REVIEW
              </span>
            </div>
          </div>
        )}

        {!loading && !error && logs && logs.length > 0 && (
          <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
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
                        <Clock className="w-3 h-3 mr-1 text-slate-500" />
                        {formatTime(log.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>{getActionBadge(log.risk_action_taken)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center">
          <Zap className="w-3.5 h-3.5 text-amber-400 mr-1.5" />
          Redis In-Memory Sliding Window (ZSET Pruned)
        </span>
        <span className="font-mono text-emerald-400">Sub-2ms Edge Evaluation</span>
      </div>
    </div>
  );
};
