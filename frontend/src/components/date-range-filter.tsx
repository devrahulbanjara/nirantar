"use client";

import { CalendarDotsIcon, XIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { Modal } from "@/components/modal";
import { DateField } from "@/components/ui/date-field";
import {
  addDaysToDateString,
  formatDateLabel,
  formatDateShortLabel,
} from "@/lib/time";

function formatActiveRangeLabel(
  startDate: string,
  endDate: string,
  todayDate: string,
): string {
  if (startDate === endDate) {
    const dayLabel = formatDateLabel(startDate);
    return startDate === todayDate ? `Today · ${dayLabel}` : dayLabel;
  }
  return `${formatDateShortLabel(startDate)} – ${formatDateShortLabel(endDate)}`;
}

export function DateRangeFilter({
  basePath,
  startDate,
  endDate,
  isDefaultRange,
  todayDate,
  extraParams,
  clearBehavior = "omit-params",
}: {
  basePath: string;
  startDate: string;
  endDate: string;
  isDefaultRange: boolean;
  todayDate: string;
  extraParams?: Record<string, string>;
  /** `today` clears to the page default (no start/end). `omit-params` same URL shape for History's longer default. */
  clearBehavior?: "today" | "omit-params";
}) {
  const router = useRouter();
  const headingId = useId();
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(startDate);
  const [end, setEnd] = useState(endDate);
  const invalidRange = !start || !end || end < start;
  const rangeLabel = formatActiveRangeLabel(startDate, endDate, todayDate);

  function buildUrl(params: { start?: string; end?: string }): string {
    const search = new URLSearchParams(extraParams);
    if (params.start) search.set("start", params.start);
    if (params.end) search.set("end", params.end);
    const query = search.toString();
    return query ? `${basePath}?${query}` : basePath;
  }

  function apply() {
    if (invalidRange) return;
    if (start === todayDate && end === todayDate && clearBehavior === "today") {
      router.push(buildUrl({}));
    } else {
      router.push(buildUrl({ start, end }));
    }
    setOpen(false);
  }

  function clear() {
    router.push(buildUrl({}));
    setOpen(false);
  }

  function setPreset(days: number) {
    setEnd(todayDate);
    setStart(addDaysToDateString(todayDate, -(days - 1)));
  }

  return (
    <div className="history-filter-bar">
      <button
        type="button"
        className="button-secondary button-compact date-range-trigger"
        aria-label={`Filter dates, currently ${rangeLabel}`}
        onClick={() => {
          setStart(startDate);
          setEnd(endDate);
          setOpen(true);
        }}
      >
        <CalendarDotsIcon size={16} weight="bold" aria-hidden="true" />
        <span className="date-range-trigger-label">{rangeLabel}</span>
      </button>
      {!isDefaultRange ? (
        <button
          type="button"
          className="icon-button date-range-clear"
          aria-label="Clear date filter"
          onClick={clear}
        >
          <XIcon size={16} weight="bold" aria-hidden="true" />
        </button>
      ) : null}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        labelledBy={headingId}
        variant="responsive-dialog"
      >
        <h2 className="modal-heading" id={headingId}>
          Filter by date
        </h2>
        <div className="date-range-presets" aria-label="Date range shortcuts">
          <button type="button" className="filter-chip" onClick={() => setPreset(1)}>
            Today
          </button>
          <button type="button" className="filter-chip" onClick={() => setPreset(7)}>
            Last 7 days
          </button>
          <button type="button" className="filter-chip" onClick={() => setPreset(30)}>
            Last 30 days
          </button>
        </div>
        <DateField
          id={`${headingId}-start`}
          label="Start date"
          value={start}
          max={end}
          todayDate={todayDate}
          onChange={setStart}
        />
        <DateField
          id={`${headingId}-end`}
          label="End date"
          value={end}
          min={start}
          max={todayDate}
          todayDate={todayDate}
          onChange={setEnd}
        />
        {invalidRange ? (
          <p className="field-error" id={`${headingId}-error`} role="alert">
            Choose a start date on or before the end date.
          </p>
        ) : null}
        <div className="modal-actions">
          <button type="button" className="button-secondary" onClick={clear}>
            Clear
          </button>
          <button
            type="button"
            className="button-primary"
            onClick={apply}
            disabled={invalidRange}
          >
            Apply dates
          </button>
        </div>
      </Modal>
    </div>
  );
}
