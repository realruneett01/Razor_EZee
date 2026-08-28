import React from "react";
import { Shield, Activity, RefreshCw } from "lucide-react";

interface NavbarProps {
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onRefresh, isRefreshing }) => {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#080C14]/90 backdrop-blur-md px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight text-white">RazorSentinel</h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                AEGISPAY
              </span>
            </div>
            <p className="text-xs text-slate-400">Autonomous Fintech Risk Manager · Razorpay Track 02</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-xs bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-300">FastAPI & Gemini 3 Flash Online</span>
          </div>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 px-3 py-2 rounded-lg border border-slate-700 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-indigo-400" : ""}`} />
            <span>Refresh Live Data</span>
          </button>
        </div>
      </div>
    </header>
  );
};
