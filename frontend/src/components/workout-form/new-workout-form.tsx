"use client";

import { PlusIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createWorkout, type WorkoutCreateInput } from "@/lib/actions/workouts";
import { Button } from "@/components/ui/button";
import { DateTimeField } from "@/components/ui/date-time-field";
import { kathmanduInputValueToIso, nowAsKathmanduInputValue, nowOnKathmanduDate } from "@/lib/time";

import { GroupsEditor, type DraftGroup } from "@/components/workout-form/groups-editor";
import { ExerciseBuilder } from "@/components/workout-form/exercise-builder";
import {
  draftExerciseToInput,
  emptyExercise,
  moveItem,
  type DraftExercise,
} from "@/components/workout-form/types";

export function NewWorkoutForm({ defaultDate }: { defaultDate?: string }) {
  const router = useRouter();
  const [checkInAt, setCheckInAt] = useState(() =>
    defaultDate ? nowOnKathmanduDate(defaultDate) : nowAsKathmanduInputValue(),
  );
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

    const payload: WorkoutCreateInput = {
      check_in_at: kathmanduInputValueToIso(checkInAt),
      check_out_at: null,
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

      <details className="editor-section optional-section-disclosure optional-editor-section">
        <summary>Session details</summary>
        <div className="session-details-fields">
          <DateTimeField
            id="check-in-at"
            label="Check-in"
            value={checkInAt}
            onChange={setCheckInAt}
          />
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
        </div>
      </details>

      <section className="editor-section">
        <h2 className="editor-section-title">Exercises and sets</h2>
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
        <span className="workout-add-exercise">
          <Button
            variant="secondary"
            icon={PlusIcon}
            fullWidth
            onClick={() => setExercises([...exercises, emptyExercise()])}
          >
            Add exercise
          </Button>
        </span>
      </section>

      <details className="editor-section optional-section-disclosure optional-editor-section">
        <summary>Supersets (optional)</summary>
        <GroupsEditor exercises={exercises} groups={groups} onChange={setGroups} />
      </details>

      <div className="sticky-action-bar">
        <Button variant="primary" size="lg" loading={saving} onClick={handleSubmit}>
          Save workout
        </Button>
      </div>
    </div>
  );
}
