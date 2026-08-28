"use client";

import { CalendarDotsIcon } from "@phosphor-icons/react";
import { useId, useState } from "react";

import { Modal } from "@/components/modal";
import { Button } from "@/components/ui/button";
import { Calendar, formatCalendarDate } from "@/components/ui/calendar";

export function DateField({
  id,
  label,
  value,
  onChange,
  min,
  max,
  todayDate,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  todayDate?: string;
}) {
  const headingId = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  return (
    <div className="field">
      <span className="field-label" id={`${id}-label`}>{label}</span>
      <button id={id} type="button" className="date-time-trigger" aria-labelledby={`${id}-label ${id}`} onClick={() => { setDraft(value); setOpen(true); }}>
        <span>{formatCalendarDate(value)}</span>
        <CalendarDotsIcon size={20} weight="bold" aria-hidden="true" />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} labelledBy={headingId} variant="responsive-dialog">
        <h2 className="modal-heading" id={headingId}>{label}</h2>
        <Calendar value={draft} onChange={setDraft} min={min} max={max} todayDate={todayDate} />
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              onChange(draft);
              setOpen(false);
            }}
          >
            Apply date
          </Button>
        </div>
      </Modal>
    </div>
  );
}
