"use client";

import React from "react";

interface SparklineProps {
  data: number[];
  color: "indigo" | "emerald" | "cyan" | "rose" | "amber";
  height?: number;
  className?: string;
}

const COLOR_MAP = {
  indigo: {
    stroke: "#818cf8",
    fillStart: "rgba(129, 140, 248, 0.4)",
    fillEnd: "rgba(129, 140, 248, 0.0)",
    dot: "#a5b4fc",
  },
  emerald: {
    stroke: "#34d399",
    fillStart: "rgba(52, 211, 153, 0.4)",
    fillEnd: "rgba(52, 211, 153, 0.0)",
    dot: "#6ee7b7",
  },
  cyan: {
    stroke: "#22d3ee",
    fillStart: "rgba(34, 211, 238, 0.4)",
    fillEnd: "rgba(34, 211, 238, 0.0)",
    dot: "#67e8f9",
  },
  rose: {
    stroke: "#fb7185",
    fillStart: "rgba(251, 113, 133, 0.4)",
    fillEnd: "rgba(251, 113, 133, 0.0)",
    dot: "#fda4af",
  },
  amber: {
    stroke: "#fbbf24",
    fillStart: "rgba(251, 191, 36, 0.4)",
    fillEnd: "rgba(251, 191, 36, 0.0)",
    dot: "#fde68a",
  },
};

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  color,
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

  // Construct smooth bezier curve path
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

  const conf = COLOR_MAP[color] || COLOR_MAP.indigo;
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
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Pulsing latest point dot */}
        <circle cx={lastPoint.x} cy={lastPoint.y} r="3" fill={conf.dot} />
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r="5"
          fill="none"
          stroke={conf.stroke}
          strokeWidth="1"
          opacity="0.6"
          className="animate-ping origin-center"
        />
      </svg>
    </div>
  );
};
