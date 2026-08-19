"use client";

import { CalendarDotsIcon } from "@phosphor-icons/react";
import { useId, useState } from "react";

import { Modal } from "@/components/modal";
import { Calendar } from "@/components/ui/calendar";
import { getKathmanduDate } from "@/lib/time";

function parts(value: string) {
  const [date = "", time = "00:00"] = value.split("T");
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return { year, month, day, hour, minute };
}

function valueFor(year: number, month: number, day: number, hour: number, minute: number) {
  const pad = (number: number) => String(number).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}`;
}

function displayValue(value: string) {
  const current = parts(value);
  if (!current.year) return "Choose date and time";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(current.year, current.month - 1, current.day, current.hour, current.minute));
}

export function DateTimeField({
  id,
  label,
  value,
  onChange,
  onCommit,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onCommit?: (value: string) => void | Promise<void>;
}) {
  const headingId = useId();
  const initial = parts(value);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(initial);
  const minutes = [...new Set([...Array.from({ length: 12 }, (_, index) => index * 5), draft.minute])].sort((a, b) => a - b);

  function openPicker() {
    const next = parts(value);
    setDraft(next);
    setOpen(true);
  }

  async function apply() {
    const next = valueFor(draft.year, draft.month, draft.day, draft.hour, draft.minute);
    onChange(next);
    setOpen(false);
    await onCommit?.(next);
  }

  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>{label}</label>
      <button id={id} type="button" className="date-time-trigger" onClick={openPicker}>
        <span>{displayValue(value)}</span>
        <CalendarDotsIcon size={20} weight="bold" aria-hidden="true" />
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        labelledBy={headingId}
        variant="responsive-dialog"
      >
        <div className="date-time-picker">
          <h2 className="modal-heading" id={headingId}>{label}</h2>
          <Calendar
            value={valueFor(draft.year, draft.month, draft.day, 0, 0).slice(0, 10)}
            todayDate={getKathmanduDate()}
            onChange={(next) => {
              const selected = parts(`${next}T00:00`);
              setDraft({ ...draft, year: selected.year, month: selected.month, day: selected.day });
            }}
          />
          <div className="time-controls">
            <label><span>Hour</span><select className="field-select" value={draft.hour} onChange={(event) => setDraft({ ...draft, hour: Number(event.target.value) })}>{Array.from({ length: 24 }, (_, hour) => <option value={hour} key={hour}>{String(hour).padStart(2, "0")}</option>)}</select></label>
            <label><span>Minute</span><select className="field-select" value={draft.minute} onChange={(event) => setDraft({ ...draft, minute: Number(event.target.value) })}>{minutes.map((minute) => <option value={minute} key={minute}>{String(minute).padStart(2, "0")}</option>)}</select></label>
          </div>
          <div className="modal-actions"><button type="button" className="button-secondary" onClick={() => setOpen(false)}>Cancel</button><button type="button" className="button-primary" onClick={apply}>Apply date and time</button></div>
        </div>
      </Modal>
    </div>
  );
}
