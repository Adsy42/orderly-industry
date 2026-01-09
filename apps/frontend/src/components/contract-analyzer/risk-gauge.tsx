"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { getRiskLevel, getRiskLabel } from "@/types/contract-analysis";

interface RiskGaugeProps {
  score: number; // 0-100
  animate?: boolean;
  size?: "sm" | "md" | "lg";
}

const riskColors = {
  low: {
    stroke: "stroke-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  medium: {
    stroke: "stroke-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
  },
  high: {
    stroke: "stroke-orange-500",
    text: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/30",
  },
  critical: {
    stroke: "stroke-red-600",
    text: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/30",
  },
};

const sizeConfig = {
  sm: { width: 160, strokeWidth: 12, fontSize: "text-3xl" },
  md: { width: 200, strokeWidth: 14, fontSize: "text-4xl" },
  lg: { width: 260, strokeWidth: 16, fontSize: "text-5xl" },
};

export function RiskGauge({
  score,
  animate = true,
  size = "md",
}: RiskGaugeProps) {
  const [displayScore, setDisplayScore] = React.useState(animate ? 0 : score);
  const [dashOffset, setDashOffset] = React.useState(animate ? 1 : 0);
  const riskLevel = getRiskLevel(score);
  const colors = riskColors[riskLevel];
  const config = sizeConfig[size];

  // SVG calculations
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = Math.PI * radius; // Half circle circumference

  // Animate the score counter and arc
  React.useEffect(() => {
    if (!animate) {
      setDisplayScore(score);
      setDashOffset(1 - score / 100);
      return;
    }

    const duration = 1500; // ms
    const steps = 60;
    const scoreIncrement = score / steps;
    const offsetDecrement = score / 100 / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const newScore = Math.min(score, Math.round(scoreIncrement * step));
      const newOffset = Math.max(1 - score / 100, 1 - offsetDecrement * step);

      setDisplayScore(newScore);
      setDashOffset(newOffset);

      if (step >= steps) {
        clearInterval(timer);
        setDisplayScore(score);
        setDashOffset(1 - score / 100);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score, animate]);

  const cx = config.width / 2;
  const cy = config.width / 2;

  return (
    <div className="flex flex-col items-center">
      {/* Gauge */}
      <div
        className="relative"
        style={{ width: config.width, height: config.width / 2 + 20 }}
      >
        <svg
          width={config.width}
          height={config.width / 2 + 20}
          className="overflow-visible"
        >
          {/* Background arc - full semi-circle */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            className="text-zinc-200 dark:text-slate-700"
          />

          {/* Colored arc - animated with stroke-dashoffset */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            className={cn(colors.stroke)}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: circumference * dashOffset,
            }}
          />
        </svg>

        {/* Score display */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <span
            className={cn(
              "font-bold tabular-nums",
              config.fontSize,
              colors.text,
            )}
          >
            {displayScore}
          </span>
        </div>
      </div>

      {/* Risk label */}
      <div
        className={cn(
          "mt-2 rounded-full px-4 py-1.5 text-sm font-semibold",
          colors.bg,
          colors.text,
        )}
      >
        {getRiskLabel(score)}
      </div>
    </div>
  );
}
