import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react/dist/ssr";

import { IconButton } from "@/components/ui/button";
import {
  addDaysToDateString,
  dayHeading,
  dayHref,
  formatDateFullLabel,
} from "@/lib/time";

export function DayNavigator({
  basePath,
  date,
  today,
  extraParams,
}: {
  basePath: string;
  date: string;
  today: string;
  extraParams?: Record<string, string>;
}) {
  const previous = addDaysToDateString(date, -1);
  const next = addDaysToDateString(date, 1);
  const heading = dayHeading(date, today);
  const relative =
    heading === "Today" || heading === "Yesterday" || heading === "Tomorrow";

  return (
    <nav className="day-navigator" aria-label="Choose a day">
      <IconButton
        icon={CaretLeftIcon}
        label={`Previous day, ${formatDateFullLabel(previous)}`}
        href={dayHref(basePath, previous, today, extraParams)}
      />
      <p className="day-navigator-label">
        <span>{relative ? heading : formatDateFullLabel(date)}</span>
        {relative ? (
          <span className="day-navigator-date">{formatDateFullLabel(date)}</span>
        ) : null}
      </p>
      <IconButton
        icon={CaretRightIcon}
        label={`Next day, ${formatDateFullLabel(next)}`}
        href={dayHref(basePath, next, today, extraParams)}
      />
    </nav>
  );
}
