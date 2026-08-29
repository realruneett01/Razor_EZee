// components/StatusBadge.tsx
import React from "react";
import { formatVerdict, RiskVerdict } from "@/lib/formatters";

interface StatusBadgeProps {
  verdict: RiskVerdict;
  showDot?: boolean;
  showSublabel?: boolean;
  className?: string;
}

export function StatusBadge({ 
  verdict, 
  showDot = true,
  showSublabel = false,
  className = ""
}: StatusBadgeProps) {
  const config = formatVerdict(verdict);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${config.badgeClass} ${className}`}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
      )}
      <span>{config.label}</span>
      {showSublabel && config.sublabel && (
        <span className="opacity-75 text-[10px] hidden sm:inline">({config.sublabel})</span>
      )}
    </span>
  );
}
