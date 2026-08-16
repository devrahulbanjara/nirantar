"use client";

import { PlusIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createWorkout, type WorkoutCreateInput } from "@/lib/actions/workouts";
import { kathmanduInputValueToIso, nowAsKathmanduInputValue } from "@/lib/time";

import { GroupsEditor, type DraftGroup } from "@/components/workout-form/groups-editor";
import { ExerciseBuilder } from "@/components/workout-form/exercise-builder";
import {
  draftExerciseToInput,
  emptyExercise,
  moveItem,
  type DraftExercise,
} from "@/components/workout-form/types";

export function NewWorkoutForm() {
  const router = useRouter();
  const [checkInAt, setCheckInAt] = useState(nowAsKathmanduInputValue());
  const [stillCheckedIn, setStillCheckedIn] = useState(true);
  const [checkOutAt, setCheckOutAt] = useState(nowAsKathmanduInputValue());
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [exercises, setExercises] = useState<DraftExercise[]>([emptyExercise()]);
  const [groups, setGroups] = useState<DraftGroup[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateExercise(index: number, next: DraftExercise) {
    const list = [...exercises];
    list[index] = next;
    setExercises(list);
  }

  function removeExercise(index: number) {
    const removedKey = exercises[index].key;
    setExercises(exercises.filter((_, i) => i !== index));
    setGroups(
      groups
        .map((group) => ({
          ...group,
          exerciseKeys: group.exerciseKeys.filter((key) => key !== removedKey),
        }))
        .filter((group) => group.exerciseKeys.length >= 2),
    );
  }

  async function handleSubmit() {
    setError(null);

    const trimmedExercises = exercises.filter((exercise) => exercise.name.trim());
    if (trimmedExercises.length === 0) {
      setError("Add at least one exercise with a name.");
      return;
    }

    const checkInIso = kathmanduInputValueToIso(checkInAt);
    const checkOutIso = stillCheckedIn ? null : kathmanduInputValueToIso(checkOutAt);
    if (checkOutIso && new Date(checkOutIso) <= new Date(checkInIso)) {
      setError("Check-out must be after check-in.");
      return;
    }

    const payload: WorkoutCreateInput = {
      check_in_at: checkInIso,
      check_out_at: checkOutIso,
      title: title.trim() || null,
      notes: notes.trim() || null,
      exercises: trimmedExercises.map((exercise, index) =>
        draftExerciseToInput(exercise, index + 1),
      ),
      groups: groups.map((group, index) => ({
        type: "superset",
        order: index + 1,
        exercise_refs: group.exerciseKeys,
      })),
    };

    setSaving(true);
    const result = await createWorkout(payload);
    setSaving(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.push(`/workouts/${result.data.id}`);
  }

  return (
    <div className="workout-editor">
      {error ? (
        <p className="form-banner" data-tone="error" role="alert">
          <WarningCircleIcon size={18} weight="fill" aria-hidden="true" />
          {error}
        </p>
      ) : null}

      <section className="editor-section">
        <h2 className="editor-section-title">Session</h2>
        <div className="field">
          <label className="field-label" htmlFor="check-in-at">
            Check-in
          </label>
          <input
            id="check-in-at"
            className="field-input"
            type="datetime-local"
            value={checkInAt}
            onChange={(event) => setCheckInAt(event.target.value)}
          />
        </div>
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={stillCheckedIn}
            onChange={(event) => setStillCheckedIn(event.target.checked)}
          />
          Still checked in
        </label>
        {!stillCheckedIn ? (
          <div className="field">
            <label className="field-label" htmlFor="check-out-at">
              Check-out
            </label>
            <input
              id="check-out-at"
              className="field-input"
              type="datetime-local"
              value={checkOutAt}
              onChange={(event) => setCheckOutAt(event.target.value)}
            />
          </div>
        ) : null}
        <div className="field">
          <label className="field-label" htmlFor="workout-title">
            Title (optional)
          </label>
          <input
            id="workout-title"
            className="field-input"
            type="text"
            placeholder="Arms, Push day, Upper body…"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="workout-notes">
            Notes (optional)
          </label>
          <textarea
            id="workout-notes"
            className="field-textarea"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>
      </section>

      <section className="editor-section">
        <h2 className="editor-section-title">Exercises</h2>
        <div className="exercise-builder-list">
          {exercises.map((exercise, index) => (
            <ExerciseBuilder
              key={exercise.key}
              draft={exercise}
              order={index + 1}
              onChange={(next) => updateExercise(index, next)}
              onRemove={() => removeExercise(index)}
              onMove={(direction) =>
                setExercises(moveItem(exercises, index, direction))
              }
              canMoveUp={index > 0}
              canMoveDown={index < exercises.length - 1}
            />
          ))}
        </div>
        <button
          type="button"
          className="button-secondary"
          onClick={() => setExercises([...exercises, emptyExercise()])}
        >
          <PlusIcon size={18} weight="bold" aria-hidden="true" />
          Add exercise
        </button>
      </section>

      <section className="editor-section">
        <h2 className="editor-section-title">Supersets (optional)</h2>
        <GroupsEditor exercises={exercises} groups={groups} onChange={setGroups} />
      </section>

      <div className="sticky-action-bar">
        <button
          type="button"
          className="button-primary"
          disabled={saving}
          onClick={handleSubmit}
        >
          {saving ? "Saving…" : "Save workout"}
        </button>
      </div>
    </div>
  );
}
