"use client";

import { Activity } from "lucide-react";
import { useState } from "react";
import type { UptimeCheckSummary } from "@/lib/domain/domain-repository";

type DomainUptimeHistoryProps = {
  checks: UptimeCheckSummary[];
};

const GRID_COLS = 28;

export function DomainUptimeHistory({ checks }: DomainUptimeHistoryProps) {
  // Show most recent checks, limited to grid size
  const displayChecks = checks.slice(0, GRID_COLS);
  const upCount = displayChecks.filter((c) => c.isUp).length;
  const uptimePct =
    displayChecks.length > 0
      ? Math.round((upCount / displayChecks.length) * 100)
      : null;

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-medium">Uptime history</h2>
        </div>
        {uptimePct !== null && (
          <span
            className={`text-xs font-medium tabular-nums ${
              uptimePct === 100
                ? "text-emerald-400"
                : uptimePct >= 90
                  ? "text-amber-400"
                  : "text-red-400"
            }`}
          >
            {uptimePct}% up
          </span>
        )}
      </div>

      {displayChecks.length > 0 ? (
        <div className="px-4 py-4">
          <UptimeGrid checks={displayChecks} />
          <RecentCheckDetail checks={checks.slice(0, 5)} />
        </div>
      ) : (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
          No uptime checks have been recorded for this domain yet.
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Uptime grid — most recent checks as colored squares, newest on the right
// ---------------------------------------------------------------------------

function UptimeGrid({ checks }: { checks: UptimeCheckSummary[] }) {
  const [tooltip, setTooltip] = useState<{
    check: UptimeCheckSummary;
    x: number;
    y: number;
  } | null>(null);

  // Reverse so oldest is on the left, newest on the right
  const ordered = [...checks].reverse();
  const cellSize = 14;
  const gap = 3;
  const cols = Math.min(ordered.length, GRID_COLS);
  const totalWidth = cols * cellSize + (cols - 1) * gap;

  return (
    <div className="relative mb-4">
      <svg
        width={totalWidth}
        height={cellSize}
        aria-label={`Uptime grid showing last ${ordered.length} checks`}
        className="overflow-visible"
      >
        {ordered.map((check, i) => {
          const x = i * (cellSize + gap);
          const color = check.isUp ? "#34d399" : "#f87171"; // emerald-400 / red-400
          const opacity = check.isUp ? 0.8 : 1;

          return (
            <rect
              key={check.id}
              x={x}
              y={0}
              width={cellSize}
              height={cellSize}
              rx={2}
              fill={color}
              fillOpacity={opacity}
              className="cursor-pointer transition-opacity hover:opacity-100"
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setTooltip({ check, x: rect.left, y: rect.top });
              }}
              onMouseLeave={() => setTooltip(null)}
              aria-label={`${check.isUp ? "Up" : "Down"} at ${formatDate(check.checkedAt)}`}
            />
          );
        })}
      </svg>

      {tooltip && (
        <UptimeTooltip check={tooltip.check} x={tooltip.x} y={tooltip.y} />
      )}

      <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground/60 tabular-nums">
        <span>{ordered.length > 0 ? formatDateShort(ordered[0].checkedAt) : ""}</span>
        <span>now</span>
      </div>
    </div>
  );
}

function UptimeTooltip({
  check,
  x,
  y,
}: {
  check: UptimeCheckSummary;
  x: number;
  y: number;
}) {
  return (
    <div
      className="pointer-events-none fixed z-50 rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-lg"
      style={{ left: x + 18, top: y - 8 }}
    >
      <p className={`font-medium ${check.isUp ? "text-emerald-400" : "text-red-400"}`}>
        {check.isUp ? "Up" : "Down"}
      </p>
      {check.responseCode && (
        <p className="mt-0.5 text-muted-foreground">HTTP {check.responseCode}</p>
      )}
      {check.responseTimeMs !== null && (
        <p className="text-muted-foreground">{Math.round(check.responseTimeMs)}ms</p>
      )}
      <p className="mt-1 text-muted-foreground/60">{formatDate(check.checkedAt)}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Recent check detail — compact list of the 5 most recent checks
// ---------------------------------------------------------------------------

function RecentCheckDetail({ checks }: { checks: UptimeCheckSummary[] }) {
  if (checks.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
        Recent checks
      </p>
      <div className="divide-y divide-border rounded-md border border-border">
        {checks.map((check) => (
          <div
            key={check.id}
            className="flex items-center justify-between px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <span
                className={`inline-block size-1.5 rounded-full ${
                  check.isUp ? "bg-emerald-400" : "bg-red-400"
                }`}
              />
              <span className="text-xs font-medium">
                {check.isUp ? "Up" : "Down"}
              </span>
              {check.responseCode && (
                <span className="text-xs text-muted-foreground">
                  HTTP {check.responseCode}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {check.responseTimeMs !== null && (
                <span className="tabular-nums">{Math.round(check.responseTimeMs)}ms</span>
              )}
              <span>{formatDate(check.checkedAt)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDateShort(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}
