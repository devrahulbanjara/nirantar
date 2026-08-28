import { FireIcon } from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";

import type { IconTone } from "@/components/ui/metric-tile";
import type { MacroItem } from "@/lib/nutrition";

function clampPercent(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  const amount = Number(raw);
  if (!Number.isFinite(amount)) return null;
  return Math.max(0, amount);
}

export function ProgressRing({
  label,
  value,
  unit,
  target,
  percentage,
  tone = "workouts",
  emptyLabel = "Not provided",
}: {
  label: string;
  value: string | null;
  unit: string;
  target?: string | null;
  percentage?: string | null;
  tone?: IconTone;
  emptyLabel?: string;
}) {
  const ratio = clampPercent(percentage);
  const known = value !== null;
  const over = ratio !== null && ratio > 100;
  const fill = known ? Math.min(100, ratio ?? 100) : 0;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - fill / 100);
  const name = known
    ? target
      ? `${label} ${value} of ${target} ${unit}`
      : `${label} ${value} ${unit}`
    : `${label} ${emptyLabel}`;

  return (
    <div className="progress-ring" data-tone={tone}>
      <svg
        viewBox="0 0 108 108"
        role="img"
        aria-label={name}
        className="progress-ring-svg"
      >
        <circle className="progress-ring-track" cx="54" cy="54" r={radius} />
        <circle
          className="progress-ring-fill"
          cx="54"
          cy="54"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="progress-ring-centre">
        <p className="metric-value">
          <span>{known ? value : emptyLabel}</span>
          {known ? <abbr>{unit}</abbr> : null}
        </p>
        {known && target ? (
          <p className="metric-hint">
            {over ? `Over ${target}` : `/ ${target}`}
          </p>
        ) : (
          <p className="metric-label">{label}</p>
        )}
      </div>
    </div>
  );
}

export function GaugeBar({
  label,
  value,
  unit,
  target,
  percentage,
  tone = "workouts",
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  target?: ReactNode;
  percentage?: string | number | null;
  tone?: IconTone;
}) {
  const ratio = clampPercent(percentage);
  const over = ratio !== null && ratio > 100;
  const width = ratio === null ? 0 : Math.min(100, ratio);
  const name =
    target === undefined || target === null
      ? `${label} ${value}${unit ? ` ${unit}` : ""}`
      : `${label} ${value} of ${target}${unit ? ` ${unit}` : ""}`;

  return (
    <div className="gauge-bar" data-tone={tone} data-over={over || undefined}>
      <div className="gauge-bar-copy">
        <p className="metric-label">{label}</p>
        <p className="gauge-bar-values">
          <span>{value}</span>
          {target !== undefined && target !== null ? (
            <>
              <span aria-hidden="true"> / </span>
              <span>{target}</span>
            </>
          ) : null}
          {unit ? <abbr>{unit}</abbr> : null}
        </p>
      </div>
      <div
        className="gauge-bar-track"
        role="img"
        aria-label={over ? `${name}, over target` : name}
      >
        <span style={{ width: `${width}%` }} />
      </div>
      {over ? <p className="metric-hint">Over target</p> : null}
    </div>
  );
}

const RING_GEOMETRY = [
  { tone: "calories" as const, r: 66 },
  { tone: "protein" as const, r: 52 },
  { tone: "carbs" as const, r: 38 },
  { tone: "fat" as const, r: 24 },
];

export function MacroRings({ items }: { items: MacroItem[] }) {
  const byTone = new Map(items.map((item) => [item.tone, item]));
  const summary = items
    .map((item) =>
      item.value === null
        ? `${item.label} not provided`
        : item.target
          ? `${item.label} ${item.value} of ${item.target} ${item.unit}`
          : `${item.label} ${item.value} ${item.unit}`,
    )
    .join(". ");

  return (
    <div className="macro-rings">
      <svg
        className="macro-rings-svg"
        viewBox="0 0 160 160"
        role="img"
        aria-label={summary}
      >
        {RING_GEOMETRY.map(({ tone, r }) => {
          const item = byTone.get(tone);
          const ratio = clampPercent(item?.percentage);
          const known = item?.value !== null && item?.value !== undefined;
          const fill = known ? Math.min(100, ratio ?? 100) : 0;
          const circumference = 2 * Math.PI * r;
          return (
            <g key={tone} data-tone={tone}>
              <circle className="macro-rings-track" cx="80" cy="80" r={r} />
              <circle
                className="macro-rings-fill"
                cx="80"
                cy="80"
                r={r}
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - fill / 100)}
              />
            </g>
          );
        })}
      </svg>
      <MacroGrid items={items} compact />
    </div>
  );
}

export function MacroGrid({
  items,
  compact = false,
}: {
  items: MacroItem[];
  compact?: boolean;
}) {
  return (
    <div className="macro-grid" data-compact={compact || undefined}>
      {items.map((item) => {
        const empty = item.value === null;
        return (
          <div
            className="metric-tile"
            data-tone={item.tone}
            data-empty={empty || undefined}
            key={item.tone}
          >
            <div className="metric-tile-head">
              {item.tone === "calories" ? (
                <FireIcon
                  className="metric-tile-icon"
                  size={14}
                  weight="bold"
                  aria-hidden="true"
                />
              ) : null}
              <p className="metric-label">{item.label}</p>
            </div>
            <p className="metric-value">
              <span>{empty ? "Not provided" : item.value}</span>
              {!empty ? <abbr>{item.unit}</abbr> : null}
            </p>
            {item.target && !empty ? (
              <p className="metric-hint">/ {item.target}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function TrendChart({
  label,
  unit,
  points,
}: {
  label: string;
  unit: string;
  points: Array<{ date: string; value: number }>;
}) {
  if (points.length === 0) return null;

  const width = 320;
  const height = 128;
  const padX = 12;
  const padY = 16;
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const innerWidth = width - padX * 2;
  const innerHeight = height - padY * 2;
  const coords = points.map((point, index) => {
    const x =
      points.length === 1
        ? width / 2
        : padX + (index / (points.length - 1)) * innerWidth;
    const y = padY + (1 - (point.value - min) / span) * innerHeight;
    return { x, y, ...point };
  });
  const path = coords
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`)
    .join(" ");
  const latest = points[points.length - 1];
  const name = `${label} from ${points[0].value} to ${latest.value} ${unit}`;

  return (
    <figure className="trend-chart">
      <div className="trend-chart-heading">
        <p className="metric-label">{label}</p>
        <p className="metric-hero">
          {latest.value.toLocaleString("en-US", { maximumFractionDigits: 3 })}
          <abbr>{unit}</abbr>
        </p>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={name}>
        <path className="trend-chart-line" d={path} />
        {coords.map((point) => (
          <circle
            className="trend-chart-point"
            cx={point.x}
            cy={point.y}
            r="4"
            key={point.date}
          />
        ))}
      </svg>
    </figure>
  );
}

export function StatusBadge({
  tone,
  children,
}: {
  tone: "success" | "warning" | "neutral";
  children: ReactNode;
}) {
  return (
    <span className="status-badge" data-tone={tone}>
      {children}
    </span>
  );
}
