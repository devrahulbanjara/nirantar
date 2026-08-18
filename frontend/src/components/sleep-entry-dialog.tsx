"use client";

import { MoonIcon, PencilSimpleIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { Modal } from "@/components/modal";
import { editSleep, logSleep } from "@/lib/actions/sleep";
import type { SleepEntry } from "@/lib/sleep";
import {
  addDaysToDateString,
  isoToKathmanduInputValue,
  kathmanduInputValueToIso,
  nowAsKathmanduInputValue,
} from "@/lib/time";

export function SleepEntryDialog({
  existing,
  triggerLabel = "Log sleep",
  triggerClassName = "button-secondary",
}: {
  existing?: SleepEntry;
  triggerLabel?: string;
  triggerClassName?: string;
}) {
  const router = useRouter();
  const headingId = useId();
  const now = nowAsKathmanduInputValue();
  const defaultStart = `${addDaysToDateString(now.slice(0, 10), -1)}T22:30`;
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(existing ? isoToKathmanduInputValue(existing.sleep_start) : defaultStart);
  const [end, setEnd] = useState(existing ? isoToKathmanduInputValue(existing.sleep_end) : now);
  const [quality, setQuality] = useState(existing?.quality_rating?.toString() ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <button type="button" className={triggerClassName} onClick={() => setOpen(true)}>
        {existing ? <PencilSimpleIcon size={17} weight="bold" /> : <MoonIcon size={18} weight="bold" />}
        {triggerLabel}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} labelledBy={headingId} variant="sheet">
        <h2 className="modal-heading" id={headingId}>{existing ? "Correct sleep" : "Log sleep"}</h2>
        <p className="field-hint">Sleep is attributed to the local date you woke up.</p>
        <div className="field">
          <label className="field-label" htmlFor={`${headingId}-start`}>Bedtime</label>
          <input id={`${headingId}-start`} className="field-input" type="datetime-local" value={start} onChange={(event) => setStart(event.target.value)} />
        </div>
        <div className="field">
          <label className="field-label" htmlFor={`${headingId}-end`}>Wake time</label>
          <input id={`${headingId}-end`} className="field-input" type="datetime-local" value={end} onChange={(event) => setEnd(event.target.value)} />
        </div>
        <div className="field">
          <label className="field-label" htmlFor={`${headingId}-quality`}>Quality (optional)</label>
          <select id={`${headingId}-quality`} className="field-input" value={quality} onChange={(event) => setQuality(event.target.value)}>
            <option value="">Not set</option>
            {[1, 2, 3, 4, 5].map((value) => <option value={value} key={value}>{value} of 5</option>)}
          </select>
        </div>
        <div className="field">
          <label className="field-label" htmlFor={`${headingId}-notes`}>Notes (optional)</label>
          <textarea id={`${headingId}-notes`} className="field-textarea" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </div>
        {error ? <p className="field-error" role="alert"><WarningCircleIcon size={16} weight="fill" />{error}</p> : null}
        <div className="modal-actions">
          <button type="button" className="button-secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button type="button" className="button-primary" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save sleep"}</button>
        </div>
      </Modal>
    </>
  );
}
