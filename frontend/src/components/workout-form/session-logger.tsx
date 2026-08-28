"use client";

import {
  CheckIcon,
  DotsThreeVerticalIcon,
  MinusIcon,
  PlusIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { DeleteRecordDialog } from "@/components/delete-record-dialog";
import { Modal } from "@/components/modal";
import { StaleConflictDialog } from "@/components/stale-conflict-dialog";
import { BackButton } from "@/components/ui/back-button";
import { Button, IconButton } from "@/components/ui/button";
import {
  decimalToEditValue,
  emptyWorkingSets,
  toDecimal,
  toInt,
  validateSetValues,
} from "@/components/workout-form/types";
import {
  deleteWorkout,
  editWorkout,
  refetchWorkout,
  type WorkoutEditOperation,
} from "@/lib/actions/workouts";
import {
  formatElapsedClock,
  getKathmanduLocalDate,
  nowAsKathmanduIso,
} from "@/lib/time";
import type { ExerciseSet, Workout, WorkoutExercise } from "@/lib/workouts";

type OpResult = { ok: boolean; message?: string };
type DraftValues = { weight_kg: string; reps: string };

const COMPLETE_PREFIX = "nirantar:set-complete:";

function loadComplete(workoutId: string): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(`${COMPLETE_PREFIX}${workoutId}`);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function saveComplete(workoutId: string, map: Record<string, boolean>) {
  localStorage.setItem(`${COMPLETE_PREFIX}${workoutId}`, JSON.stringify(map));
}

function valuesFromSet(set: ExerciseSet): DraftValues {
  return {
    weight_kg: decimalToEditValue(set.weight_kg),
    reps: set.reps === null ? "" : String(set.reps),
  };
}

function finishCheckoutIso(checkInAt: string): string {
  const nowIso = nowAsKathmanduIso();
  if (new Date(nowIso).getTime() > new Date(checkInAt).getTime()) return nowIso;
  return nowAsKathmanduIso(new Date(new Date(checkInAt).getTime() + 1000));
}

function topLevelSets(exercise: WorkoutExercise): ExerciseSet[] {
  return exercise.sets
    .filter((set) => set.parent_set_id === null)
    .slice()
    .sort((a, b) => a.set_order - b.set_order);
}

export function SessionLogger({ initialWorkout }: { initialWorkout: Workout }) {
  const router = useRouter();
  const addHeadingId = useId();
  const nameInputId = useId();
  const [workout, setWorkout] = useState(initialWorkout);
  const workoutRef = useRef(initialWorkout);
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());
  const timersRef = useRef<Map<string, number>>(new Map());
  const draftsRef = useRef<Record<string, DraftValues>>({});
  const [drafts, setDrafts] = useState<Record<string, DraftValues>>({});
  const [complete, setComplete] = useState<Record<string, boolean>>({});
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [exerciseName, setExerciseName] = useState("");
  const [addingExercise, setAddingExercise] = useState(false);
  const [removeExerciseId, setRemoveExerciseId] = useState<string | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);

  const day = getKathmanduLocalDate(workout.check_in_at);
  const backHref = `/workouts?date=${day}`;

  useEffect(() => {
    setComplete(loadComplete(initialWorkout.id));
  }, [initialWorkout.id]);

  useEffect(() => {
    const tick = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timer of timers.values()) window.clearTimeout(timer);
    };
  }, []);

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

  function displayValues(set: ExerciseSet): DraftValues {
    return drafts[set.id] ?? valuesFromSet(set);
  }

  function scheduleSave(set: ExerciseSet, values: DraftValues) {
    const existing = timersRef.current.get(set.id);
    if (existing) window.clearTimeout(existing);
    const timer = window.setTimeout(() => {
      timersRef.current.delete(set.id);
      const validation = validateSetValues(values);
      if (validation) {
        setRowError(validation);
        return;
      }
      const current = workoutRef.current.exercises
        .flatMap((exercise) => exercise.sets)
        .find((item) => item.id === set.id);
      if (!current) return;
      const weight = toDecimal(values.weight_kg);
      const reps = toInt(values.reps);
      const sameWeight =
        (current.weight_kg === null && weight === null) ||
        (current.weight_kg !== null && weight !== null && Number(current.weight_kg) === weight);
      const sameReps = current.reps === reps;
      if (sameWeight && sameReps) return;
      void runOp({
        operation: "update_set",
        set_id: set.id,
        weight_kg: weight,
        reps,
      });
    }, 400);
    timersRef.current.set(set.id, timer);
  }

  function updateDraft(set: ExerciseSet, field: keyof DraftValues, value: string) {
    const next = { ...displayValues(set), [field]: value };
    draftsRef.current = { ...draftsRef.current, [set.id]: next };
    setDrafts(draftsRef.current);
    setRowError(null);
    if (complete[set.id]) {
      const map = { ...complete, [set.id]: false };
      setComplete(map);
      saveComplete(workout.id, map);
    }
    scheduleSave(set, next);
  }

  function toggleComplete(set: ExerciseSet) {
    const values = displayValues(set);
    if (!complete[set.id] && (values.weight_kg.trim() === "" || values.reps.trim() === "")) {
      setRowError("Enter kg and reps before checking this set.");
      return;
    }
    const map = { ...complete, [set.id]: !complete[set.id] };
    setComplete(map);
    saveComplete(workout.id, map);
    setRowError(null);
  }

  async function handleAddExercise() {
    const name = exerciseName.trim();
    if (!name) {
      setRowError("Give this exercise a name.");
      return;
    }
    const order =
      Math.max(0, ...workoutRef.current.exercises.map((item) => item.exercise_order)) + 1;
    setAddingExercise(true);
    const result = await runOp({
      operation: "add_exercise",
      exercise: { name, order, sets: emptyWorkingSets(3) },
    });
    setAddingExercise(false);
    if (result.ok) {
      setExerciseName("");
      setAddOpen(false);
      setRowError(null);
    } else {
      setRowError(result.message ?? "Could not add this exercise.");
    }
  }

  async function handleAddSet(exercise: WorkoutExercise) {
    const nextOrder = Math.max(0, ...topLevelSets(exercise).map((set) => set.set_order)) + 1;
    await runOp({
      operation: "add_set",
      exercise_id: exercise.id,
      set: { order: nextOrder, type: "working" },
    });
  }

  async function handleRemoveSet(setId: string) {
    const map = { ...complete };
    delete map[setId];
    setComplete(map);
    saveComplete(workout.id, map);
    await runOp({ operation: "remove_set", set_id: setId, cascade_dropsets: true });
  }

  async function handleRemoveExercise(exerciseId: string) {
    const exercise = workoutRef.current.exercises.find((item) => item.id === exerciseId);
    const map = { ...complete };
    for (const set of exercise?.sets ?? []) delete map[set.id];
    setComplete(map);
    saveComplete(workout.id, map);
    setRemoveExerciseId(null);
    await runOp({ operation: "remove_exercise", exercise_id: exerciseId });
  }

  async function handleFinish() {
    setFinishing(true);
    await queueRef.current;
    const result = await runOp({
      operation: "update_workout",
      check_out_at: finishCheckoutIso(workoutRef.current.check_in_at),
    });
    setFinishing(false);
    if (result.ok) router.push(`/workouts/${workoutRef.current.id}`);
  }

  const exercises = workout.exercises
    .slice()
    .sort((a, b) => a.exercise_order - b.exercise_order);
  const removeTarget = exercises.find((item) => item.id === removeExerciseId);

  return (
    <div className="session-logger">
      <header className="session-logger-header">
        <BackButton fallbackHref={backHref} label="Back to workouts" />
        <p className="session-logger-clock" aria-live="polite">
          {formatElapsedClock(workout.check_in_at, nowMs)}
        </p>
        <Button variant="primary" size="sm" loading={finishing} onClick={() => void handleFinish()}>
          Finish
        </Button>
      </header>

      <div className="save-status" aria-live="polite">
        {status === "saving" ? "Saving…" : null}
        {status === "saved" ? "Saved" : null}
      </div>
      {error || rowError ? (
        <p className="form-banner" data-tone="error" role="alert">
          <WarningCircleIcon size={18} weight="fill" aria-hidden="true" />
          {error ?? rowError}
        </p>
      ) : null}

      <StaleConflictDialog
        open={conflict}
        onRefresh={handleRefresh}
        onKeepEditing={() => setConflict(false)}
      />

      {exercises.length === 0 ? (
        <div className="session-logger-empty">
          <p>Add an exercise to start logging sets.</p>
          <Button variant="primary" size="lg" icon={PlusIcon} onClick={() => setAddOpen(true)}>
            Add exercise
          </Button>
        </div>
      ) : (
        <div className="session-exercise-list">
          {exercises.map((exercise) => {
            const sets = topLevelSets(exercise);
            return (
              <article className="session-exercise" key={exercise.id}>
                <header className="session-exercise-header">
                  <h2>{exercise.exercise_name}</h2>
                  <IconButton
                    icon={DotsThreeVerticalIcon}
                    label={`Remove ${exercise.exercise_name}`}
                    tone="danger"
                    onClick={() => setRemoveExerciseId(exercise.id)}
                  />
                </header>
                <div className="session-set-table" role="table" aria-label={`${exercise.exercise_name} sets`}>
                  <div className="session-set-row" role="row" data-head="true">
                    <span>Set</span>
                    <span>kg</span>
                    <span>Reps</span>
                    <span className="visually-hidden">Done</span>
                    <span className="visually-hidden">Remove</span>
                  </div>
                  {sets.map((set, index) => {
                    const values = displayValues(set);
                    const done = Boolean(complete[set.id]);
                    return (
                      <div
                        className="session-set-row"
                        role="row"
                        data-complete={done || undefined}
                        key={set.id}
                      >
                        <span className="session-set-index">{index + 1}</span>
                        <input
                          className="session-set-input"
                          inputMode="decimal"
                          placeholder="kg"
                          aria-label={`Set ${index + 1} kg`}
                          value={values.weight_kg}
                          onChange={(event) =>
                            updateDraft(set, "weight_kg", event.target.value)
                          }
                        />
                        <input
                          className="session-set-input"
                          inputMode="numeric"
                          placeholder="reps"
                          aria-label={`Set ${index + 1} reps`}
                          value={values.reps}
                          onChange={(event) =>
                            updateDraft(set, "reps", event.target.value)
                          }
                        />
                        <button
                          className="session-check"
                          type="button"
                          data-complete={done || undefined}
                          aria-pressed={done}
                          aria-label={
                            done
                              ? `Set ${index + 1} complete`
                              : `Mark set ${index + 1} complete`
                          }
                          onClick={() => toggleComplete(set)}
                        >
                          <CheckIcon size={16} weight="bold" aria-hidden="true" />
                        </button>
                        <IconButton
                          icon={MinusIcon}
                          label={`Remove set ${index + 1}`}
                          size="sm"
                          tone="danger"
                          onClick={() => void handleRemoveSet(set.id)}
                        />
                      </div>
                    );
                  })}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={PlusIcon}
                  fullWidth
                  onClick={() => void handleAddSet(exercise)}
                >
                  Add set
                </Button>
              </article>
            );
          })}
          <Button variant="primary" icon={PlusIcon} fullWidth onClick={() => setAddOpen(true)}>
            Add exercise
          </Button>
        </div>
      )}

      <div className="session-logger-discard">
        <Button
          variant="tertiary"
          tone="danger"
          fullWidth
          onClick={() => setDiscardOpen(true)}
        >
          Discard workout
        </Button>
      </div>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        labelledBy={addHeadingId}
        variant="dialog"
      >
        <h2 className="modal-heading" id={addHeadingId}>
          Add exercise
        </h2>
        <div className="field">
          <label className="field-label" htmlFor={nameInputId}>
            Exercise name
          </label>
          <input
            id={nameInputId}
            className="field-input"
            type="text"
            autoComplete="off"
            value={exerciseName}
            onChange={(event) => setExerciseName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleAddExercise();
              }
            }}
          />
        </div>
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setAddOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={addingExercise}
            onClick={() => void handleAddExercise()}
          >
            Add
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={removeExerciseId !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveExerciseId(null);
        }}
        title="Remove exercise"
        body={
          removeTarget
            ? `Remove ${removeTarget.exercise_name} and its sets from this session?`
            : "Remove this exercise?"
        }
        confirmLabel="Remove"
        pending={status === "saving"}
        onConfirm={() => {
          if (removeExerciseId) void handleRemoveExercise(removeExerciseId);
        }}
      />

      <DeleteRecordDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        recordKind="workout"
        recordId={workout.id}
        recordLabel={workout.title ?? "this workout"}
        expectedUpdatedAt={workout.updated_at}
        onDelete={deleteWorkout}
        onDeleted={() => router.push(backHref)}
      />
    </div>
  );
}
