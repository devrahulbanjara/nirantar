"use client";

import { TrashIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { IconButton } from "@/components/ui/button";
import { AddDropsetInline } from "@/components/workout-form/add-dropset-inline";
import { AddSetInline } from "@/components/workout-form/add-set-inline";
import { EditableSetRow } from "@/components/workout-form/editable-set-row";
import type { DropsetInput, SetInput, WorkoutEditOperation } from "@/lib/actions/workouts";
import type { WorkoutExercise } from "@/lib/workouts";

type OpResult = { ok: boolean; message?: string };

export function ExistingExerciseEditor({
  exercise,
  order,
  runOp,
}: {
  exercise: WorkoutExercise;
  order: number;
  runOp: (op: WorkoutEditOperation) => Promise<OpResult>;
}) {
  const [name, setName] = useState(exercise.exercise_name);
  const [committedName, setCommittedName] = useState(exercise.exercise_name);
  const [notes, setNotes] = useState(exercise.notes ?? "");
  const [committedNotes, setCommittedNotes] = useState(exercise.notes ?? "");
  const [nameError, setNameError] = useState<string | null>(null);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const topLevelSets = exercise.sets
    .filter((set) => set.parent_set_id === null)
    .slice()
    .sort((a, b) => a.set_order - b.set_order);

  async function commitDetails() {
    if (name.trim() !== committedName && !name.trim()) {
      setNameError("Exercise name cannot be blank.");
      return;
    }

    const changes: { name?: string; notes?: string | null } = {};
    if (name.trim() !== committedName) changes.name = name.trim();
    if (notes.trim() !== (committedNotes ?? "")) changes.notes = notes.trim() || null;
    if (Object.keys(changes).length === 0) return;

    setNameError(null);
    const result = await runOp({
      operation: "update_exercise",
      exercise_id: exercise.id,
      ...changes,
    });
    if (result.ok) {
      setCommittedName(name.trim());
      setCommittedNotes(notes.trim());
    } else {
      setNameError(result.message ?? "Could not save this exercise.");
    }
  }

  async function handleConfirmRemoveExercise() {
    setRemoving(true);
    setRemoveError(null);
    const result = await runOp({ operation: "remove_exercise", exercise_id: exercise.id });
    setRemoving(false);
    if (result.ok) {
      setConfirmRemoveOpen(false);
      return;
    }
    setRemoveError(result.message ?? "Could not remove this exercise.");
  }

  function nextSetOrder(): number {
    return Math.max(0, ...topLevelSets.map((set) => set.set_order)) + 1;
  }

  return (
    <article className="exercise-builder">
      <header
        className="exercise-builder-header"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            void commitDetails();
          }
        }}
      >
        <span className="exercise-builder-order" aria-hidden="true">
          {order}
        </span>
        <input
          className="field-input exercise-builder-name"
          type="text"
          aria-label={`Exercise ${order} name`}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <IconButton
          icon={TrashIcon}
          tone="danger"
          label={`Remove exercise ${order}`}
          onClick={() => setConfirmRemoveOpen(true)}
        />
      </header>
      {nameError ? (
        <p className="field-error" role="alert">
          <WarningCircleIcon size={14} weight="fill" aria-hidden="true" />
          {nameError}
        </p>
      ) : null}
      <ConfirmDialog
        open={confirmRemoveOpen}
        onOpenChange={setConfirmRemoveOpen}
        title={`Remove exercise ${order}?`}
        body="This removes the exercise and all of its sets and dropsets from this workout. This can't be undone."
        confirmLabel="Remove exercise"
        pending={removing}
        error={removeError}
        onConfirm={handleConfirmRemoveExercise}
      />
      <textarea
        className="field-textarea exercise-builder-notes"
        placeholder="Exercise notes (optional)"
        aria-label={`Exercise ${order} notes`}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        onBlur={commitDetails}
      />

      <ol className="exercise-builder-sets">
        {topLevelSets.map((set, index) => (
          <li className="set-builder-row" key={set.id}>
            <EditableSetRow
              set={set}
              label={set.set_type === "warmup" ? "Warm-up" : `Set ${index + 1}`}
              hasDropsets={set.dropsets.length > 0}
              onRemove={() =>
                runOp({
                  operation: "remove_set",
                  set_id: set.id,
                  cascade_dropsets: set.dropsets.length > 0,
                })
              }
              onCommit={(op) => runOp(op)}
            />
            {set.set_type === "working" ? (
              <div
                className="dropset-builder"
                data-has-dropsets={set.dropsets.length > 0}
              >
                {set.dropsets
                  .slice()
                  .sort((a, b) => a.set_order - b.set_order)
                  .map((dropset, dropIndex) => (
                    <EditableSetRow
                      key={dropset.id}
                      set={dropset}
                      label={`Drop ${dropIndex + 1}`}
                      onRemove={() =>
                        runOp({
                          operation: "remove_set",
                          set_id: dropset.id,
                          cascade_dropsets: false,
                        })
                      }
                      onCommit={(op) => runOp(op)}
                    />
                  ))}
                <AddDropsetInline
                  nextOrder={Math.max(0, ...set.dropsets.map((d) => d.set_order)) + 1}
                  onAdd={(dropset: DropsetInput) =>
                    runOp({
                      operation: "add_dropset",
                      parent_set_id: set.id,
                      dropset,
                    })
                  }
                />
              </div>
            ) : null}
          </li>
        ))}
      </ol>

      <AddSetInline
        nextOrder={nextSetOrder()}
        onAdd={(set: SetInput) =>
          runOp({ operation: "add_set", exercise_id: exercise.id, set })
        }
      />
    </article>
  );
}
