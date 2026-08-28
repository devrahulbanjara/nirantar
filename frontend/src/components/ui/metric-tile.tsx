import type { Icon } from "@phosphor-icons/react";
import type { ReactNode } from "react";

export type IconTone =
  | "workouts"
  | "meals"
  | "sleep"
  | "weight"
  | "calories"
  | "protein"
  | "carbs"
  | "fat"
  | "neutral";

export function DomainIcon({
  tone,
  icon: IconComponent,
}: {
  tone: IconTone;
  icon: Icon;
}) {
  return (
    <span className="icon-surface" data-tone={tone} aria-hidden="true">
      <IconComponent size={22} weight="bold" />
    </span>
  );
}

export function MetricTile({
  label,
  value,
  unit,
  tone = "neutral",
  icon,
  hint,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  tone?: IconTone;
  icon?: Icon;
  hint?: ReactNode;
}) {
  const empty = value === null || value === undefined || value === "Not provided";

  return (
    <div className="metric-tile" data-tone={tone} data-empty={empty || undefined}>
      {icon ? <DomainIcon tone={tone} icon={icon} /> : null}
      <p className="metric-label">{label}</p>
      <p className="metric-value">
        <span>{empty ? "Not provided" : value}</span>
        {!empty && unit ? <abbr>{unit}</abbr> : null}
      </p>
      {hint ? <p className="metric-hint">{hint}</p> : null}
    </div>
  );
}
