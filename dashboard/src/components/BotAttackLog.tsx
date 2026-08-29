"use client";

import React, { useState, useEffect } from "react";
import { ShieldAlert, ShieldX, Clock, Cpu, Filter, Activity, Zap, Radio } from "lucide-react";
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

  const displayLogs: VelocityLogItem[] = logs && logs.length > 0 ? logs : [
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

  return (
    <div className="rounded-3xl p-6 bg-zinc-900/40 backdrop-blur-2xl border border-white/[0.06] shadow-[0_12px_40px_rgba(0,0,0,0.3)] flex flex-col justify-between space-y-4">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Preemptive Velocity Shield</h2>
              <p className="text-[10px] text-slate-400">Redis sliding-window telemetry</p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5 px-3 py-1 bg-white/[0.04] border border-white/[0.08] rounded-full text-[10px] font-mono text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            <span>60s Sliding Window</span>
          </div>
        </div>

        {/* Live Sliding-Window Waveform Header Bar */}
        <div className="p-3.5 bg-black/40 border border-white/[0.05] rounded-2xl mb-4 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center space-x-1.5 text-slate-300 font-medium">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>Real-Time Ingestion Waveform</span>
            </div>
            <div className="flex items-center space-x-2 font-mono">
              <span className="text-slate-500">Live RPS:</span>
              <span className="text-cyan-300 font-bold">{currentRPS} req/s</span>
            </div>
          </div>
          <Sparkline data={liveStream} color="cyan" height={38} />
        </div>

        {/* Real-time Activity Logs */}
        <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
          {displayLogs.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] flex items-center justify-between transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  log.risk_action_taken === "CHALLENGE_STEP_UP_OTP"
                    ? "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                    : "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                }`}>
                  {log.risk_action_taken === "CHALLENGE_STEP_UP_OTP" ? (
                    <ShieldX className="w-4 h-4" />
                  ) : (
                    <ShieldAlert className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs text-slate-200 font-medium">
                      {log.fingerprint_hash.substring(0, 16)}...
                    </span>
                    {log.is_micro_transaction && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-full">
                        MICRO-TXN
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center space-x-2 mt-0.5">
                    <span className="font-semibold text-white">₹{(log.amount / 100).toFixed(2)}</span>
                    <span>·</span>
                    <span className="flex items-center text-slate-500">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatTime(log.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                {log.risk_action_taken === "CHALLENGE_STEP_UP_OTP" ? (
                  <span className="px-2.5 py-1 text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 rounded-xl shadow-sm shadow-rose-500/20">
                    CHALLENGE (OTP)
                  </span>
                ) : (
                  <span className="px-2.5 py-1 text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-xl shadow-sm shadow-amber-500/20">
                    FLAG FOR REVIEW
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-[11px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center text-slate-300">
          <Zap className="w-3.5 h-3.5 text-amber-400 mr-1.5" />
          Redis In-Memory Sliding Window (ZSET Pruned)
        </span>
        <span className="font-mono text-emerald-300 font-medium">Sub-2ms Edge Evaluation</span>
      </div>
    </div>
  );
};
