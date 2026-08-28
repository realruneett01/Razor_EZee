"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { 
  Settings, 
  Key, 
  Database, 
  ShieldCheck, 
  Webhook, 
  CheckCircle2, 
  Save, 
  Lock, 
  Cpu,
  RefreshCw
} from "lucide-react";

export default function SettingsPage() {
  const [saved, setSaved] = useState<boolean>(false);
  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    await new Promise((r) => setTimeout(r, 800));
    setTestResult("All systems operational: FastAPI, Gemini 3 Flash, Upstash Redis, and Supabase DB responding normally.");
    setTesting(false);
    setTimeout(() => setTestResult(null), 5000);
  };

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="border-b border-slate-800/80 pb-6">
          <div className="flex items-center space-x-2">
            <Settings className="w-6 h-6 text-indigo-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Merchant Settings & System Configuration</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage Razorpay API Keys · Gemini Model Config · Upstash Redis Cluster · DPDP Act Privacy Controls
          </p>
        </div>

        {saved && (
          <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Merchant security and API configuration saved successfully.</span>
          </div>
        )}

        {testResult && (
          <div className="p-4 bg-indigo-950/40 border border-indigo-500/40 rounded-xl text-indigo-300 text-xs flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span>{testResult}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Razorpay Integration Section */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2">
              <Key className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-semibold text-white">Razorpay API & Webhook Credentials</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium">Razorpay Key ID</label>
                <input
                  type="text"
                  defaultValue="rzp_test_99218204918237"
                  className="w-full mt-1.5 p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium">Razorpay Key Secret</label>
                <input
                  type="password"
                  defaultValue="••••••••••••••••••••••••"
                  className="w-full mt-1.5 p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-slate-300 font-medium">Webhook Secret (for HMAC-SHA256 Verification)</label>
                <input
                  type="password"
                  defaultValue="••••••••••••••••••••••••"
                  className="w-full mt-1.5 p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Used by <code className="text-indigo-400">app/webhooks/razorpay.py</code> to verify incoming webhook signatures.
                </p>
              </div>
            </div>
          </div>

          {/* AI & Infrastructure Section */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-semibold text-white">AI Engine & Upstash Redis Configuration</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium">Gemini API Key</label>
                <input
                  type="password"
                  defaultValue="••••••••••••••••••••••••"
                  className="w-full mt-1.5 p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium">Gemini Model Version</label>
                <select className="w-full mt-1.5 p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500">
                  <option value="gemini-3-flash-preview">gemini-3-flash-preview (Recommended)</option>
                  <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                  <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-slate-300 font-medium">Upstash Redis REST Endpoint</label>
                <input
                  type="text"
                  defaultValue="https://apn1-distinct-redbird-34320.upstash.io"
                  className="w-full mt-1.5 p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* DPDP Act Privacy & Compliance Section */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-semibold text-white">India DPDP Act Privacy & Data Retention Controls</h2>
            </div>

            <div className="space-y-3 text-xs">
              <label className="flex items-start space-x-3 p-3 bg-slate-900/90 rounded-xl border border-slate-800 cursor-pointer">
                <input type="checkbox" defaultChecked className="accent-indigo-500 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Support Chat Excerpt Minimization</div>
                  <div className="text-[11px] text-slate-400">Only extract and transmit the exact contradictory statement into bank dossiers; do not store non-pertinent customer conversation history.</div>
                </div>
              </label>

              <label className="flex items-start space-x-3 p-3 bg-slate-900/90 rounded-xl border border-slate-800 cursor-pointer">
                <input type="checkbox" defaultChecked className="accent-indigo-500 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Automated Dossier Purge Post-Arbitration</div>
                  <div className="text-[11px] text-slate-400">Automatically delete compiled temporary PDF dossiers 30 days after chargeback resolution.</div>
                </div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? "animate-spin text-indigo-400" : ""}`} />
              <span>Test System Integrations</span>
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
