"use client";

import { TrashIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { SetFields } from "@/components/workout-form/set-fields";
import {
  decimalToEditValue,
  toDecimal,
  toInt,
  validateSetValues,
} from "@/components/workout-form/types";
import type { WorkoutEditOperation } from "@/lib/actions/workouts";
import type { ExerciseSet } from "@/lib/workouts";

type EditableValues = {
  weight_kg: string;
  reps: string;
  rir: string;
  rpe: string;
};

type OpResult = { ok: boolean; message?: string };

function toValues(set: Pick<ExerciseSet, "weight_kg" | "reps" | "rir" | "rpe">): EditableValues {
  return {
    weight_kg: decimalToEditValue(set.weight_kg),
    reps: set.reps === null ? "" : String(set.reps),
    rir: decimalToEditValue(set.rir),
    rpe: decimalToEditValue(set.rpe),
  };
}

export function EditableSetRow({
  set,
  label,
  hasDropsets = false,
  onRemove,
  onCommit,
}: {
  set: Pick<ExerciseSet, "id" | "weight_kg" | "reps" | "rir" | "rpe">;
  label: string;
  hasDropsets?: boolean;
  onRemove: () => Promise<OpResult>;
  onCommit: (
    op: Extract<WorkoutEditOperation, { operation: "update_set" }>,
  ) => Promise<OpResult>;
}) {
  const [values, setValues] = useState<EditableValues>(() => toValues(set));
  const [committed, setCommitted] = useState<EditableValues>(() => toValues(set));
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  async function commitIfChanged() {
    const validationError = validateSetValues(values);
    if (validationError) {
      setError(validationError);
      return;
    }

    const changes: Record<string, number | null> = {};
    if (values.weight_kg !== committed.weight_kg) {
      changes.weight_kg = toDecimal(values.weight_kg);
    }
    if (values.reps !== committed.reps) {
      changes.reps = toInt(values.reps);
    }
    if (values.rir !== committed.rir) {
      changes.rir = toDecimal(values.rir);
    }
    if (values.rpe !== committed.rpe) {
      changes.rpe = toDecimal(values.rpe);
    }
    if (Object.keys(changes).length === 0) return;

    setError(null);
    const result = await onCommit({
      operation: "update_set",
      set_id: set.id,
      ...changes,
    });
    if (result.ok) {
      setCommitted(values);
    } else {
      setError(result.message ?? "Could not save this set.");
    }
  }

  async function handleConfirmRemove() {
    setRemoving(true);
    setRemoveError(null);
    const result = await onRemove();
    setRemoving(false);
    if (result.ok) {
      setConfirmOpen(false);
      return;
    }
    setRemoveError(result.message ?? "Could not remove this set.");
  }

  return (
    <div
      className="editable-set-row"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          void commitIfChanged();
        }
      }}
    >
      <div className="editable-set-row-main">
        <span className="dropset-row-label">{label}</span>
        <SetFields
          values={values}
          labelPrefix={label}
          onChange={(field, value) => setValues({ ...values, [field]: value })}
        />
        <button
          type="button"
          className="icon-button"
          aria-label={`Remove ${label.toLowerCase()}`}
          onClick={() => setConfirmOpen(true)}
        >
          <TrashIcon size={16} />
        </button>
      </div>
      {error ? (
        <p className="field-error" role="alert">
          <WarningCircleIcon size={14} weight="fill" aria-hidden="true" />
          {error}{" "}
          <button type="button" className="text-link" onClick={commitIfChanged}>
            Try again
          </button>
        </p>
      ) : null}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Remove ${label.toLowerCase()}?`}
        body={
          hasDropsets
            ? "This also removes its dropsets. This can't be undone."
            : "This can't be undone."
        }
        confirmLabel="Remove"
        pending={removing}
        error={removeError}
        onConfirm={handleConfirmRemove}
      />
    </div>
  );
}
