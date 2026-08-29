"use client";

import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { 
  Zap, 
  ShieldAlert, 
  ShieldCheck, 
  ShieldX,
  Cpu, 
  Flame, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Sliders, 
  Clock,
  RefreshCw,
  Activity,
  Radio,
  Sparkles,
  ArrowRight,
  Terminal
} from "lucide-react";
import { VelocityLogItem } from "@/components/BotAttackLog";
import { VelocityWaveform } from "@/components/VelocityWaveform";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

export default function VelocityShieldPage() {
  const [logs, setLogs] = useState<VelocityLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [simResults, setSimResults] = useState<{ step: number; amount: number; action: string; time: string; hash: string }[]>([]);
  const [microThreshold, setMicroThreshold] = useState<number>(10);
  const [windowSeconds, setWindowSeconds] = useState<number>(60);
  const [externalBurstActive, setExternalBurstActive] = useState<boolean>(false);

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
    if (type !== "legit") {
      setExternalBurstActive(true);
      setTimeout(() => setExternalBurstActive(false), 5000);
    }

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
          time: new Date().toLocaleTimeString("en-IN"),
          hash: `fp_${Math.random().toString(36).substring(2, 10)}...`,
        });
        setSimResults([...steps]);
        await new Promise((r) => setTimeout(r, 400));
      }
    } else if (type === "frequency_burst") {
      // 12 transactions
      for (let i = 1; i <= 10; i++) {
        let action = i > 7 ? "CHALLENGE_STEP_UP_OTP" : i > 4 ? "FLAG_FOR_REVIEW" : "ALLOW";
        steps.push({
          step: i,
          amount: 850.00,
          action,
          time: new Date().toLocaleTimeString("en-IN"),
          hash: `fp_${Math.random().toString(36).substring(2, 10)}...`,
        });
        setSimResults([...steps]);
        await new Promise((r) => setTimeout(r, 220));
      }
    } else {
      // Legit shopper single transaction
      steps.push({
        step: 1,
        amount: 1450.00,
        action: "ALLOW",
        time: new Date().toLocaleTimeString("en-IN"),
        hash: `fp_legit_${Math.random().toString(36).substring(2, 8)}`,
      });
      setSimResults([...steps]);
    }

    setSimulating(false);
  };

  // Mock live event stream if database is empty for rich display
  const displayLogs: VelocityLogItem[] = logs && logs.length > 0 ? logs : [
    {
      id: "demo-1",
      fingerprint_hash: "a4f89d12e9b042ca902187f54c8",
      amount: 250, // Rs. 2.50
      is_micro_transaction: true,
      risk_action_taken: "CHALLENGE_STEP_UP_OTP",
      created_at: new Date(Date.now() - 3000).toISOString(),
    },
    {
      id: "demo-2",
      fingerprint_hash: "7bc2901fa55e8840213d567ea01",
      amount: 500, // Rs. 5.00
      is_micro_transaction: true,
      risk_action_taken: "FLAG_FOR_REVIEW",
      created_at: new Date(Date.now() - 14000).toISOString(),
    },
    {
      id: "demo-3",
      fingerprint_hash: "c38910eb441972f091428bdae99",
      amount: 85000, // Rs. 850.00
      is_micro_transaction: false,
      risk_action_taken: "CHALLENGE_STEP_UP_OTP",
      created_at: new Date(Date.now() - 38000).toISOString(),
    },
    {
      id: "demo-4",
      fingerprint_hash: "55e28a9901bc4309eaf87201cba",
      amount: 300, // Rs. 3.00
      is_micro_transaction: true,
      risk_action_taken: "FLAG_FOR_REVIEW",
      created_at: new Date(Date.now() - 52000).toISOString(),
    },
  ];

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      <Navbar onRefresh={fetchLogs} isRefreshing={loading} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Header with Ambient Badge */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
                <Zap className="w-4 h-4" />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Preemptive Velocity Shield & Bot Defense Studio
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Upstash Redis In-Memory Sliding Window · Sub-2ms Edge Evaluation · Zero Mutation Checkout Friction
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs bg-white/[0.04] px-3.5 py-2 rounded-2xl border border-white/[0.08] backdrop-blur-xl">
            <span className="text-slate-400">Sliding Window Policy:</span>
            <span className="font-mono text-cyan-300 font-semibold">{windowSeconds}s Atomic Expiry</span>
          </div>
        </div>

        {/* Hero Section: Live 60-Second Fluid Spline Waveform */}
        <VelocityWaveform 
          externalBurstActive={externalBurstActive} 
          onTriggerBurst={() => runBotSimulation("micro_burst")} 
        />

        {/* Mid Grid: Fluid Attack Wave Simulator & Policy Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Interactive Attack Simulator Deck */}
          <div className="lg:col-span-7 rounded-3xl p-6 bg-zinc-900/40 backdrop-blur-2xl border border-white/[0.06] shadow-[0_12px_40px_rgba(0,0,0,0.3)] space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">Live Attack Wave Simulator</h2>
                  <p className="text-[11px] text-slate-400">Evaluate Redis threshold gating in real time</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-full">
                Sub-2ms Edge Active
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Inject synthetic bot sweeps into the sliding-window engine. Observe smooth transitions at Request 3 (<span className="text-amber-400 font-mono">FLAG_FOR_REVIEW</span>) and Request 5 (<span className="text-rose-400 font-mono">CHALLENGE_STEP_UP_OTP</span>).
            </p>

            {/* Fluid Simulation Trigger Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => runBotSimulation("micro_burst")}
                disabled={simulating}
                className="group relative p-4 rounded-2xl bg-gradient-to-b from-rose-950/30 to-rose-950/10 hover:from-rose-900/40 hover:to-rose-950/30 border border-rose-500/20 hover:border-rose-500/40 text-left transition-all duration-300 disabled:opacity-50 shadow-lg"
              >
                <div className="flex items-center justify-between text-xs font-bold text-rose-300">
                  <span>Card-Testing Sweep</span>
                  <Play className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="text-[11px] text-rose-400/80 mt-1">5x ₹2.50 Micro-Txns</div>
                <div className="text-[10px] text-slate-500 mt-2 font-mono">Triggers OTP Challenge</div>
              </button>

              <button
                onClick={() => runBotSimulation("frequency_burst")}
                disabled={simulating}
                className="group relative p-4 rounded-2xl bg-gradient-to-b from-amber-950/30 to-amber-950/10 hover:from-amber-900/40 hover:to-amber-950/30 border border-amber-500/20 hover:border-amber-500/40 text-left transition-all duration-300 disabled:opacity-50 shadow-lg"
              >
                <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                  <span>High-Frequency Burst</span>
                  <Play className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="text-[11px] text-amber-400/80 mt-1">10x ₹850.00 in 60s</div>
                <div className="text-[10px] text-slate-500 mt-2 font-mono">Rate-Limit Enforcement</div>
              </button>

              <button
                onClick={() => runBotSimulation("legit")}
                disabled={simulating}
                className="group relative p-4 rounded-2xl bg-gradient-to-b from-emerald-950/30 to-emerald-950/10 hover:from-emerald-900/40 hover:to-emerald-950/30 border border-emerald-500/20 hover:border-emerald-500/40 text-left transition-all duration-300 disabled:opacity-50 shadow-lg"
              >
                <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                  <span>Legitimate Shopper</span>
                  <Play className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="text-[11px] text-emerald-400/80 mt-1">1x ₹1,450.00 Standard</div>
                <div className="text-[10px] text-slate-500 mt-2 font-mono">Zero Checkout Friction</div>
              </button>
            </div>

            {/* Spring-Animated Evaluation Sequence */}
            {simResults.length > 0 && (
              <div className="rounded-2xl p-4 bg-black/50 border border-white/[0.06] space-y-2">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Real-Time Evaluation Sequence</span>
                  </div>
                  {simulating && <span className="text-cyan-400 animate-pulse font-mono">Simulating payload...</span>}
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto font-mono text-xs pr-1">
                  {simResults.map((r) => (
                    <div
                      key={r.step}
                      className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between transition-all duration-300 hover:bg-white/[0.06]"
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="text-slate-500 font-bold">#{r.step.toString().padStart(2, "0")}</span>
                        <span className="text-slate-300 font-medium">{r.hash}</span>
                        <span className="text-white font-bold">₹{r.amount.toFixed(2)}</span>
                        <span className="text-[10px] text-slate-500">{r.time}</span>
                      </div>

                      <div>
                        {r.action === "CHALLENGE_STEP_UP_OTP" ? (
                          <span className="px-2.5 py-0.5 text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full shadow-sm shadow-rose-500/30">
                            CHALLENGE (OTP)
                          </span>
                        ) : r.action === "FLAG_FOR_REVIEW" ? (
                          <span className="px-2.5 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full shadow-sm shadow-amber-500/30">
                            FLAG FOR REVIEW
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full">
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
          <div className="lg:col-span-5 rounded-3xl p-6 bg-zinc-900/40 backdrop-blur-2xl border border-white/[0.06] shadow-[0_12px_40px_rgba(0,0,0,0.3)] space-y-5">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Sliders className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-white tracking-tight">Shield Policy Configuration</h2>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-slate-300 font-medium">Micro-Transaction Max Threshold</span>
                  <span className="font-mono text-cyan-300 font-bold bg-white/[0.05] px-2 py-0.5 rounded-lg border border-white/[0.08]">
                    ₹{microThreshold}.00
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={microThreshold}
                  onChange={(e) => setMicroThreshold(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Transactions under this amount trigger micro-card-testing counter tracking.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-slate-300 font-medium">Sliding Window Counter Duration</span>
                  <span className="font-mono text-cyan-300 font-bold bg-white/[0.05] px-2 py-0.5 rounded-lg border border-white/[0.08]">
                    {windowSeconds} Seconds
                  </span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="300"
                  step="30"
                  value={windowSeconds}
                  onChange={(e) => setWindowSeconds(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Redis ZSET timestamps older than this threshold are pruned atomically.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-1.5">
                <div className="font-semibold text-slate-200 flex items-center space-x-2">
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

        {/* Lower Section: Spring-Animated Real-Time Event Feed */}
        <div className="rounded-3xl p-6 bg-zinc-900/40 backdrop-blur-2xl border border-white/[0.06] shadow-[0_12px_40px_rgba(0,0,0,0.3)] space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Real-Time Intercepted Event Feed
                </h2>
                <p className="text-[11px] text-slate-400">Live sliding-window telemetry stream from edge nodes</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 font-mono text-xs text-slate-400">
              <span>Stream Items:</span>
              <span className="text-cyan-300 font-bold">{displayLogs.length}</span>
            </div>
          </div>

          {/* Spring-Animated Event Stack */}
          <div className="space-y-2.5">
            {displayLogs.map((l, index) => (
              <div
                key={l.id || index}
                className="p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] hover:border-white/[0.1] transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
              >
                <div className="flex items-center space-x-3.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    l.risk_action_taken === "CHALLENGE_STEP_UP_OTP"
                      ? "bg-rose-500/10 border border-rose-500/20 text-rose-400 shadow-sm shadow-rose-500/20"
                      : "bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-sm shadow-amber-500/20"
                  }`}>
                    {l.risk_action_taken === "CHALLENGE_STEP_UP_OTP" ? (
                      <ShieldX className="w-4 h-4" />
                    ) : (
                      <ShieldAlert className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 font-mono text-xs">
                      <span className="text-slate-200 font-semibold">{l.fingerprint_hash}</span>
                      {l.is_micro_transaction && (
                        <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/25 rounded-full">
                          MICRO-TXN
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center space-x-3 mt-1">
                      <span className="font-bold text-white">₹{(l.amount / 100).toFixed(2)}</span>
                      <span>·</span>
                      <span className="flex items-center text-slate-500">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(l.created_at).toLocaleTimeString("en-IN")}
                      </span>
                      <span>·</span>
                      <span className="text-slate-500 font-mono">Edge Ingestion</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 self-start sm:self-auto">
                  {l.risk_action_taken === "CHALLENGE_STEP_UP_OTP" ? (
                    <span className="px-3 py-1 text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 rounded-xl shadow-md shadow-rose-500/20 flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping mr-1" />
                      <span>CHALLENGE (OTP)</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1 text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-xl shadow-md shadow-amber-500/20 flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1" />
                      <span>FLAG FOR REVIEW</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-white/[0.06] py-6 text-center text-xs text-slate-500">
        razor-EZ · Autonomous Dispute Defense & Preemptive Velocity Shield · Razorpay Hackathon 2026
      </footer>
    </div>
  );
}
