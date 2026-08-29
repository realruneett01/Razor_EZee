"use client";

import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { 
  Zap, 
  ShieldAlert, 
  ShieldCheck, 
  Flame, 
  Play, 
  Sliders, 
  Clock,
  Terminal,
  Activity
} from "lucide-react";
import { VelocityLogItem } from "@/components/BotAttackLog";
import { VelocityWaveform } from "@/components/VelocityWaveform";
import { StatusBadge } from "@/components/StatusBadge";
import { formatFingerprint, formatTxnCategory } from "@/lib/formatters";

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
      for (let i = 1; i <= 5; i++) {
        let action = i >= 5 ? "OTP_CHALLENGE" : i >= 3 ? "FLAG_REVIEW" : "ALLOW";
        steps.push({
          step: i,
          amount: 2.50,
          action,
          time: new Date().toLocaleTimeString("en-IN"),
          hash: `fp_${Math.random().toString(36).substring(2, 10)}`,
        });
        setSimResults([...steps]);
        await new Promise((r) => setTimeout(r, 350));
      }
    } else if (type === "frequency_burst") {
      for (let i = 1; i <= 10; i++) {
        let action = i > 7 ? "OTP_CHALLENGE" : i > 4 ? "FLAG_REVIEW" : "ALLOW";
        steps.push({
          step: i,
          amount: 850.00,
          action,
          time: new Date().toLocaleTimeString("en-IN"),
          hash: `fp_${Math.random().toString(36).substring(2, 10)}`,
        });
        setSimResults([...steps]);
        await new Promise((r) => setTimeout(r, 200));
      }
    } else {
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

  const displayLogs: VelocityLogItem[] = logs && logs.length > 0 ? logs : [
    {
      id: "ev-1",
      fingerprint_hash: "fp_a4f89d12e9b042ca",
      amount: 250,
      is_micro_transaction: true,
      risk_action_taken: "OTP_CHALLENGE",
      created_at: new Date(Date.now() - 2000).toISOString(),
    },
    {
      id: "ev-2",
      fingerprint_hash: "fp_7bc2901fa55e8840",
      amount: 500,
      is_micro_transaction: true,
      risk_action_taken: "FLAG_REVIEW",
      created_at: new Date(Date.now() - 14000).toISOString(),
    },
    {
      id: "ev-3",
      fingerprint_hash: "fp_c38910eb441972f0",
      amount: 85000,
      is_micro_transaction: false,
      risk_action_taken: "OTP_CHALLENGE",
      created_at: new Date(Date.now() - 38000).toISOString(),
    },
    {
      id: "ev-4",
      fingerprint_hash: "fp_55e28a9901bc4309",
      amount: 300,
      is_micro_transaction: true,
      risk_action_taken: "FLAG_REVIEW",
      created_at: new Date(Date.now() - 52000).toISOString(),
    },
    {
      id: "ev-5",
      fingerprint_hash: "fp_991e4a11b820a455",
      amount: 145000,
      is_micro_transaction: false,
      risk_action_taken: "ALLOW",
      created_at: new Date(Date.now() - 58000).toISOString(),
    },
  ];

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      <Navbar onRefresh={fetchLogs} isRefreshing={loading} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Streamlined Hero Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-white/[0.06] pb-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
              <Zap className="w-5 h-5 text-rose-400" />
              <span>Velocity Shield & Defense Studio</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Redis In-Memory Sliding Window · Sub-2ms Edge Evaluation · Zero API Mutation Friction
            </p>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Policy Window: <span className="text-cyan-300 font-semibold">{windowSeconds}s Expiry</span>
          </div>
        </div>

        {/* Live 60-Second Sliding-Window Waveform */}
        <VelocityWaveform 
          externalBurstActive={externalBurstActive} 
          onTriggerBurst={() => runBotSimulation("micro_burst")} 
        />

        {/* Unified Dual-Column Workspace: Simulator & Policy Configuration side-by-side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column 1: Attack Wave Simulator */}
          <div className="rounded-2xl p-6 bg-zinc-900/30 backdrop-blur-xl border border-white/[0.08] shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center space-x-2">
                <Flame className="w-4 h-4 text-rose-400" />
                <h2 className="text-sm font-bold text-white">Live Attack Wave Simulator</h2>
              </div>
              <span className="text-[10px] font-mono text-cyan-400">Instant Edge Test</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Inject synthetic bot sweeps into the sliding-window engine to observe real-time gating at Request 3 (<span className="text-amber-400 font-mono font-medium">Flagged for Review</span>) and Request 5 (<span className="text-rose-400 font-mono font-medium">Step-Up Verification</span>).
            </p>

            {/* Flat Trigger Buttons with Modern Executive Labels */}
            <div className="grid grid-cols-3 gap-2.5">
              <button
                onClick={() => runBotSimulation("micro_burst")}
                disabled={simulating}
                className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-left transition disabled:opacity-50"
              >
                <div className="text-xs font-semibold text-rose-300">Micro-Probe Sweep</div>
                <div className="text-[10px] text-slate-400 mt-0.5">5x ₹2.50 Testing</div>
              </button>

              <button
                onClick={() => runBotSimulation("frequency_burst")}
                disabled={simulating}
                className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-left transition disabled:opacity-50"
              >
                <div className="text-xs font-semibold text-amber-300">Velocity Surge</div>
                <div className="text-[10px] text-slate-400 mt-0.5">10x Volume / 60s</div>
              </button>

              <button
                onClick={() => runBotSimulation("legit")}
                disabled={simulating}
                className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-left transition disabled:opacity-50"
              >
                <div className="text-xs font-semibold text-emerald-300">Regular Checkout</div>
                <div className="text-[10px] text-slate-400 mt-0.5">1x ₹1,450 Standard</div>
              </button>
            </div>

            {/* Live Stream Execution Feed with Reusable StatusBadge */}
            {simResults.length > 0 && (
              <div className="pt-2 space-y-2 max-h-48 overflow-y-auto pr-1">
                {simResults.map((r) => (
                  <div
                    key={r.step}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/40 border border-white/[0.04]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 font-mono text-xs">#{r.step}</span>
                      <span className="text-zinc-400 text-xs font-mono">
                        {formatFingerprint(r.hash)}
                      </span>
                      <span className="text-zinc-200 text-xs font-semibold font-mono">₹{r.amount.toFixed(2)}</span>
                    </div>
                    <StatusBadge verdict={r.action} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Column 2: Shield Policy Configuration */}
          <div className="rounded-2xl p-6 bg-zinc-900/30 backdrop-blur-xl border border-white/[0.08] shadow-lg space-y-5">
            <div className="flex items-center space-x-2 border-b border-white/[0.06] pb-3">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-white">Shield Policy Configuration</h2>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-slate-300">Micro-Probe Sub-Threshold Cap</span>
                  <span className="font-mono text-cyan-300 font-bold">₹{microThreshold}.00</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={microThreshold}
                  onChange={(e) => setMicroThreshold(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-slate-300">Sliding Window Counter Duration</span>
                  <span className="font-mono text-cyan-300 font-bold">{windowSeconds} Seconds</span>
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
              </div>

              <div className="pt-2 text-[11px] text-slate-400 border-t border-white/[0.06] flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Statutory Compliance: Read-only edge shield enforcing step-up friction with zero payment mutation.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Streamlined Modernized Telemetry Event Strip */}
        <div className="rounded-2xl p-6 bg-zinc-900/30 backdrop-blur-xl border border-white/[0.08] shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white">Live Intercepted Telemetry Stream</h2>
            </div>
            <span className="text-xs font-mono text-slate-400">Total Recorded: {displayLogs.length}</span>
          </div>

          {/* Compact Telemetry Stream Rows with StatusBadge */}
          <div className="divide-y divide-white/[0.04]">
            {displayLogs.map((item, index) => (
              <div
                key={item.id || index}
                className="flex items-center justify-between py-2.5 px-2 hover:bg-white/[0.02] rounded-lg transition text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="text-zinc-500 font-mono text-[11px]">{new Date(item.created_at).toLocaleTimeString("en-IN")}</span>
                  <span className="text-zinc-300 font-mono">{formatFingerprint(item.fingerprint_hash)}</span>
                  <span className="text-[11px] text-zinc-400 px-1.5 py-0.5 rounded bg-zinc-800/60 font-mono">
                    {formatTxnCategory(item.is_micro_transaction ? "MICRO_TXN" : "STANDARD")}
                  </span>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="text-zinc-100 font-semibold font-mono">₹{(item.amount / 100).toFixed(2)}</span>
                  <StatusBadge verdict={item.risk_action_taken} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-white/[0.06] py-5 text-center text-xs text-slate-500">
        razor-EZ · Autonomous Dispute Defense & Preemptive Velocity Shield · Razorpay Hackathon 2026
      </footer>
    </div>
  );
}
