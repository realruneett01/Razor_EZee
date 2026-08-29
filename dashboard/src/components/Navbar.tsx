"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Shield, 
  LayoutDashboard, 
  FileText, 
  Zap, 
  BarChart3, 
  FlaskConical, 
  Settings, 
  RefreshCw,
  Radio
} from "lucide-react";

interface NavbarProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onRefresh, isRefreshing = false }) => {
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Overview", icon: LayoutDashboard },
    { href: "/disputes", label: "Dispute Studio", icon: FileText },
    { href: "/velocity", label: "Velocity Shield", icon: Zap },
    { href: "/analytics", label: "Risk Analytics", icon: BarChart3 },
    { href: "/sandbox", label: "Simulator", icon: FlaskConical },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <header className="sticky top-3 z-50 px-4 md:px-6 w-full max-w-7xl mx-auto">
      <div className="glass-panel rounded-2xl px-4 py-2.5 flex items-center justify-between border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
        {/* Brand & Unified razor-EZ Aesthetic */}
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-all duration-300">
              <Shield className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#060911] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-black tracking-tight text-white font-mono">
                  razor-<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-300 to-emerald-400">EZ</span>
                </span>
                <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-white/[0.06] text-slate-300 border border-white/[0.08] rounded-full">
                  Autonomous Risk
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Dispute Defense & Preemptive Velocity Shield
              </p>
            </div>
          </Link>
        </div>

        {/* Floating Pill Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1 glass-pill p-1 rounded-xl">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Live Edge Status Beacon & Action Controls */}
        <div className="flex items-center space-x-2.5">
          {/* Live Edge Status Beacon */}
          <div className="hidden lg:flex items-center space-x-2 px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[11px] font-mono text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Sub-2ms Edge</span>
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] active:bg-white/[0.15] text-slate-200 border border-white/[0.08] transition duration-200 disabled:opacity-50 shadow-sm"
              title="Refresh Live Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-cyan-400" : "text-slate-400"}`} />
              <span className="hidden sm:inline">Sync</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
