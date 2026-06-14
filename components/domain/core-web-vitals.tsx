"use client";

import { useEffect, useState } from "react";
import { Gauge, Info } from "lucide-react";
import type { CruxResponse } from "@/app/api/crux/route";

type CoreWebVitalsProps = {
  domain: string;
};

type MetricRating = "good" | "needs-improvement" | "poor";

// Google CWV thresholds
// https://web.dev/articles/vitals
const LCP_THRESHOLDS = { good: 2500, needsImprovement: 4000 }; // ms
const CLS_THRESHOLDS = { good: 0.1, needsImprovement: 0.25 };
const INP_THRESHOLDS = { good: 200, needsImprovement: 500 }; // ms

function rateLcp(ms: number): MetricRating {
  if (ms <= LCP_THRESHOLDS.good) return "good";
  if (ms <= LCP_THRESHOLDS.needsImprovement) return "needs-improvement";
  return "poor";
}

function rateCls(score: number): MetricRating {
  if (score <= CLS_THRESHOLDS.good) return "good";
  if (score <= CLS_THRESHOLDS.needsImprovement) return "needs-improvement";
  return "poor";
}

function rateInp(ms: number): MetricRating {
  if (ms <= INP_THRESHOLDS.good) return "good";
  if (ms <= INP_THRESHOLDS.needsImprovement) return "needs-improvement";
  return "poor";
}

const ratingColor: Record<MetricRating, string> = {
  good: "#34d399",           // emerald-400
  "needs-improvement": "#fbbf24", // amber-400
  poor: "#f87171",           // red-400
};

const ratingLabel: Record<MetricRating, string> = {
  good: "Good",
  "needs-improvement": "Needs work",
  poor: "Poor",
};

export function CoreWebVitals({ domain }: CoreWebVitalsProps) {
  const [data, setData] = useState<CruxResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/crux?domain=${encodeURIComponent(domain)}`)
      .then((r) => r.json())
      .then((json: CruxResponse) => {
        if (cancelled) return;
        setData(json);
      })
      .catch(() => {
        if (cancelled) return;
        setData({ success: false, error: "Request failed" });
      });

    return () => {
      cancelled = true;
    };
  }, [domain]);

  // Don't render the card at all if key isn't configured (503 → success:false + specific message)
  if (
    data &&
    !data.success &&
    "error" in data &&
    data.error === "CrUX API key not configured"
  ) {
    return null;
  }

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Gauge className="size-4 text-primary" aria-hidden="true" />
        <h2 className="text-sm font-medium">Core Web Vitals</h2>
        <span className="ml-auto text-[10px] text-muted-foreground">via Chrome UX Report</span>
      </div>

      <div className="px-4 py-4">
        {!data ? (
          <LoadingState />
        ) : data && !data.success ? (
          <ErrorState />
        ) : data && data.success && !data.hasData ? (
          <NoDataState />
        ) : data && data.success && data.hasData ? (
          <MetricsDisplay perf={data.performance} />
        ) : null}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Sub-states
// ---------------------------------------------------------------------------

function LoadingState() {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="size-4 animate-spin rounded-full border-2 border-border border-t-muted-foreground" />
      <p className="text-sm text-muted-foreground">Fetching real-world performance data…</p>
    </div>
  );
}

function ErrorState() {
  return (
    <p className="py-2 text-sm text-muted-foreground">
      Could not load CrUX data right now.
    </p>
  );
}

function NoDataState() {
  return (
    <div className="flex items-start gap-3 rounded-md border border-dashed border-border p-4">
      <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground/50" />
      <div>
        <p className="text-sm text-muted-foreground">No real-world traffic data available.</p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          Google only tracks performance for sites with sufficient Chrome user traffic. Personal or
          low-traffic domains often do not appear in the dataset.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Metrics display — three radial gauges
// ---------------------------------------------------------------------------

type PerfData = {
  largestContentfulPaint: number | null;
  cumulativeLayoutShift: number | null;
  interactionToNextPaint: number | null;
};

function MetricsDisplay({ perf }: { perf: PerfData }) {
  const lcpRating = perf.largestContentfulPaint !== null ? rateLcp(perf.largestContentfulPaint) : null;
  const clsRating = perf.cumulativeLayoutShift !== null ? rateCls(perf.cumulativeLayoutShift) : null;
  const inpRating = perf.interactionToNextPaint !== null ? rateInp(perf.interactionToNextPaint) : null;

  return (
    <div className="grid grid-cols-3 gap-4">
      <MetricGauge
        label="LCP"
        title="Largest Contentful Paint"
        value={perf.largestContentfulPaint !== null ? `${(perf.largestContentfulPaint / 1000).toFixed(1)}s` : "—"}
        rating={lcpRating}
        fraction={perf.largestContentfulPaint !== null ? Math.min(perf.largestContentfulPaint / LCP_THRESHOLDS.needsImprovement, 1) : 0}
        invertFill
      />
      <MetricGauge
        label="CLS"
        title="Cumulative Layout Shift"
        value={perf.cumulativeLayoutShift !== null ? perf.cumulativeLayoutShift.toFixed(3) : "—"}
        rating={clsRating}
        fraction={perf.cumulativeLayoutShift !== null ? Math.min(perf.cumulativeLayoutShift / CLS_THRESHOLDS.needsImprovement, 1) : 0}
        invertFill
      />
      <MetricGauge
        label="INP"
        title="Interaction to Next Paint"
        value={perf.interactionToNextPaint !== null ? `${perf.interactionToNextPaint}ms` : "—"}
        rating={inpRating}
        fraction={perf.interactionToNextPaint !== null ? Math.min(perf.interactionToNextPaint / INP_THRESHOLDS.needsImprovement, 1) : 0}
        invertFill
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Individual radial gauge
// ---------------------------------------------------------------------------

const GAUGE_R = 28;
const GAUGE_STROKE = 3.5;
const GAUGE_CENTER = 34;
const GAUGE_CIRC = 2 * Math.PI * GAUGE_R;

type MetricGaugeProps = {
  label: string;
  title: string;
  value: string;
  rating: MetricRating | null;
  /** 0–1 representing how close to bad the metric is */
  fraction: number;
  /** If true, a higher fraction = worse (fills red as it approaches 1) */
  invertFill?: boolean;
};

function MetricGauge({ label, title, value, rating, fraction, invertFill }: MetricGaugeProps) {
  const color = rating ? ratingColor[rating] : "#4b5563";

  // For "inverted" metrics (LCP, INP, CLS), higher fraction = closer to bad
  // We show how full the "good zone" is — so 0 fill = all good, 1 fill = maxed out bad
  const fillFraction = invertFill ? fraction : 1 - fraction;
  const offset = GAUGE_CIRC * (1 - fillFraction);

  return (
    <div className="flex flex-col items-center gap-2" title={title}>
      <svg
        width={GAUGE_CENTER * 2}
        height={GAUGE_CENTER * 2}
        viewBox={`0 0 ${GAUGE_CENTER * 2} ${GAUGE_CENTER * 2}`}
        aria-label={`${title}: ${value}`}
      >
        {/* Track */}
        <circle
          cx={GAUGE_CENTER}
          cy={GAUGE_CENTER}
          r={GAUGE_R}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={GAUGE_STROKE}
        />
        {/* Fill */}
        <circle
          cx={GAUGE_CENTER}
          cy={GAUGE_CENTER}
          r={GAUGE_R}
          fill="none"
          stroke={color}
          strokeWidth={GAUGE_STROKE}
          strokeLinecap="round"
          strokeDasharray={GAUGE_CIRC}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${GAUGE_CENTER} ${GAUGE_CENTER})`}
          style={{ transition: "stroke-dashoffset 0.8s ease, stroke 0.4s ease" }}
        />
        {/* Value text */}
        <text
          x={GAUGE_CENTER}
          y={GAUGE_CENTER - 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="11"
          fontWeight="600"
          fill={color}
          fontFamily="var(--font-app-sans, Arial, sans-serif)"
        >
          {value}
        </text>
        {/* Rating label */}
        {rating && (
          <text
            x={GAUGE_CENTER}
            y={GAUGE_CENTER + 12}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="7"
            fill="#6b7280"
            fontFamily="var(--font-app-sans, Arial, sans-serif)"
            letterSpacing="0.06em"
          >
            {ratingLabel[rating].toUpperCase()}
          </text>
        )}
      </svg>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
