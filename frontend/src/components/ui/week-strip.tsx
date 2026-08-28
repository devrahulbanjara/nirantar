import Link from "next/link";

import { addDaysToDateString, KATHMANDU_OFFSET, KATHMANDU_TIMEZONE } from "@/lib/time";
import { eachDateInclusive } from "@/lib/workout-activity";

function weekdayLetter(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: KATHMANDU_TIMEZONE,
    weekday: "narrow",
  }).format(new Date(`${date}T00:00:00${KATHMANDU_OFFSET}`));
}

function dayNumber(date: string) {
  return Number(date.slice(8));
}

export function WeekStrip({
  today,
  selected,
  activeDates,
}: {
  today: string;
  selected: string;
  activeDates: ReadonlySet<string>;
}) {
  const days = eachDateInclusive(addDaysToDateString(today, -6), today);

  return (
    <nav className="week-strip" aria-label="Last seven days">
      {days.map((date) => {
        const isSelected = date === selected;
        const isToday = date === today;
        const hasWorkout = activeDates.has(date);
        const href = date === today ? "/" : `/?date=${date}`;
        const label = `${weekdayLetter(date)} ${dayNumber(date)}${isToday ? ", today" : ""}${hasWorkout ? ", workout logged" : ""}`;

        return (
          <Link
            className="week-strip-day"
            href={href}
            key={date}
            aria-current={isSelected ? "date" : undefined}
            aria-label={label}
            data-selected={isSelected || undefined}
            data-today={isToday || undefined}
            data-active={hasWorkout || undefined}
          >
            <span className="week-strip-weekday">{weekdayLetter(date)}</span>
            <span className="week-strip-number">{dayNumber(date)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
