"use client";

import { CalendarDotsIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { Modal } from "@/components/modal";
import { DateField } from "@/components/ui/date-field";
import { addDaysToDateString, formatDateShortLabel } from "@/lib/time";

export function DateRangeFilter({
  basePath,
  startDate,
  endDate,
  isDefaultRange,
  todayDate,
  extraParams,
}: {
  basePath: string;
  startDate: string;
  endDate: string;
  isDefaultRange: boolean;
  todayDate: string;
  extraParams?: Record<string, string>;
}) {
  const router = useRouter();
  const headingId = useId();
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(startDate);
  const [end, setEnd] = useState(endDate);
  const invalidRange = !start || !end || end < start;

  function buildUrl(params: { start?: string; end?: string }): string {
    const search = new URLSearchParams(extraParams);
    if (params.start) search.set("start", params.start);
    if (params.end) search.set("end", params.end);
    const query = search.toString();
    return query ? `${basePath}?${query}` : basePath;
  }

  function apply() {
    if (invalidRange) return;
    router.push(buildUrl({ start, end }));
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
    <>
      <button
        type="button"
        className="button-secondary button-compact date-range-trigger"
        onClick={() => {
          setStart(startDate);
          setEnd(endDate);
          setOpen(true);
        }}
      >
        <CalendarDotsIcon size={16} weight="bold" aria-hidden="true" />
        {isDefaultRange
          ? "Filter dates"
          : `${formatDateShortLabel(startDate)} – ${formatDateShortLabel(endDate)}`}
      </button>
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
          onChange={setStart}
        />
        <DateField
          id={`${headingId}-end`}
          label="End date"
          value={end}
          min={start}
          max={todayDate}
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
    </>
  );
}
