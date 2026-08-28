"use client";

import { PlusIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useState } from "react";

import { SetFields } from "@/components/workout-form/set-fields";
import { Button } from "@/components/ui/button";
import { toDecimal, toInt, validateSetValues } from "@/components/workout-form/types";
import type { DropsetInput } from "@/lib/actions/workouts";

export function AddDropsetInline({
  nextOrder,
  onAdd,
}: {
  nextOrder: number;
  onAdd: (dropset: DropsetInput) => Promise<{ ok: boolean; message?: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({ weight_kg: "", reps: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <span className="dropset-add">
        <Button variant="secondary" size="sm" icon={PlusIcon} onClick={() => setOpen(true)}>
          Add dropset
        </Button>
      </span>
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
      weight_kg: toDecimal(values.weight_kg),
      reps: toInt(values.reps),
    });
    setSaving(false);
    if (result.ok) {
      setValues({ weight_kg: "", reps: "" });
      setOpen(false);
    } else {
      setError(result.message ?? "Could not add this dropset.");
    }
  }

  return (
    <div className="add-inline-form add-inline-form-dropset">
      <SetFields
        values={values}
        labelPrefix="New dropset"
        onChange={(field, value) => setValues({ ...values, [field]: value })}
      />
      {error ? (
        <p className="field-error" role="alert">
          <WarningCircleIcon size={14} weight="fill" aria-hidden="true" />
          {error}
        </p>
      ) : null}
      <div className="add-inline-form-actions">
        <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" loading={saving} onClick={handleAdd}>
          Save dropset
        </Button>
      </div>
    </div>
  );
}
