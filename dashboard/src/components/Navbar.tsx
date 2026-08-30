"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavbarProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onRefresh, isRefreshing }) => {
  const pathname = usePathname();

  const navItems = [
    { name: "Overview", href: "/" },
    { name: "Velocity Shield", href: "/velocity" },
    { name: "Risk Analytics", href: "/analytics" },
    { name: "Simulator", href: "/sandbox" },
    { name: "Disputes", href: "/disputes" },
    { name: "Settings", href: "/settings" },
  ];

  return (
    <header className="topbar">
      <Link href="/" className="brand">
        <div className="brand-mark">R</div>
        <div className="brand-word">razor·<span>ez</span></div>
        <div className="brand-tag">Autonomous Risk</div>
      </Link>

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

      <div className="flex items-center gap-3">
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
  );
};
