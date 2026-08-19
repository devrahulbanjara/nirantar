"use client";

import { PlusIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useRef, useState } from "react";

import { ExerciseBuilder } from "@/components/workout-form/exercise-builder";
import { ExistingExerciseEditor } from "@/components/workout-form/existing-exercise-editor";
import { ExistingGroupsEditor } from "@/components/workout-form/existing-groups-editor";
import { draftExerciseToInput, emptyExercise, type DraftExercise } from "@/components/workout-form/types";
import { StaleConflictDialog } from "@/components/stale-conflict-dialog";
import { DateTimeField } from "@/components/ui/date-time-field";
import {
  editWorkout,
  refetchWorkout,
  type WorkoutEditOperation,
} from "@/lib/actions/workouts";
import type { Workout } from "@/lib/workouts";
import {
  isoToKathmanduInputValue,
  kathmanduInputValueToIso,
  nowAsKathmanduInputValue,
} from "@/lib/time";

type OpResult = { ok: boolean; message?: string };

export function EditWorkoutForm({ initialWorkout }: { initialWorkout: Workout }) {
  const [workout, setWorkout] = useState(initialWorkout);
  const workoutRef = useRef(initialWorkout);
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());
  const [conflict, setConflict] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const [checkInAt, setCheckInAt] = useState(() =>
    isoToKathmanduInputValue(initialWorkout.check_in_at),
  );
  const [stillCheckedIn, setStillCheckedIn] = useState(!initialWorkout.check_out_at);
  const [checkOutAt, setCheckOutAt] = useState(() =>
    initialWorkout.check_out_at
      ? isoToKathmanduInputValue(initialWorkout.check_out_at)
      : nowAsKathmanduInputValue(),
  );
  const [title, setTitle] = useState(initialWorkout.title ?? "");
  const [notes, setNotes] = useState(initialWorkout.notes ?? "");
  const [timeError, setTimeError] = useState<string | null>(null);

  const [addingExercise, setAddingExercise] = useState(false);
  const [newExercise, setNewExercise] = useState<DraftExercise>(emptyExercise());
  const [addExerciseError, setAddExerciseError] = useState<string | null>(null);
  const [savingExercise, setSavingExercise] = useState(false);

  function setWorkoutState(next: Workout) {
    workoutRef.current = next;
    setWorkout(next);
  }

  function runOp(op: WorkoutEditOperation): Promise<OpResult> {
    const task = async (): Promise<OpResult> => {
      setStatus("saving");
      setError(null);
      const current = workoutRef.current;
      const result = await editWorkout(current.id, current.updated_at, [op]);
      if (result.ok) {
        setWorkoutState(result.data);
        setStatus("saved");
        return { ok: true };
      }
      if (result.status === 409) {
        setConflict(true);
        setStatus("error");
        return { ok: false, message: result.message };
      }
      setStatus("error");
      setError(result.message);
      return { ok: false, message: result.message };
    };
    const next = queueRef.current.then(task, task);
    queueRef.current = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }

  async function handleRefresh() {
    const result = await refetchWorkout(workoutRef.current.id);
    if (result.ok) {
      setWorkoutState(result.data);
      setConflict(false);
      setStatus("idle");
    }
  }

  function computeNextExerciseOrder(exercises: { exercise_order: number }[]): number {
    return Math.max(0, ...exercises.map((exercise) => exercise.exercise_order)) + 1;
  }

  function nextExerciseOrder(): number {
    return computeNextExerciseOrder(workoutRef.current.exercises);
  }

  function validateCheckTimes(
    nextCheckIn: string,
    nextStillCheckedIn: boolean,
    nextCheckOut: string,
  ): boolean {
    if (nextStillCheckedIn) {
      setTimeError(null);
      return true;
    }
    const inTime = new Date(kathmanduInputValueToIso(nextCheckIn)).getTime();
    const outTime = new Date(kathmanduInputValueToIso(nextCheckOut)).getTime();
    if (outTime <= inTime) {
      setTimeError("Check-out must be after check-in.");
      return false;
    }
    setTimeError(null);
    return true;
  }

  async function commitCheckIn(nextValue = checkInAt) {
    if (!validateCheckTimes(nextValue, stillCheckedIn, checkOutAt)) return;
    const current = workoutRef.current;
    const iso = kathmanduInputValueToIso(nextValue);
    if (new Date(iso).getTime() === new Date(current.check_in_at).getTime()) return;
    await runOp({ operation: "update_workout", check_in_at: iso });
  }

  async function commitCheckOut(nextStillCheckedIn: boolean, nextCheckOutAt: string) {
    if (!validateCheckTimes(checkInAt, nextStillCheckedIn, nextCheckOutAt)) return;
    const current = workoutRef.current;
    const iso = nextStillCheckedIn ? null : kathmanduInputValueToIso(nextCheckOutAt);
    const currentTime = current.check_out_at ? new Date(current.check_out_at).getTime() : null;
    const nextTime = iso ? new Date(iso).getTime() : null;
    if (currentTime === nextTime) return;
    await runOp({ operation: "update_workout", check_out_at: iso });
  }

  async function commitTitle() {
    const current = workoutRef.current;
    const next = title.trim() || null;
    if (next === (current.title ?? null)) return;
    await runOp({ operation: "update_workout", title: next });
  }

  async function commitNotes() {
    const current = workoutRef.current;
    const next = notes.trim() || null;
    if (next === (current.notes ?? null)) return;
    await runOp({ operation: "update_workout", notes: next });
  }

  async function handleSaveNewExercise() {
    if (!newExercise.name.trim()) {
      setAddExerciseError("Add a name for this exercise.");
      return;
    }
    setSavingExercise(true);
    setAddExerciseError(null);
    const result = await runOp({
      operation: "add_exercise",
      exercise: draftExerciseToInput(newExercise, nextExerciseOrder()),
    });
    setSavingExercise(false);
    if (result.ok) {
      setNewExercise(emptyExercise());
      setAddingExercise(false);
    } else {
      setAddExerciseError(result.message ?? "Could not add this exercise.");
    }
  }

  return (
    <div className="workout-editor">
      <div className="save-status" aria-live="polite">
        {status === "saving" ? "Saving…" : null}
        {status === "saved" ? "Saved" : null}
      </div>
      {error ? (
        <p className="form-banner" data-tone="error" role="alert">
          <WarningCircleIcon size={18} weight="fill" aria-hidden="true" />
          {error}
        </p>
      ) : null}

      <StaleConflictDialog
        open={conflict}
        onRefresh={handleRefresh}
        onKeepEditing={() => setConflict(false)}
      />

      <section className="editor-section">
        <h2 className="editor-section-title">Session</h2>
        <DateTimeField id="edit-check-in-at" label="Check-in" value={checkInAt} onChange={setCheckInAt} onCommit={commitCheckIn} />
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={stillCheckedIn}
            onChange={(event) => {
              const checked = event.target.checked;
              setStillCheckedIn(checked);
              void commitCheckOut(checked, checkOutAt);
            }}
          />
          Still checked in
        </label>
        {!stillCheckedIn ? (
          <DateTimeField id="edit-check-out-at" label="Check-out" value={checkOutAt} onChange={setCheckOutAt} onCommit={(next) => commitCheckOut(stillCheckedIn, next)} />
        ) : null}
        {timeError ? (
          <p className="field-error" role="alert">
            <WarningCircleIcon size={14} weight="fill" aria-hidden="true" />
            {timeError}
          </p>
        ) : null}
        <div className="field">
          <label className="field-label" htmlFor="edit-workout-title">
            Title (optional)
          </label>
          <input
            id="edit-workout-title"
            className="field-input"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={commitTitle}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="edit-workout-notes">
            Notes (optional)
          </label>
          <textarea
            id="edit-workout-notes"
            className="field-textarea"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            onBlur={commitNotes}
          />
        </div>
      </section>

      <section className="editor-section">
        <h2 className="editor-section-title">Exercises</h2>
        <div className="exercise-builder-list">
          {workout.exercises
            .slice()
            .sort((a, b) => a.exercise_order - b.exercise_order)
            .map((exercise) => (
              <ExistingExerciseEditor
                key={exercise.id}
                exercise={exercise}
                order={exercise.exercise_order}
                runOp={runOp}
              />
            ))}
        </div>

        {addingExercise ? (
          <div className="add-inline-form">
            <ExerciseBuilder
              draft={newExercise}
              order={computeNextExerciseOrder(workout.exercises)}
              onChange={setNewExercise}
              onRemove={() => {
                setAddingExercise(false);
                setNewExercise(emptyExercise());
              }}
              onMove={() => {}}
              canMoveUp={false}
              canMoveDown={false}
            />
            {addExerciseError ? (
              <p className="field-error" role="alert">
                <WarningCircleIcon size={14} weight="fill" aria-hidden="true" />
                {addExerciseError}
              </p>
            ) : null}
            <div className="add-inline-form-actions">
              <button
                type="button"
                className="button-secondary button-compact"
                onClick={() => {
                  setAddingExercise(false);
                  setNewExercise(emptyExercise());
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button-primary button-compact"
                disabled={savingExercise}
                onClick={handleSaveNewExercise}
              >
                {savingExercise ? "Saving…" : "Save exercise"}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="button-secondary"
            onClick={() => setAddingExercise(true)}
          >
            <PlusIcon size={18} weight="bold" aria-hidden="true" />
            Add exercise
          </button>
        )}
      </section>

      <section className="editor-section">
        <h2 className="editor-section-title">Supersets</h2>
        <ExistingGroupsEditor
          exercises={workout.exercises}
          groups={workout.groups}
          runOp={runOp}
        />
      </section>
    </div>
  );
}
