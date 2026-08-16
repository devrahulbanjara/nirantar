"use client";

import { PencilSimpleIcon, PlusIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { Modal } from "@/components/modal";
import { DateField } from "@/components/ui/date-field";
import { editWeight, logWeight } from "@/lib/actions/weights";
import type { WeightEntry } from "@/lib/weights";
import { formatDateShortLabel, nowAsKathmanduInputValue } from "@/lib/time";

function todayInKathmandu(): string {
  return nowAsKathmanduInputValue().slice(0, 10);
}

function weightToEditValue(value: string | undefined): string {
  if (value === undefined) return "";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? String(parsed) : "";
}

export function WeightEntryDialog({
  existing,
  defaultDate,
  triggerLabel,
  triggerClassName,
}: {
  existing?: WeightEntry;
  defaultDate?: string;
  triggerLabel: string;
  triggerClassName: string;
}) {
  const router = useRouter();
  const headingId = useId();
  const weightErrorId = useId();
  const [open, setOpen] = useState(false);
  const [activeExisting, setActiveExisting] = useState(existing);
  const [measuredOn, setMeasuredOn] = useState(
    existing?.measured_on ?? defaultDate ?? todayInKathmandu(),
  );
  const [weightKg, setWeightKg] = useState(weightToEditValue(existing?.weight_kg));
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function openDialog() {
    setActiveExisting(existing);
    setMeasuredOn(existing?.measured_on ?? defaultDate ?? todayInKathmandu());
    setWeightKg(weightToEditValue(existing?.weight_kg));
    setNotes(existing?.notes ?? "");
    setError(null);
    setNotice(null);
    setOpen(true);
  }

  async function handleSave() {
    const parsed = Number(weightKg);
    if (!weightKg.trim() || !Number.isFinite(parsed) || parsed <= 0) {
      setError("Enter a weight greater than 0.");
      return;
    }

    setSaving(true);
    setError(null);

    if (activeExisting) {
      const result = await editWeight(activeExisting.measured_on, activeExisting.updated_at, {
        weight_kg: parsed,
        notes: notes.trim() || null,
      });
      setSaving(false);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setOpen(false);
      router.refresh();
      return;
    }

    const result = await logWeight({
      weight_kg: parsed,
      measured_on: measuredOn,
      notes: notes.trim() || null,
    });
    setSaving(false);

    if (!result.ok) {
      if (result.existing) {
        setActiveExisting(result.existing);
        setNotice(
          `Already logged for ${formatDateShortLabel(result.existing.measured_on)} — review below and save to correct it.`,
        );
        setError(null);
        return;
      }
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
          <PlusIcon size={18} weight="bold" aria-hidden="true" />
        )}
        {triggerLabel}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        labelledBy={headingId}
        variant="responsive-dialog"
      >
        <h2 className="modal-heading" id={headingId}>
          {activeExisting ? "Correct body weight" : "Log body weight"}
        </h2>
        {notice ? <p className="field-hint">{notice}</p> : null}
        {!activeExisting ? (
          <DateField
            id="weight-measured-on"
            label="Date"
            value={measuredOn}
            todayDate={defaultDate}
            onChange={setMeasuredOn}
          />
        ) : (
          <p className="field-hint">{formatDateShortLabel(activeExisting.measured_on)}</p>
        )}
        <div className="field">
          <label className="field-label" htmlFor="weight-value">
            Weight
          </label>
          <div className="field-with-unit">
            <input
              id="weight-value"
              className="field-input"
              type="number"
              inputMode="decimal"
              min={0}
              step={0.1}
              value={weightKg}
              aria-describedby={error ? weightErrorId : undefined}
              onChange={(event) => setWeightKg(event.target.value)}
            />
            <span className="field-unit">kg</span>
          </div>
        </div>
        {error ? (
          <p className="field-error" role="alert" id={weightErrorId}>
            <WarningCircleIcon size={16} weight="fill" aria-hidden="true" />
            {error}
          </p>
        ) : null}
        <div className="field">
          <label className="field-label" htmlFor="weight-notes">
            Notes (optional)
          </label>
          <input
            id="weight-notes"
            className="field-input"
            type="text"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>
        <div className="modal-actions">
          <button
            type="button"
            className="button-secondary"
            onClick={() => setOpen(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="button-primary"
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? "Saving…" : "Save weight"}
          </button>
        </div>
      </Modal>
    </>
  );
}
