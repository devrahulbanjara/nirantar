import Link from "next/link";
import type { CSSProperties } from "react";

import {
  formatDateFullLabel,
  KATHMANDU_OFFSET,
} from "@/lib/time";
import type { ActivityCell } from "@/lib/workout-activity";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"] as const;
const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function cellAriaLabel(cell: ActivityCell): string {
  const dayLabel = formatDateFullLabel(cell.date);
  if (!cell.inRange) return `${dayLabel}: outside selected range`;
  if (cell.workoutCount === 0) return `${dayLabel}: No workout`;
  if (cell.workoutCount === 1) return `${dayLabel}: 1 workout`;
  return `${dayLabel}: ${cell.workoutCount} workouts`;
}

function monthLabelForColumn(
  cells: ActivityCell[],
  columnIndex: number,
): string | null {
  const first = cells[columnIndex * 7];
  if (!first?.inRange) return null;
  const previous = columnIndex > 0 ? cells[(columnIndex - 1) * 7] : null;
  const month = new Intl.DateTimeFormat("en-US", {
    month: "short",
    timeZone: "Asia/Kathmandu",
  }).format(new Date(`${first.date}T00:00:00${KATHMANDU_OFFSET}`));
  if (!previous?.inRange) return month;
  const previousMonth = new Intl.DateTimeFormat("en-US", {
    month: "short",
    timeZone: "Asia/Kathmandu",
  }).format(new Date(`${previous.date}T00:00:00${KATHMANDU_OFFSET}`));
  return month === previousMonth ? null : month;
}

export function WorkoutActivityCalendar({
  cells,
  activeDayCount,
  windowLabel = "the last year",
}: {
  cells: ActivityCell[];
  activeDayCount: number;
  windowLabel?: string;
}) {
  const columnCount = Math.ceil(cells.length / 7);
  const chartStyle = {
    "--week-count": columnCount,
  } as CSSProperties;

  return (
    <div className="workout-activity">
      <p className="workout-activity-summary">
        {activeDayCount === 0
          ? `No workout days in ${windowLabel}`
          : activeDayCount === 1
            ? `1 workout day in ${windowLabel}`
            : `${activeDayCount} workout days in ${windowLabel}`}
      </p>

      <div className="workout-activity-scroll">
        <div
          className="workout-activity-chart"
          style={chartStyle}
          role="img"
          aria-label={`Workout activity calendar for ${windowLabel}`}
        >
          <div className="workout-activity-months" aria-hidden="true">
            {Array.from({ length: columnCount }, (_, columnIndex) => (
              <span className="workout-activity-month" key={`month-${columnIndex}`}>
                {monthLabelForColumn(cells, columnIndex) ?? ""}
              </span>
            ))}
          </div>

          <div className="workout-activity-weekdays" aria-hidden="true">
            {WEEKDAY_LABELS.map((label, index) => (
              <span
                className="workout-activity-weekday"
                data-emphasis={index % 2 === 1 || undefined}
                key={`${WEEKDAY_NAMES[index]}-${label}`}
              >
                {index % 2 === 1 ? label : ""}
              </span>
            ))}
          </div>

          <div className="workout-activity-grid">
            {cells.map((cell) => {
              const className = "workout-activity-cell";
              const label = cellAriaLabel(cell);
              if (!cell.inRange) {
                return (
                  <span
                    className={className}
                    data-level="0"
                    data-outside="true"
                    aria-hidden="true"
                    key={cell.date}
                  />
                );
              }
              return (
                <Link
                  href={`/workouts?start=${cell.date}&end=${cell.date}`}
                  className={className}
                  data-level={cell.level}
                  aria-label={label}
                  title={label}
                  key={cell.date}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="workout-activity-legend" aria-hidden="true">
        <span>Less</span>
        <span className="workout-activity-cell" data-level="0" />
        <span className="workout-activity-cell" data-level="1" />
        <span>More</span>
      </div>
    </div>
  );
}
