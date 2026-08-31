"use client";

import React, { useState } from "react";
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
  ShieldCheck,
  Building2,
  Check
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
    merchantMode,
    setMerchantMode,
    customMerchantId,
    setCustomMerchantId,
    effectiveMerchantId,
  } = useDemo();

  const [customInput, setCustomInput] = useState<string>(customMerchantId || "");
  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);

  const navItems = [
    { name: "Overview", href: "/" },
    { name: "Velocity Shield", href: "/velocity" },
    { name: "Risk Analytics", href: "/analytics" },
    { name: "Simulator", href: "/sandbox" },
    { name: "Disputes", href: "/disputes" },
    { name: "Settings", href: "/settings" },
  ];

  const handleApplyCustomId = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput.trim()) {
      setCustomMerchantId(customInput.trim());
      setMerchantMode("custom");
      setShowAccountModal(false);
      if (onRefresh) onRefresh();
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

          {/* Interactive Global Demo / Merchant Toggle Pill */}
          <div className="relative">
            <button
              onClick={() => setShowAccountModal(!showAccountModal)}
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-mono font-medium border transition ${
                merchantMode === "demo"
                  ? "bg-[var(--gold-soft)] text-[var(--gold)] border-[var(--gold)]/30 hover:border-[var(--gold)]"
                  : "bg-[var(--sage-soft)] text-[var(--sage)] border-[var(--sage)]/30 hover:border-[var(--sage)]"
              }`}
              title="Click to toggle Global Account Scope"
            >
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                merchantMode === "demo" ? "bg-[var(--gold)]" : "bg-[var(--sage)]"
              }`} />
              <span>{merchantMode === "demo" ? "Sandbox / Demo Account" : "Live Merchant Account"}</span>
              <ChevronDown className="w-2.5 h-2.5 opacity-60" />
            </button>

            {/* Account Scope Dropdown Modal */}
            {showAccountModal && (
              <div className="absolute left-0 mt-2 w-72 bg-white border border-[var(--border-strong)] rounded-xl shadow-lg p-3 z-50 animate-fadeIn text-xs">
                <div className="font-semibold text-[var(--text)] text-[11px] mb-2 flex items-center justify-between">
                  <span>Global Account Scope</span>
                  <span className="text-[10px] font-mono text-[var(--text-secondary)]">Universal</span>
                </div>

                <div className="space-y-1.5">
                  <button
                    onClick={() => {
                      setMerchantMode("demo");
                      setShowAccountModal(false);
                      if (onRefresh) onRefresh();
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg font-mono text-[11px] flex items-center justify-between border transition ${
                      merchantMode === "demo"
                        ? "bg-[var(--gold-soft)] text-[var(--gold)] border-[var(--gold)]/30 font-semibold"
                        : "bg-[var(--surface-warm)] text-[var(--text-secondary)] border-transparent hover:border-[var(--border)]"
                    }`}
                  >
                    <div>
                      <div>🌟 Demo Baseline</div>
                      <div className="text-[9.5px] opacity-75">Judge Showcase Dataset (₹41.8L / 0.25%)</div>
                    </div>
                    {merchantMode === "demo" && <Check className="w-3.5 h-3.5 text-[var(--gold)]" />}
                  </button>

                  <button
                    onClick={() => {
                      setMerchantMode("custom");
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg font-mono text-[11px] flex items-center justify-between border transition ${
                      merchantMode === "custom"
                        ? "bg-[var(--sage-soft)] text-[var(--sage)] border-[var(--sage)]/30 font-semibold"
                        : "bg-[var(--surface-warm)] text-[var(--text-secondary)] border-transparent hover:border-[var(--border)]"
                    }`}
                  >
                    <div>
                      <div>👤 Custom / Live Merchant</div>
                      <div className="text-[9.5px] opacity-75">Production Credentials & Ledger</div>
                    </div>
                    {merchantMode === "custom" && <Check className="w-3.5 h-3.5 text-[var(--sage)]" />}
                  </button>
                </div>

                {merchantMode === "custom" && (
                  <form onSubmit={handleApplyCustomId} className="mt-2.5 pt-2 border-t border-[var(--border)] space-y-1.5">
                    <label className="text-[10px] font-mono text-[var(--text-secondary)]">Merchant UUID / Auth ID:</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="Paste merchant UUID…"
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        className="bg-[var(--surface-warm)] border border-[var(--border-strong)] rounded px-2 py-1 text-[11px] font-mono flex-1 focus:outline-none focus:border-[var(--sage)] text-[var(--text)]"
                      />
                      <button type="submit" className="btn btn-primary !py-1 !px-2 text-[10px] font-mono">
                        Apply
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
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

      {/* Enhanced Presenter HUD */}
      {isPresenterOpen && (
        <div className="bg-[var(--surface-warm)] border-b border-[var(--border)] px-4 py-2.5 text-xs shadow-sm animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            {/* Left: Global Mode + Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Quick Toggle between Demo Baseline vs Custom Account */}
              <div className="flex items-center bg-white border border-[var(--border)] rounded-lg p-0.5 text-[10px] font-mono mr-1">
                <button
                  onClick={() => {
                    setMerchantMode("demo");
                    if (onRefresh) onRefresh();
                  }}
                  className={`px-2 py-0.5 rounded-md transition ${
                    merchantMode === "demo"
                      ? "bg-[var(--gold-soft)] text-[var(--gold)] font-bold shadow-xs"
                      : "text-[var(--text-secondary)] hover:text-[var(--text)]"
                  }`}
                >
                  🌟 Demo Baseline
                </button>
                <button
                  onClick={() => {
                    setMerchantMode("custom");
                    if (onRefresh) onRefresh();
                  }}
                  className={`px-2 py-0.5 rounded-md transition ${
                    merchantMode === "custom"
                      ? "bg-[var(--sage-soft)] text-[var(--sage)] font-bold shadow-xs"
                      : "text-[var(--text-secondary)] hover:text-[var(--text)]"
                  }`}
                >
                  👤 Live Account
                </button>
              </div>

              <span className="font-semibold text-[var(--text)] uppercase tracking-wider text-[10px] font-mono mr-0.5">
                Actions:
              </span>

              {/* 1. Incoming Order */}
              <button
                onClick={() => runAction("order")}
                className="btn btn-ghost !py-1 !px-2 text-[11px] font-mono flex items-center gap-1 hover:border-[var(--sage)] hover:text-[var(--sage)] bg-white"
              >
                <Zap className="w-3 h-3 text-[var(--sage)]" />
                <span>+ Order (₹2,499)</span>
              </button>

              {/* 2. Micro-Burst Card Attack */}
              <button
                onClick={() => runAction("burst")}
                className="btn btn-ghost !py-1 !px-2 text-[11px] font-mono flex items-center gap-1 hover:border-[var(--burgundy)] hover:text-[var(--burgundy)] bg-white"
              >
                <ShieldAlert className="w-3 h-3 text-[var(--burgundy)]" />
                <span>5x Micro-Burst</span>
              </button>

              {/* 3. Autonomous Dispute Defense */}
              <button
                onClick={() => runAction("defend")}
                className="btn btn-ghost !py-1 !px-2 text-[11px] font-mono flex items-center gap-1 hover:border-[var(--gold)] hover:text-[var(--gold)] bg-white"
              >
                <CheckCircle2 className="w-3 h-3 text-[var(--gold)]" />
                <span>Defend Dispute</span>
              </button>

              {/* 4. Honesty Safety Gate Hold */}
              <button
                onClick={() => runAction("gate")}
                className="btn btn-ghost !py-1 !px-2 text-[11px] font-mono flex items-center gap-1 hover:border-[var(--amber)] hover:text-[var(--amber)] bg-white"
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
                <span>Reset Baseline</span>
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
                  [Status: {lastEvent.title} · Merchant: {effectiveMerchantId.slice(0, 8)}...]
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};
