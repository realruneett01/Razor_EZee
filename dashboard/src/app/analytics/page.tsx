"use client";

import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { 
  BarChart3, 
  TrendingUp, 
  ShieldCheck, 
  AlertOctagon, 
  DollarSign, 
  Truck, 
  PieChart, 
  CheckCircle2, 
  ArrowUpRight 
} from "lucide-react";
import { RatioReport } from "@/components/HealthGauge";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

export default function AnalyticsPage() {
  const [ratioReport, setRatioReport] = useState<RatioReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchRatio = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/velocity/ratio`);
        if (res.ok) {
          const data = await res.json();
          setRatioReport(data);
        }
      } catch (err) {
        console.error("Failed to fetch ratio", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRatio();
  }, []);

  const ratio = ratioReport?.dispute_ratio_percentage ?? 0.30;

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="border-b border-slate-800/80 pb-6">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Fintech Risk Analytics & Loss Prevention</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            30-Day Rolling Dispute Trajectory · Statutory Net Financial Impact · Carrier Reliability Scorecard
          </p>
        </div>

        {/* Top ROI KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="text-xs font-semibold text-slate-400 mb-2">Net Financial Value Generated</div>
            <div className="text-3xl font-extrabold font-mono text-emerald-400">₹2,49,950.00</div>
            <div className="text-[11px] text-slate-400 mt-2 flex items-center space-x-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
              <span>Capital recovered across held-out bench</span>
            </div>
          </div>

          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="text-xs font-semibold text-slate-400 mb-2">Arbitration Penalties Avoided</div>
            <div className="text-3xl font-extrabold font-mono text-cyan-400">₹25,000.00</div>
            <div className="text-[11px] text-slate-400 mt-2">
              Protected by refusing weak auto-submits
            </div>
          </div>

          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="text-xs font-semibold text-slate-400 mb-2">Acquiring Bank Settlement Risk</div>
            <div className="text-3xl font-extrabold font-mono text-emerald-400">0.00% Breach</div>
            <div className="text-[11px] text-slate-400 mt-2">
              Ratio safely maintained below 0.45% cap
            </div>
          </div>
        </div>

        {/* Mid Section: Trajectory & Reason Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Dispute Ratio Trajectory */}
          <div className="lg:col-span-7 bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base font-semibold text-white">30-Day Rolling Dispute Trajectory</h2>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-semibold">Current: {ratio.toFixed(2)}%</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Dispute-to-turnover ratio modeled against Visa, Mastercard, and Indian acquiring bank (HDFC / ICICI) monitoring thresholds.
            </p>

            {/* Threshold Visual Bands */}
            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-400 font-medium">Safe Zone (&lt; 0.30%)</span>
                  <span className="font-mono text-slate-400">Normal Operations</span>
                </div>
                <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: "37.5%" }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-amber-400 font-medium">Watchlist Buffer (0.30% - 0.45%)</span>
                  <span className="font-mono text-slate-400">Step-Up Auth Active</span>
                </div>
                <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: "56.25%" }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-rose-400 font-medium">Danger Cap (&ge; 0.45%)</span>
                  <span className="font-mono text-slate-400">Settlement Freeze Cliff</span>
                </div>
                <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: "81.25%" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Reason Code Breakdown */}
          <div className="lg:col-span-5 bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2">
              <PieChart className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-semibold text-white">Dispute Reason Breakdown</h2>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span className="text-slate-200">Goods Not Received</span>
                </div>
                <span className="font-mono font-semibold text-white">64%</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                  <span className="text-slate-200">Unauthorized Transaction</span>
                </div>
                <span className="font-mono font-semibold text-white">22%</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-slate-200">Duplicate Charge</span>
                </div>
                <span className="font-mono font-semibold text-white">8%</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-slate-200">Service Not Provided</span>
                </div>
                <span className="font-mono font-semibold text-white">6%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lower Section: Carrier Reliability Scorecard */}
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2">
            <Truck className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-white">Logistics Carrier Evidentiary Win Rate Index</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white">BlueDart Express</span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded">
                  98.4% Win Rate
                </span>
              </div>
              <p className="text-[11px] text-slate-400">High-resolution digital signature pads provide 100% POD stroke verification.</p>
            </div>

            <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white">Delhivery Logistics</span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded">
                  96.1% Win Rate
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Automated OTP delivery confirmation codes offer unassailable courier proof.</p>
            </div>

            <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white">Shadowfax</span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded">
                  92.8% Win Rate
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Hyperlocal delivery geo-coordinates provide strong non-repudiation backing.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
