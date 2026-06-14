"use client";

import { CalendarRange } from "lucide-react";
import type { DomainSummary } from "@/lib/domain/types";

type ExpiryTimelineProps = {
  domains: DomainSummary[];
};

type TimelineDomain = {
  name: string;
  expiryDate: Date;
  daysRemaining: number;
};

const MONTHS_SHOWN = 12;
const DAY_MS = 24 * 60 * 60 * 1000;

function urgencyColor(days: number): string {
  if (days < 0) return "#f87171"; // expired → red
  if (days < 30) return "#f87171"; // red-400
  if (days < 90) return "#fbbf24"; // amber-400
  return "#6b7280"; // gray-500 — healthy
}

function urgencyBg(days: number): string {
  if (days < 30) return "rgba(248,113,113,0.12)";
  if (days < 90) return "rgba(251,191,36,0.10)";
  return "rgba(255,255,255,0.05)";
}

export function ExpiryTimeline({ domains }: ExpiryTimelineProps) {
  // Snap to midnight so server and client compute identical float positions.
  // Date.now() called at slightly different ms on each side causes SVG cx to drift.
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const cutoff = new Date(now.getTime() + MONTHS_SHOWN * 30 * DAY_MS);

  const upcoming: TimelineDomain[] = domains
    .filter((d) => d.expiryDate && d.expiryDate !== "Untracked")
    .map((d) => {
      const date = new Date(d.expiryDate);
      const days = Math.ceil((date.getTime() - now.getTime()) / DAY_MS);
      return { name: d.name, expiryDate: date, daysRemaining: days };
    })
    .filter((d) => d.expiryDate <= cutoff)
    .sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime());

  const hasData = upcoming.length > 0;

  // Build month tick labels (6 evenly spaced out of 12)
  const monthLabels: { label: string; fraction: number }[] = [];
  for (let i = 0; i <= MONTHS_SHOWN; i += 2) {
    const d = new Date(now.getTime() + i * 30 * DAY_MS);
    monthLabels.push({
      label: d.toLocaleDateString("en-US", { month: "short" }),
      fraction: i / MONTHS_SHOWN,
    });
  }

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <CalendarRange className="size-4 text-primary" aria-hidden="true" />
        <h2 className="text-sm font-medium">Expiry timeline</h2>
        <span className="ml-auto text-xs text-muted-foreground">Next 12 months</span>
      </div>

      {hasData ? (
        <div className="px-4 py-4">
          <TimelineChart domains={upcoming} monthLabels={monthLabels} now={now} cutoff={cutoff} />
          <DomainList domains={upcoming} />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
          <CalendarRange className="size-6 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            No domains expire in the next 12 months.
          </p>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Pure SVG timeline chart
// ---------------------------------------------------------------------------

type ChartProps = {
  domains: TimelineDomain[];
  monthLabels: { label: string; fraction: number }[];
  now: Date;
  cutoff: Date;
};

function TimelineChart({ domains, monthLabels, now, cutoff }: ChartProps) {
  const totalMs = cutoff.getTime() - now.getTime();
  const svgHeight = 64;
  const dotY = 28;
  const dotR = 5;

  function xFraction(date: Date): number {
    return (date.getTime() - now.getTime()) / totalMs;
  }

  // Group domains that are within 8% of each other horizontally to avoid label overlap
  const positions = domains.map((d) => ({
    ...d,
    fx: xFraction(d.expiryDate),
  }));

  return (
    <div className="mb-4 w-full">
      <svg
        viewBox={`0 0 100 ${svgHeight}`}
        preserveAspectRatio="none"
        className="h-16 w-full overflow-visible"
        aria-label="Domain expiry timeline"
      >
        {/* Axis line */}
        <line x1="0" y1={dotY} x2="100" y2={dotY} stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />

        {/* Month tick marks */}
        {monthLabels.map(({ fraction }) => (
          <line
            key={fraction}
            x1={fraction * 100}
            y1={dotY - 4}
            x2={fraction * 100}
            y2={dotY + 4}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="0.4"
          />
        ))}

        {/* Domain dots */}
        {positions.map((d) => (
          <g key={d.name}>
            {/* Dot */}
            <circle
              cx={d.fx * 100}
              cy={dotY}
              r={dotR / 10}
              fill={urgencyColor(d.daysRemaining)}
              className="cursor-pointer"
            />
            {/* Vertical stem */}
            <line
              x1={d.fx * 100}
              y1={dotY - dotR / 10}
              x2={d.fx * 100}
              y2={dotY - 12}
              stroke={urgencyColor(d.daysRemaining)}
              strokeWidth="0.3"
              opacity="0.5"
            />
          </g>
        ))}
      </svg>

      {/* Month labels — rendered in HTML for proper font rendering */}
      <div className="relative h-4 w-full">
        {monthLabels.map(({ label, fraction }) => (
          <span
            key={fraction}
            className="absolute -translate-x-1/2 text-[10px] text-muted-foreground/50 tabular-nums"
            style={{ left: `${fraction * 100}%` }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sorted domain list below the chart
// ---------------------------------------------------------------------------

function DomainList({ domains }: { domains: TimelineDomain[] }) {
  return (
    <div className="mt-4 divide-y divide-border rounded-md border border-border">
      {domains.map((d) => (
        <div
          key={d.name}
          className="flex items-center justify-between px-3 py-2.5"
          style={{ background: urgencyBg(d.daysRemaining) }}
        >
          <span className="truncate text-xs font-medium">{d.name}</span>
          <div className="ml-4 flex shrink-0 items-center gap-3">
            <span
              className="text-xs tabular-nums"
              style={{ color: urgencyColor(d.daysRemaining) }}
            >
              {d.daysRemaining < 0
                ? "Expired"
                : `${d.daysRemaining}d`}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {d.expiryDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
