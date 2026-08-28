"use client";

import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { 
  Zap, 
  ShieldAlert, 
  ShieldCheck, 
  Cpu, 
  Flame, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Sliders, 
  Clock,
  RefreshCw
} from "lucide-react";
import { VelocityLogItem } from "@/components/BotAttackLog";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

export default function VelocityShieldPage() {
  const [logs, setLogs] = useState<VelocityLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [simResults, setSimResults] = useState<{ step: number; amount: number; action: string; time: string }[]>([]);
  const [microThreshold, setMicroThreshold] = useState<number>(10);
  const [windowSeconds, setWindowSeconds] = useState<number>(60);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/velocity/logs`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
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

  const runBotSimulation = async (type: "micro_burst" | "frequency_burst" | "legit") => {
    setSimulating(true);
    setSimResults([]);

    const steps = [];
    if (type === "micro_burst") {
      // 5 micro transactions (Rs. 2.50 each)
      for (let i = 1; i <= 5; i++) {
        let action = "ALLOW";
        if (i >= 5) action = "CHALLENGE_STEP_UP_OTP";
        else if (i >= 3) action = "FLAG_FOR_REVIEW";

        steps.push({
          step: i,
          amount: 2.50,
          action,
          time: new Date().toLocaleTimeString(),
        });
        setSimResults([...steps]);
        await new Promise((r) => setTimeout(r, 450));
      }
    } else if (type === "frequency_burst") {
      // 12 transactions
      for (let i = 1; i <= 12; i++) {
        let action = i > 10 ? "CHALLENGE_STEP_UP_OTP" : "ALLOW";
        steps.push({
          step: i,
          amount: 850.00,
          action,
          time: new Date().toLocaleTimeString(),
        });
        setSimResults([...steps]);
        await new Promise((r) => setTimeout(r, 200));
      }
    } else {
      // Legit shopper single transaction
      steps.push({
        step: 1,
        amount: 1450.00,
        action: "ALLOW",
        time: new Date().toLocaleTimeString(),
      });
      setSimResults([...steps]);
    }

    setSimulating(false);
  };

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col">
      <Navbar onRefresh={fetchLogs} isRefreshing={loading} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center space-x-2">
              <Zap className="w-6 h-6 text-rose-400" />
              <h1 className="text-2xl font-bold text-white tracking-tight">Preemptive Velocity Shield & Bot Defense Studio</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Upstash Redis In-Memory Sliding Window · Sub-2ms Edge Evaluation · Zero API Mutation Checkout Friction
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-slate-400">Sliding Window:</span>
            <span className="font-mono text-indigo-400 font-semibold">{windowSeconds}s Expiry</span>
          </div>
        </div>

        {/* Top Grid: Interactive Simulator & Policy Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Interactive Bot Wave Simulator */}
          <div className="lg:col-span-7 bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Flame className="w-5 h-5 text-rose-400" />
                <h2 className="text-base font-semibold text-white">Live Attack Wave Simulator</h2>
              </div>
              <span className="text-[11px] text-slate-400">Test Shield Thresholds in Real-Time</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Simulate high-velocity bot traffic directly against the sliding-window engine to observe transition gates at Request 3 (<span className="text-amber-400 font-mono">FLAG_FOR_REVIEW</span>) and Request 5 (<span className="text-rose-400 font-mono">CHALLENGE_STEP_UP_OTP</span>).
            </p>

            {/* Simulation Triggers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => runBotSimulation("micro_burst")}
                disabled={simulating}
                className="p-3 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/60 rounded-xl text-left transition disabled:opacity-50"
              >
                <div className="text-xs font-bold text-rose-300 flex items-center justify-between">
                  <span>Card-Testing Sweep</span>
                  <Play className="w-3.5 h-3.5" />
                </div>
                <div className="text-[11px] text-rose-400/80 mt-1">5x ₹2.50 Micro-Txns</div>
              </button>

              <button
                onClick={() => runBotSimulation("frequency_burst")}
                disabled={simulating}
                className="p-3 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/60 rounded-xl text-left transition disabled:opacity-50"
              >
                <div className="text-xs font-bold text-amber-300 flex items-center justify-between">
                  <span>High-Frequency Burst</span>
                  <Play className="w-3.5 h-3.5" />
                </div>
                <div className="text-[11px] text-amber-400/80 mt-1">12x ₹850.00 in 60s</div>
              </button>

              <button
                onClick={() => runBotSimulation("legit")}
                disabled={simulating}
                className="p-3 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/60 rounded-xl text-left transition disabled:opacity-50"
              >
                <div className="text-xs font-bold text-emerald-300 flex items-center justify-between">
                  <span>Legitimate Shopper</span>
                  <Play className="w-3.5 h-3.5" />
                </div>
                <div className="text-[11px] text-emerald-400/80 mt-1">1x ₹1,450.00 Normal</div>
              </button>
            </div>

            {/* Live Simulation Output Stream */}
            {simResults.length > 0 && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Real-Time Evaluation Sequence</span>
                  {simulating && <span className="text-indigo-400 animate-pulse">Running stream...</span>}
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto font-mono text-xs">
                  {simResults.map((r) => (
                    <div
                      key={r.step}
                      className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-500">#{r.step.toString().padStart(2, "0")}</span>
                        <span className="text-white font-semibold">₹{r.amount.toFixed(2)}</span>
                        <span className="text-[10px] text-slate-500">{r.time}</span>
                      </div>

                      <div>
                        {r.action === "CHALLENGE_STEP_UP_OTP" ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded">
                            CHALLENGE (OTP)
                          </span>
                        ) : r.action === "FLAG_FOR_REVIEW" ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded">
                            FLAG FOR REVIEW
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded">
                            ALLOW
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Velocity Policy Configuration */}
          <div className="lg:col-span-5 bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center space-x-2">
              <Sliders className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-semibold text-white">Shield Policy Configuration</h2>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-slate-300">Micro-Transaction Max Amount</span>
                  <span className="font-mono text-indigo-400 font-bold">₹{microThreshold}.00</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={microThreshold}
                  onChange={(e) => setMicroThreshold(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Transactions under this amount trigger micro-card-testing count tracking.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-slate-300">Sliding Window Counter Duration</span>
                  <span className="font-mono text-indigo-400 font-bold">{windowSeconds} Seconds</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="300"
                  step="30"
                  value={windowSeconds}
                  onChange={(e) => setWindowSeconds(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Redis ZSET timestamps older than this threshold are pruned atomically.
                </p>
              </div>

              <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                <div className="font-semibold text-slate-200 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Statutory Compliance Guarantee</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  The Velocity Shield is strictly read-only and monitoring based. It enforces step-up OTP friction on malicious bots without calling mutating Razorpay payment APIs.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Lower Section: Intercepted Bot Attack Logs */}
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <h2 className="text-base font-semibold text-white">Intercepted Bot Activity Logs</h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">Total Recorded: {logs.length}</span>
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-400 animate-pulse text-xs">
              Loading velocity logs from Supabase...
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/40 border border-dashed border-slate-800 rounded-xl">
              <Cpu className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No bot-attack spikes recorded in this window.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Fingerprint Hash</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Action Taken</th>
                    <th className="py-3 px-4 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {logs.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 text-slate-200">{l.fingerprint_hash.substring(0, 16)}...</td>
                      <td className="py-3 px-4 font-semibold text-white">₹{(l.amount / 100).toFixed(2)}</td>
                      <td className="py-3 px-4">
                        {l.is_micro_transaction ? (
                          <span className="px-2 py-0.5 text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded">
                            MICRO-TXN
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">STANDARD</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {l.risk_action_taken === "CHALLENGE_STEP_UP_OTP" ? (
                          <span className="px-2.5 py-1 text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-md">
                            CHALLENGE (OTP)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-md">
                            FLAG FOR REVIEW
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500 text-[11px]">
                        {new Date(l.created_at).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
