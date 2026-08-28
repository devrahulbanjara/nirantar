"use client";

import { WarningCircleIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { Modal } from "@/components/modal";
import {
  Button,
  type ButtonSize,
  type ButtonVariant,
} from "@/components/ui/button";
import { TRIGGER_GLYPHS, type TriggerGlyph } from "@/components/ui/trigger-glyph";
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
  triggerVariant = "primary",
  triggerSize = "md",
  triggerGlyph,
}: {
  existing?: SleepEntry;
  triggerLabel?: string;
  /** Emphasis comes from the action's role. See DESIGN.md -> Action hierarchy. */
  triggerVariant?: ButtonVariant;
  triggerSize?: ButtonSize;
  /** Closed name only — never pass an icon component across the RSC boundary. */
  triggerGlyph?: TriggerGlyph;
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
    <div className="entry-dialog-root">
      <Button
        variant={triggerVariant}
        size={triggerSize}
        icon={TRIGGER_GLYPHS[triggerGlyph ?? (existing ? "pencil" : "plus")]}
        onClick={openDialog}
      >
        {triggerLabel}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        labelledBy={headingId}
        variant="responsive-dialog"
      >
        <h2 className="modal-heading" id={headingId}>{existing ? "Correct sleep" : "Log sleep"}</h2>
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
          <p className="field-label" id={`${headingId}-quality`}>Quality (optional)</p>
          <div
            className="field-scale"
            role="radiogroup"
            aria-labelledby={`${headingId}-quality`}
            onKeyDown={(event) => {
              if (
                event.key !== "ArrowRight" &&
                event.key !== "ArrowLeft" &&
                event.key !== "ArrowDown" &&
                event.key !== "ArrowUp"
              ) {
                return;
              }
              event.preventDefault();
              const current = quality ? Number(quality) : 0;
              const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
              const next = Math.min(5, Math.max(1, (current || (step > 0 ? 0 : 6)) + step));
              setQuality(String(next));
              event.currentTarget
                .querySelectorAll<HTMLButtonElement>("[role=radio]")
                [next - 1]?.focus();
            }}
          >
            {[1, 2, 3, 4, 5].map((value) => {
              const selected = quality === String(value);
              return (
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  tabIndex={selected || (!quality && value === 1) ? 0 : -1}
                  className="field-scale-option"
                  data-rating={value}
                  key={value}
                  onClick={() => setQuality(selected ? "" : String(value))}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
        <div className="field">
          <label className="field-label" htmlFor={`${headingId}-notes`}>Notes (optional)</label>
          <textarea id={`${headingId}-notes`} className="field-textarea" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </div>
        {error ? <p className="field-error" role="alert"><WarningCircleIcon size={16} weight="fill" aria-hidden="true" />{error}</p> : null}
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" loading={saving} onClick={save}>
            Save sleep
          </Button>
        </div>
      </Modal>
    </div>
  );
}
