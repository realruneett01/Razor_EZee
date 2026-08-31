"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Sparkles, 
  Zap, 
  ShieldAlert, 
  CheckCircle2, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  Play, 
  Square,
  ShieldCheck
} from "lucide-react";
import { useDemo } from "@/context/DemoContext";

interface NavbarProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onRefresh, isRefreshing }) => {
  const pathname = usePathname();
  const {
    isPresenterOpen,
    setIsPresenterOpen,
    isAutoPlaying,
    activeNarrative,
    lastEvent,
    runAction,
    runAutoplayPitch,
    stopAutoplay,
  } = useDemo();

  const navItems = [
    { name: "Overview", href: "/" },
    { name: "Velocity Shield", href: "/velocity" },
    { name: "Risk Analytics", href: "/analytics" },
    { name: "Simulator", href: "/sandbox" },
    { name: "Disputes", href: "/disputes" },
    { name: "Settings", href: "/settings" },
  ];

  return (
    <>
      <header className="topbar">
        <div className="flex items-center gap-3">
          <Link href="/" className="brand">
            <div className="brand-mark">R</div>
            <div className="brand-word">razor·<span>ez</span></div>
            <div className="brand-tag">Autonomous Risk</div>
          </Link>

          {/* Sandbox / Demo Account Badge */}
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
            onClick={() => setIsPresenterOpen(!isPresenterOpen)}
            className={`btn !py-1 !px-2.5 !text-xs font-mono flex items-center gap-1.5 transition ${
              isPresenterOpen
                ? "bg-[var(--gold)] text-white border-[var(--gold)] shadow-sm"
                : "btn-ghost text-[var(--gold)] border-[var(--gold)]/25 hover:border-[var(--gold)]"
            }`}
            title="Toggle Presenter Mode HUD"
          >
            <Sparkles className="w-3 h-3" />
            <span>Presenter Mode</span>
            {isPresenterOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
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

      {/* Enhanced Presenter HUD (Heads-Up Display) */}
      {isPresenterOpen && (
        <div className="bg-[var(--surface-warm)] border-b border-[var(--border)] px-4 py-2.5 text-xs shadow-sm animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            {/* Left: Quick Actions Group */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-[var(--text)] uppercase tracking-wider text-[10px] font-mono mr-1">
                Pitch Triggers:
              </span>

              {/* 1. Incoming Order */}
              <button
                onClick={() => runAction("order")}
                className="btn btn-ghost !py-1 !px-2.5 text-[11px] font-mono flex items-center gap-1.5 hover:border-[var(--sage)] hover:text-[var(--sage)] bg-white"
              >
                <Zap className="w-3 h-3 text-[var(--sage)]" />
                <span>+ Order (₹2,499)</span>
              </button>

              {/* 2. Micro-Burst Card Attack */}
              <button
                onClick={() => runAction("burst")}
                className="btn btn-ghost !py-1 !px-2.5 text-[11px] font-mono flex items-center gap-1.5 hover:border-[var(--burgundy)] hover:text-[var(--burgundy)] bg-white"
              >
                <ShieldAlert className="w-3 h-3 text-[var(--burgundy)]" />
                <span>5x Micro-Burst</span>
              </button>

              {/* 3. Autonomous Dispute Defense */}
              <button
                onClick={() => runAction("defend")}
                className="btn btn-ghost !py-1 !px-2.5 text-[11px] font-mono flex items-center gap-1.5 hover:border-[var(--gold)] hover:text-[var(--gold)] bg-white"
              >
                <CheckCircle2 className="w-3 h-3 text-[var(--gold)]" />
                <span>Defend Dispute</span>
              </button>

              {/* 4. Honesty Safety Gate Hold */}
              <button
                onClick={() => runAction("gate")}
                className="btn btn-ghost !py-1 !px-2.5 text-[11px] font-mono flex items-center gap-1.5 hover:border-[var(--amber)] hover:text-[var(--amber)] bg-white"
              >
                <ShieldCheck className="w-3 h-3 text-[var(--amber)]" />
                <span>Honesty Gate (Hold)</span>
              </button>

              {/* 5. Baseline Reset */}
              <button
                onClick={() => runAction("reset")}
                className="btn btn-ghost !py-1 !px-2 text-[11px] font-mono flex items-center gap-1 text-[var(--rose)] hover:border-[var(--rose)] bg-white"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Right: Autoplay Pitch sequence */}
            <div className="flex items-center gap-2">
              {!isAutoPlaying ? (
                <button
                  onClick={runAutoplayPitch}
                  className="btn btn-primary !py-1 !px-3 text-[11px] font-mono flex items-center gap-1.5 shadow-sm"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Autoplay 60s Pitch</span>
                </button>
              ) : (
                <button
                  onClick={stopAutoplay}
                  className="btn !py-1 !px-3 text-[11px] font-mono flex items-center gap-1.5 bg-[var(--burgundy)] text-white border-[var(--burgundy)]"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>Stop Autoplay</span>
                </button>
              )}
            </div>
          </div>

          {/* Live Narrator Subtitle Ribbon */}
          {activeNarrative && (
            <div className="mt-2 pt-2 border-t border-[var(--border)] flex items-center justify-between text-[11.5px] font-mono">
              <span className="text-[var(--gold)] font-medium flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-[var(--gold)] animate-ping" />
                {activeNarrative}
              </span>
              {lastEvent && (
                <span className="text-[10px] text-[var(--text-secondary)]">
                  [Status: {lastEvent.title}]
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};
