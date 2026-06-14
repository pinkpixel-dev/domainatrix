"use client";

type ExpiryRingProps = {
  label: string;
  daysRemaining: number | null;
  maxDays: number;
  subtitle?: string;
};

const RADIUS = 36;
const STROKE = 4;
const CENTER = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Circular SVG progress ring showing days remaining before an expiry event.
 *
 * Color zones:
 *   - > 60d  → muted (gray)
 *   - 30–60d → amber
 *   - < 30d  → red
 *   - null / unknown → dashed ring, "—" center
 */
export function ExpiryRing({ label, daysRemaining, maxDays, subtitle }: ExpiryRingProps) {
  const isUnknown = daysRemaining === null;
  const clamped = isUnknown ? 0 : Math.max(0, Math.min(daysRemaining, maxDays));
  const fraction = isUnknown ? 0 : clamped / maxDays;
  const offset = CIRCUMFERENCE * (1 - fraction);

  const ringColor = isUnknown
    ? "#4b5563" // gray-600 — unknown/untracked
    : daysRemaining! < 30
      ? "#f87171" // red-400
      : daysRemaining! < 60
        ? "#fbbf24" // amber-400
        : "#6b7280"; // gray-500 — healthy, muted

  const trackColor = "rgba(255,255,255,0.06)";

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width={CENTER * 2}
        height={CENTER * 2}
        viewBox={`0 0 ${CENTER * 2} ${CENTER * 2}`}
        aria-label={`${label}: ${daysRemaining !== null ? `${daysRemaining} days remaining` : "unknown"}`}
      >
        {/* Track */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke={trackColor}
          strokeWidth={STROKE}
        />

        {/* Progress ring */}
        {isUnknown ? (
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke={ringColor}
            strokeWidth={STROKE}
            strokeDasharray="4 6"
            transform={`rotate(-90 ${CENTER} ${CENTER})`}
          />
        ) : (
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke={ringColor}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${CENTER} ${CENTER})`}
            style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.4s ease" }}
          />
        )}

        {/* Center text */}
        <text
          x={CENTER}
          y={CENTER - 4}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="18"
          fontWeight="600"
          fill={isUnknown ? "#6b7280" : ringColor}
          fontFamily="var(--font-app-sans, Arial, sans-serif)"
        >
          {isUnknown ? "—" : daysRemaining! <= 999 ? daysRemaining : "999+"}
        </text>
        <text
          x={CENTER}
          y={CENTER + 14}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="9"
          fill="#6b7280"
          fontFamily="var(--font-app-sans, Arial, sans-serif)"
          letterSpacing="0.08em"
        >
          DAYS
        </text>
      </svg>

      <div className="text-center">
        <p className="text-xs font-medium">{label}</p>
        {subtitle && (
          <p className="mt-0.5 text-[10px] text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
