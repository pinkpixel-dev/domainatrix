import { Activity } from "lucide-react";
import type { UptimeCheckSummary } from "@/lib/domain/domain-repository";

type UptimeSparklineCardProps = {
  checks: UptimeCheckSummary[];
  healthyCount: number;
  totalDomains: number;
};

const SPARK_COLS = 40;

/**
 * Dashboard "Health monitor" card with an SVG sparkline background
 * showing the portfolio-level uptime trend across recent checks.
 */
export function UptimeSparklineCard({ checks, healthyCount, totalDomains }: UptimeSparklineCardProps) {
  const display = checks.slice(0, SPARK_COLS).reverse(); // oldest → newest

  const upCount = display.filter((c) => c.isUp).length;
  const pct = display.length > 0 ? Math.round((upCount / display.length) * 100) : null;

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-card p-4">
      {/* Background sparkline — purely decorative */}
      {display.length > 0 && pct !== null && (
        <SparklineSvg checks={display} pct={pct} />
      )}

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Health monitor</p>
          <Activity className="size-4 text-primary" aria-hidden="true" />
        </div>
        <p className="mt-5 text-3xl font-semibold tracking-normal">
          {healthyCount}
          <span className="ml-1.5 text-base font-normal text-muted-foreground">
            / {totalDomains}
          </span>
        </p>
        {pct !== null && (
          <p
            className="mt-1 text-xs tabular-nums"
            style={{
              color: pct === 100 ? "#34d399" : pct >= 90 ? "#fbbf24" : "#f87171",
            }}
          >
            {pct}% uptime across recent checks
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Background sparkline SVG — axis-free, decorative area chart shape
// ---------------------------------------------------------------------------

function SparklineSvg({ checks, pct }: { checks: UptimeCheckSummary[]; pct: number }) {
  const width = 100;
  const height = 40;
  const n = checks.length;
  if (n < 2) return null;

  // Build y values: up=0 (top, small), down=height (bottom, bad)
  // We want the line to go to the bottom when down and top when up
  const ys = checks.map((c) => (c.isUp ? height * 0.2 : height * 0.9));
  const xs = checks.map((_, i) => (i / (n - 1)) * width);

  // Smooth line using simple catmull-rom-like approach (average of adjacent)
  const smoothed = ys.map((y, i) => {
    if (i === 0 || i === n - 1) return y;
    return (ys[i - 1] + y + ys[i + 1]) / 3;
  });

  // Build SVG path
  const linePoints = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${smoothed[i].toFixed(1)}`).join(" ");
  const areaPath = `${linePoints} L${width},${height} L0,${height} Z`;

  // Match the same thresholds as the text label — red only below 90%
  const lineColor = pct === 100 ? "rgba(52,211,153,0.4)" : pct >= 90 ? "rgba(251,191,36,0.4)" : "rgba(248,113,113,0.5)";
  const fillColor = pct === 100 ? "rgba(52,211,153,0.05)" : pct >= 90 ? "rgba(251,191,36,0.04)" : "rgba(248,113,113,0.06)";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      {/* Area fill */}
      <path d={areaPath} fill={fillColor} />
      {/* Line */}
      <path d={linePoints} fill="none" stroke={lineColor} strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}
