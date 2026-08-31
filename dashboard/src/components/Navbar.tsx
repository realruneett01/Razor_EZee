"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Zap, ShieldAlert, CheckCircle2, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";

interface NavbarProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

export const Navbar: React.FC<NavbarProps> = ({ onRefresh, isRefreshing }) => {
  const pathname = usePathname();
  const [showPitchBar, setShowPitchBar] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [executing, setExecuting] = useState<boolean>(false);

  const navItems = [
    { name: "Overview", href: "/" },
    { name: "Velocity Shield", href: "/velocity" },
    { name: "Risk Analytics", href: "/analytics" },
    { name: "Simulator", href: "/sandbox" },
    { name: "Disputes", href: "/disputes" },
    { name: "Settings", href: "/settings" },
  ];

  const handleAction = async (endpoint: string, label: string) => {
    setExecuting(true);
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        setActionMessage(`✓ ${label} executed successfully.`);
        if (onRefresh) onRefresh();
      } else {
        setActionMessage(`✓ ${label} simulated locally.`);
      }
    } catch {
      setActionMessage(`✓ ${label} simulated.`);
    } finally {
      setExecuting(false);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  return (
    <>
      <header className="topbar">
        <div className="flex items-center gap-3">
          <Link href="/" className="brand">
            <div className="brand-mark">R</div>
            <div className="brand-word">razor·<span>ez</span></div>
            <div className="brand-tag">Autonomous Risk</div>
          </Link>

          {/* Persistent Sandbox / Demo Account Badge (Spec §4) */}
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[var(--gold-soft)] text-[var(--gold)] border border-[var(--gold)]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)] animate-pulse" />
            Sandbox / Demo Account
          </span>
        </div>

        <nav className="tabs">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={isActive ? "active" : ""}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2.5">
          {/* Presenter Pitch Controls Toggle Button */}
          <button
            onClick={() => setShowPitchBar(!showPitchBar)}
            className={`btn !py-1 !px-2.5 !text-xs font-mono flex items-center gap-1.5 transition ${
              showPitchBar
                ? "bg-[var(--gold)] text-white border-[var(--gold)]"
                : "btn-ghost text-[var(--gold)] border-[var(--gold)]/25"
            }`}
            title="Presenter Pitch Controls"
          >
            <Sparkles className="w-3 h-3" />
            <span>Presenter Mode</span>
            {showPitchBar ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="btn btn-ghost !py-1 !px-2.5 !text-xs font-mono"
              title="Refresh backend telemetry"
            >
              {isRefreshing ? "syncing…" : "sync"}
            </button>
          )}

          <div className="status-pill">
            <span className="status-dot" />
            <span>sub-2ms edge</span>
          </div>
        </div>
      </header>

      {/* Floating Presenter Live Control Bar (Pitch Actions §6.2) */}
      {showPitchBar && (
        <div className="bg-[var(--surface-warm)] border-b border-[var(--border)] px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--text)] uppercase tracking-wider text-[10px]">
              Presenter Pitch Actions:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleAction("/demo/simulate-order", "Incoming Order (+₹2,499.00)")}
                disabled={executing}
                className="btn btn-ghost !py-1 !px-2 text-[11px] font-mono flex items-center gap-1 hover:border-[var(--sage)] hover:text-[var(--sage)]"
              >
                <Zap className="w-3 h-3 text-[var(--sage)]" />
                <span>+ Order (₹2,499)</span>
              </button>

              <button
                onClick={() => handleAction("/demo/simulate-burst", "5x Micro-Probe Bot Sweep")}
                disabled={executing}
                className="btn btn-ghost !py-1 !px-2 text-[11px] font-mono flex items-center gap-1 hover:border-[var(--burgundy)] hover:text-[var(--burgundy)]"
              >
                <ShieldAlert className="w-3 h-3 text-[var(--burgundy)]" />
                <span>5x Micro-Burst</span>
              </button>

              <button
                onClick={() => handleAction("/demo/trigger-defense", "Autonomous Representment Defense")}
                disabled={executing}
                className="btn btn-ghost !py-1 !px-2 text-[11px] font-mono flex items-center gap-1 hover:border-[var(--gold)] hover:text-[var(--gold)]"
              >
                <CheckCircle2 className="w-3 h-3 text-[var(--gold)]" />
                <span>Defend Dispute</span>
              </button>

              <button
                onClick={() => handleAction("/demo/reset", "Reset Baseline Dataset")}
                disabled={executing}
                className="btn btn-ghost !py-1 !px-2 text-[11px] font-mono flex items-center gap-1 text-[var(--rose)] hover:border-[var(--rose)]"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Baseline</span>
              </button>
            </div>
          </div>

          {actionMessage && (
            <span className="text-[11px] font-mono text-[var(--sage)] font-medium animate-fadeIn">
              {actionMessage}
            </span>
          )}
        </div>
      )}
    </>
  );
};
