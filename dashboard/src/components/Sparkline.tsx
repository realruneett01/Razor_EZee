"use client";

import React from "react";

interface SparklineProps {
  data: number[];
  color?: "gold" | "sage" | "amber" | "burgundy" | "rose" | "indigo" | "cyan";
  height?: number;
  className?: string;
}

const COLOR_MAP: Record<string, { stroke: string; fillStart: string; fillEnd: string; dot: string }> = {
  gold: {
    stroke: "#B07D3A",
    fillStart: "rgba(176, 125, 58, 0.25)",
    fillEnd: "rgba(176, 125, 58, 0.0)",
    dot: "#B07D3A",
  },
  sage: {
    stroke: "#5A8A5A",
    fillStart: "rgba(90, 138, 90, 0.25)",
    fillEnd: "rgba(90, 138, 90, 0.0)",
    dot: "#5A8A5A",
  },
  amber: {
    stroke: "#B8860B",
    fillStart: "rgba(184, 134, 11, 0.25)",
    fillEnd: "rgba(184, 134, 11, 0.0)",
    dot: "#B8860B",
  },
  burgundy: {
    stroke: "#8B3A3A",
    fillStart: "rgba(139, 58, 58, 0.25)",
    fillEnd: "rgba(139, 58, 58, 0.0)",
    dot: "#8B3A3A",
  },
  rose: {
    stroke: "#A04040",
    fillStart: "rgba(160, 64, 64, 0.25)",
    fillEnd: "rgba(160, 64, 64, 0.0)",
    dot: "#A04040",
  },
  indigo: {
    stroke: "#6E473B",
    fillStart: "rgba(110, 71, 59, 0.25)",
    fillEnd: "rgba(110, 71, 59, 0.0)",
    dot: "#6E473B",
  },
  cyan: {
    stroke: "#B07D3A",
    fillStart: "rgba(176, 125, 58, 0.25)",
    fillEnd: "rgba(176, 125, 58, 0.0)",
    dot: "#B07D3A",
  },
};

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  color = "gold",
  height = 36,
  className = "",
}) => {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;

  const width = 120;
  const paddingX = 4;
  const paddingY = 4;
  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingY * 2;

  const points = data.map((val, idx) => {
    const x = paddingX + (idx / (data.length - 1)) * innerWidth;
    const y = height - paddingY - ((val - min) / range) * innerHeight;
    return { x, y };
  });

  // Smooth bezier curve path
  const pathD = points.reduce((acc, point, i, arr) => {
    if (i === 0) return `M ${point.x},${point.y}`;
    const prev = arr[i - 1];
    const cp1x = prev.x + (point.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (point.x - prev.x) / 2;
    const cp2y = point.y;
    return `${acc} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${point.x},${point.y}`;
  }, "");

  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];

  const areaD = `${pathD} L ${lastPoint.x},${height} L ${firstPoint.x},${height} Z`;
  const conf = COLOR_MAP[color] || COLOR_MAP.gold;
  const gradId = `sparkline-grad-${color}-${Math.random().toString(36).substr(2, 6)}`;

  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full overflow-visible"
        style={{ height }}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={conf.fillStart} />
            <stop offset="100%" stopColor={conf.fillEnd} />
          </linearGradient>
        </defs>

        {/* Gradient Fill Area */}
        <path d={areaD} fill={`url(#${gradId})`} />

        {/* Line Stroke */}
        <path
          d={pathD}
          fill="none"
          stroke={conf.stroke}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Latest point dot */}
        <circle cx={lastPoint.x} cy={lastPoint.y} r="3" fill="#ffffff" />
        <circle cx={lastPoint.x} cy={lastPoint.y} r="1.5" fill={conf.dot} />
      </svg>
    </div>
  );
};
