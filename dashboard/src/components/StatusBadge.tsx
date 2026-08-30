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
  showDot = false,
  showSublabel = false,
  className = ""
}: StatusBadgeProps) {
  const config = formatVerdict(verdict);

  return (
    <span className={`${config.badgeClass} ${className}`}>
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 inline-block ${config.dotClass}`} />
      )}
      <span>{config.label}</span>
      {showSublabel && config.sublabel && (
        <span className="opacity-75 text-[10px] hidden sm:inline ml-1">({config.sublabel})</span>
      )}
    </span>
  );
}
