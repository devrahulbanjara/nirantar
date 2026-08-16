"use client";

import { CalendarDotsIcon } from "@phosphor-icons/react";
import { useId, useState } from "react";

import { Modal } from "@/components/modal";
import { Calendar, formatCalendarDate } from "@/components/ui/calendar";

export function DateField({
  id,
  label,
  value,
  onChange,
  min,
  max,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
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
        <Calendar value={draft} onChange={setDraft} min={min} max={max} />
        <div className="modal-actions">
          <button type="button" className="button-secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button type="button" className="button-primary" onClick={() => { onChange(draft); setOpen(false); }}>Apply date</button>
        </div>
      </Modal>
    </div>
  );
}
