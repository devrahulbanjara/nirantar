"use client";

import {
  PencilSimpleIcon,
  PlusIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useId, useState, type ReactNode } from "react";

import { Modal } from "@/components/modal";
import { DateTimeField } from "@/components/ui/date-time-field";
import { editSleep, logSleep } from "@/lib/actions/sleep";
import type { SleepEntry } from "@/lib/sleep";
import {
  addDaysToDateString,
  isoToKathmanduInputValue,
  kathmanduInputValueToIso,
  nowAsKathmanduInputValue,
} from "@/lib/time";

function defaultTimes(existing?: SleepEntry) {
  if (existing) {
    return {
      start: isoToKathmanduInputValue(existing.sleep_start),
      end: isoToKathmanduInputValue(existing.sleep_end),
      quality: existing.quality_rating?.toString() ?? "",
      notes: existing.notes ?? "",
    };
  }
  const now = nowAsKathmanduInputValue();
  return {
    start: `${addDaysToDateString(now.slice(0, 10), -1)}T22:30`,
    end: now,
    quality: "",
    notes: "",
  };
}

export function SleepEntryDialog({
  existing,
  triggerLabel = "Log sleep",
  triggerClassName = "button-secondary",
  createIcon,
}: {
  existing?: SleepEntry;
  triggerLabel?: string;
  triggerClassName?: string;
  createIcon?: ReactNode;
}) {
  const router = useRouter();
  const headingId = useId();
  const defaults = defaultTimes(existing);
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(defaults.start);
  const [end, setEnd] = useState(defaults.end);
  const [quality, setQuality] = useState(defaults.quality);
  const [notes, setNotes] = useState(defaults.notes);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openDialog() {
    const next = defaultTimes(existing);
    setStart(next.start);
    setEnd(next.end);
    setQuality(next.quality);
    setNotes(next.notes);
    setError(null);
    setOpen(true);
  }

  async function save() {
    if (!start || !end || new Date(kathmanduInputValueToIso(end)) <= new Date(kathmanduInputValueToIso(start))) {
      setError("Wake time must be after bedtime.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      sleep_start: kathmanduInputValueToIso(start),
      sleep_end: kathmanduInputValueToIso(end),
      quality_rating: quality ? Number(quality) : null,
      notes: notes.trim() || null,
    };
    const result = existing
      ? await editSleep(existing.id, existing.updated_at, payload)
      : await logSleep(payload);
    setSaving(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button type="button" className={triggerClassName} onClick={openDialog}>
        {existing ? (
          <PencilSimpleIcon size={16} weight="bold" aria-hidden="true" />
        ) : (
          createIcon ?? <PlusIcon size={18} weight="bold" aria-hidden="true" />
        )}
        {triggerLabel}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        labelledBy={headingId}
        variant="responsive-dialog"
      >
        <h2 className="modal-heading" id={headingId}>{existing ? "Correct sleep" : "Log sleep"}</h2>
        <p className="field-hint">Sleep is attributed to the local date you woke up.</p>
        <DateTimeField
          id={`${headingId}-start`}
          label="Bedtime"
          value={start}
          onChange={setStart}
        />
        <DateTimeField
          id={`${headingId}-end`}
          label="Wake time"
          value={end}
          onChange={setEnd}
        />
        <div className="field">
          <label className="field-label" htmlFor={`${headingId}-quality`}>Quality (optional)</label>
          <select id={`${headingId}-quality`} className="field-select" value={quality} onChange={(event) => setQuality(event.target.value)}>
            <option value="">Not set</option>
            {[1, 2, 3, 4, 5].map((value) => <option value={value} key={value}>{value} of 5</option>)}
          </select>
        </div>
        <div className="field">
          <label className="field-label" htmlFor={`${headingId}-notes`}>Notes (optional)</label>
          <textarea id={`${headingId}-notes`} className="field-textarea" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </div>
        {error ? <p className="field-error" role="alert"><WarningCircleIcon size={16} weight="fill" aria-hidden="true" />{error}</p> : null}
        <div className="modal-actions">
          <button type="button" className="button-secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button type="button" className="button-primary" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save sleep"}</button>
        </div>
      </Modal>
    </>
  );
}
