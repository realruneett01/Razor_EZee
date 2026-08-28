"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { DisputeFeed, DisputeItem } from "@/components/DisputeFeed";
import { HealthGauge, RatioReport } from "@/components/HealthGauge";
import { BotAttackLog, VelocityLogItem } from "@/components/BotAttackLog";
import { ShieldCheck, Zap, TrendingUp, AlertTriangle } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

export default function DashboardPage() {
  const [disputes, setDisputes] = useState<DisputeItem[] | null>(null);
  const [ratioReport, setRatioReport] = useState<RatioReport | null>(null);
  const [velocityLogs, setVelocityLogs] = useState<VelocityLogItem[] | null>(null);

  const [loadingDisputes, setLoadingDisputes] = useState<boolean>(true);
  const [loadingRatio, setLoadingRatio] = useState<boolean>(true);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(true);

  const [errorDisputes, setErrorDisputes] = useState<string | null>(null);
  const [errorRatio, setErrorRatio] = useState<string | null>(null);
  const [errorLogs, setErrorLogs] = useState<string | null>(null);

  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchDisputes = async () => {
    try {
      setLoadingDisputes(true);
      setErrorDisputes(null);
      const res = await fetch(`${API_BASE_URL}/disputes`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDisputes(data);
    } catch (err: any) {
      setErrorDisputes(err.message || "Failed to fetch disputes");
      setDisputes(null);
    } finally {
      setLoadingDisputes(false);
    }
  };

  const fetchRatio = async () => {
    try {
      setLoadingRatio(true);
      setErrorRatio(null);
      const res = await fetch(`${API_BASE_URL}/velocity/ratio`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRatioReport(data);
    } catch (err: any) {
      setErrorRatio(err.message || "Failed to fetch ratio");
      setRatioReport(null);
    } finally {
      setLoadingRatio(false);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      setErrorLogs(null);
      const res = await fetch(`${API_BASE_URL}/velocity/logs`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setVelocityLogs(data);
    } catch (err: any) {
      setErrorLogs(err.message || "Failed to fetch velocity logs");
      setVelocityLogs(null);
    } finally {
      setLoadingLogs(false);
    }
  };

  const loadAllData = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchDisputes(), fetchRatio(), fetchLogs()]);
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Derived metrics from live data
  const totalDisputesCount = disputes ? disputes.length : 0;
  const autoSubmittedCount = disputes ? disputes.filter((d) => d.auto_submitted).length : 0;
  const autoSubmitRate = totalDisputesCount > 0 ? (autoSubmittedCount / totalDisputesCount) * 100 : 0;
  const totalCapitalAtRisk = disputes ? disputes.reduce((sum, d) => sum + d.amount_disputed, 0) / 100 : 0;
  const totalBotAttacks = velocityLogs ? velocityLogs.length : 0;

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col">
      <Navbar onRefresh={loadAllData} isRefreshing={isRefreshing} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8">
        {/* Top Summary Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>Total Active Disputes</span>
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              {loadingDisputes ? "..." : totalDisputesCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Ingested via Razorpay Webhooks</div>
          </div>

          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>Autonomous Contest Rate</span>
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {loadingDisputes ? "..." : `${autoSubmitRate.toFixed(0)}%`}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Completeness Score &ge; 0.80</div>
          </div>

          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>Capital Contested</span>
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              {loadingDisputes ? "..." : `₹${totalCapitalAtRisk.toLocaleString("en-IN")}`}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Disputed merchant capital</div>
          </div>

          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>Bot Attacks Intercepted</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-rose-400">
              {loadingLogs ? "..." : totalBotAttacks}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Card-testing micro bursts challenged</div>
          </div>
        </div>

        {/* Mid Section: Health Gauge and Velocity Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <HealthGauge report={ratioReport} loading={loadingRatio} error={errorRatio} />
          <BotAttackLog logs={velocityLogs} loading={loadingLogs} error={errorLogs} />
        </div>

        {/* Lower Section: Full Dispute Feed Table */}
        <div>
          <DisputeFeed disputes={disputes} loading={loadingDisputes} error={errorDisputes} />
        </div>
      </main>

      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        RazorSentinel · Multimodal Dispute-Evidence Assistant & Preemptive Velocity Shield · Razorpay Hackathon 2026
      </footer>
    </div>
  );
}
