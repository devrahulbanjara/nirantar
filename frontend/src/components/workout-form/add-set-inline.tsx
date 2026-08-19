"use client";

import { PlusIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useState } from "react";

import { SetFields } from "@/components/workout-form/set-fields";
import { toDecimal, toInt, validateSetValues } from "@/components/workout-form/types";
import type { SetInput } from "@/lib/actions/workouts";

export function AddSetInline({
  nextOrder,
  onAdd,
}: {
  nextOrder: number;
  onAdd: (set: SetInput) => Promise<{ ok: boolean; message?: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"warmup" | "working">("working");
  const [values, setValues] = useState({ weight_kg: "", reps: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        type="button"
        className="button-secondary button-compact exercise-builder-add-set-trigger"
        onClick={() => setOpen(true)}
      >
        <PlusIcon size={16} weight="bold" aria-hidden="true" />
        Add set
      </button>
    );
  }

  async function handleAdd() {
    const validationError = validateSetValues(values);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError(null);
    const result = await onAdd({
      order: nextOrder,
      type,
      weight_kg: toDecimal(values.weight_kg),
      reps: toInt(values.reps),
      dropsets: [],
    });
    setSaving(false);
    if (result.ok) {
      setValues({ weight_kg: "", reps: "" });
      setOpen(false);
    } else {
      setError(result.message ?? "Could not add this set.");
    }
  }

  return (
    <div className="add-inline-form">
      <label className="set-type-select">
        <span className="visually-hidden">New set type</span>
        <select
          className="field-select"
          value={type}
          onChange={(event) => setType(event.target.value as "warmup" | "working")}
        >
          <option value="warmup">Warm-up</option>
          <option value="working">Working</option>
        </select>
      </label>
      <SetFields
        values={values}
        labelPrefix="New set"
        onChange={(field, value) => setValues({ ...values, [field]: value })}
      />
      {error ? (
        <p className="field-error" role="alert">
          <WarningCircleIcon size={14} weight="fill" aria-hidden="true" />
          {error}
        </p>
      ) : null}
      <div className="add-inline-form-actions">
        <button
          type="button"
          className="button-secondary button-compact"
          onClick={() => setOpen(false)}
        >
          Cancel
        </button>
        <button
          type="button"
          className="button-primary button-compact"
          disabled={saving}
          onClick={handleAdd}
        >
          {saving ? "Saving…" : "Save set"}
        </button>
      </div>
    </div>
  );
}
