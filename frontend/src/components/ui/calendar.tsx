"use client";

import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";

import { IconButton } from "@/components/ui/button";

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return { year, month, day };
}

function dateValue(year: number, month: number, day: number) {
  const pad = (number: number) => String(number).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}`;
}

function daysFor(year: number, month: number) {
  const leading = new Date(year, month - 1, 1).getDay();
  const count = new Date(year, month, 0).getDate();
  return [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: count }, (_, index) => index + 1),
  ];
}

export function Calendar({
  value,
  onChange,
  min,
  max,
  todayDate,
}: {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  todayDate?: string;
}) {
  const selected = parseDate(value);
  const [visible, setVisible] = useState({ year: selected.year, month: selected.month });
  const days = useMemo(() => daysFor(visible.year, visible.month), [visible]);

  function moveMonth(offset: number) {
    const next = new Date(visible.year, visible.month - 1 + offset, 1);
    setVisible({ year: next.getFullYear(), month: next.getMonth() + 1 });
  }

  return (
    <div className="calendar-picker">
      <div className="date-time-picker-header">
        <p className="calendar-month" aria-live="polite">
          {new Intl.DateTimeFormat("en-US", {
            month: "long",
            year: "numeric",
          }).format(new Date(visible.year, visible.month - 1, 1))}
        </p>
        <div className="calendar-navigation">
          <IconButton
            icon={CaretLeftIcon}
            label="Previous month"
            onClick={() => moveMonth(-1)}
          />
          <IconButton
            icon={CaretRightIcon}
            label="Next month"
            onClick={() => moveMonth(1)}
          />
        </div>
      </div>
      <div className="calendar-grid" role="grid">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
          <span className="calendar-weekday" key={`${day}-${index}`}>{day}</span>
        ))}
        {days.map((day, index) => {
          if (!day) return <span key={`empty-${index}`} />;
          const next = dateValue(visible.year, visible.month, day);
          const disabled = Boolean((min && next < min) || (max && next > max));
          const isToday = todayDate === next;
          const isSelected = next === value;
          const dayLabel = new Intl.DateTimeFormat("en-US", { dateStyle: "full" }).format(
            new Date(visible.year, visible.month - 1, day),
          );
          return (
            <button
              type="button"
              className="calendar-day"
              data-selected={isSelected || undefined}
              data-today={isToday || undefined}
              aria-label={isToday ? `Today, ${dayLabel}` : dayLabel}
              aria-current={isToday ? "date" : undefined}
              aria-pressed={isSelected}
              disabled={disabled}
              onClick={() => onChange(next)}
              key={next}
            >
              <span className="calendar-day-number">{day}</span>
              {isToday ? <span className="calendar-day-today-mark">Today</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function formatCalendarDate(value: string) {
  const { year, month, day } = parseDate(value);
  if (!year) return "Choose date";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}
