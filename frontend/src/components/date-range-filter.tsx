"use client";

import { CalendarDotsIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { Modal } from "@/components/modal";
import { formatDateShortLabel } from "@/lib/time";

export function DateRangeFilter({
  basePath,
  startDate,
  endDate,
  isDefaultRange,
  extraParams,
}: {
  basePath: string;
  startDate: string;
  endDate: string;
  isDefaultRange: boolean;
  extraParams?: Record<string, string>;
}) {
  const router = useRouter();
  const headingId = useId();
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(startDate);
  const [end, setEnd] = useState(endDate);

  function buildUrl(params: { start?: string; end?: string }): string {
    const search = new URLSearchParams(extraParams);
    if (params.start) search.set("start", params.start);
    if (params.end) search.set("end", params.end);
    const query = search.toString();
    return query ? `${basePath}?${query}` : basePath;
  }

  function apply() {
    router.push(buildUrl({ start, end }));
    setOpen(false);
  }

  function clear() {
    router.push(buildUrl({}));
    setOpen(false);
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
        variant="sheet"
      >
        <h2 className="modal-heading" id={headingId}>
          Filter by date
        </h2>
        <div className="field">
          <label className="field-label" htmlFor="filter-start-date">
            From
          </label>
          <input
            id="filter-start-date"
            className="field-input"
            type="date"
            value={start}
            max={end}
            onChange={(event) => setStart(event.target.value)}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="filter-end-date">
            To
          </label>
          <input
            id="filter-end-date"
            className="field-input"
            type="date"
            value={end}
            min={start}
            onChange={(event) => setEnd(event.target.value)}
          />
        </div>
        <div className="modal-actions">
          <button type="button" className="button-secondary" onClick={clear}>
            Clear
          </button>
          <button type="button" className="button-primary" onClick={apply}>
            Apply
          </button>
        </div>
      </Modal>
    </>
  );
}
