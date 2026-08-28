"use client";

import { PencilSimpleIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useState } from "react";

import { Button, IconButton } from "@/components/ui/button";

import type { WorkoutEditOperation } from "@/lib/actions/workouts";
import type { ExerciseGroup, WorkoutExercise } from "@/lib/workouts";

type OpResult = { ok: boolean; message?: string };

export function ExistingGroupsEditor({ exercises, groups, runOp }: {
  exercises: WorkoutExercise[];
  groups: ExerciseGroup[];
  runOp: (operation: WorkoutEditOperation) => Promise<OpResult>;
}) {
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function begin(group?: ExerciseGroup) {
    setEditingId(group?.id ?? "new");
    setSelected(group ? group.members.slice().sort((a, b) => a.member_order - b.member_order).map((member) => member.workout_exercise_id) : []);
    setError(null);
  }

  function toggle(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function save() {
    if (selected.length < 2 || editingId === null) return;
    setSaving(true);
    const operation: WorkoutEditOperation = editingId === "new"
      ? { operation: "add_superset", order: Math.max(0, ...groups.map((group) => group.group_order)) + 1, workout_exercise_ids: selected }
      : { operation: "update_superset", superset_id: editingId, workout_exercise_ids: selected };
    const result = await runOp(operation);
    setSaving(false);
    if (!result.ok) {
      setError(result.message ?? "Could not save the superset.");
      return;
    }
    setEditingId(null);
    setSelected([]);
  }

  async function remove(groupId: string) {
    setSaving(true);
    const result = await runOp({ operation: "remove_superset", superset_id: groupId });
    setSaving(false);
    if (!result.ok) setError(result.message ?? "Could not remove the superset.");
  }

  return (
    <div className="groups-editor">
      {groups.length ? (
        <ul className="groups-editor-list">
          {groups.slice().sort((a, b) => a.group_order - b.group_order).map((group, index) => (
            <li className="groups-editor-chip" key={group.id}>
              <span><strong>Superset {index + 1}:</strong> {group.members.slice().sort((a, b) => a.member_order - b.member_order).map((member) => member.exercise_name).join(" + ")}</span>
              <span className="inline-actions">
                <IconButton
                  icon={PencilSimpleIcon}
                  label={`Edit superset ${index + 1}`}
                  onClick={() => begin(group)}
                />
                <IconButton
                  icon={TrashIcon}
                  tone="danger"
                  label={`Remove superset ${index + 1}`}
                  disabled={saving}
                  onClick={() => void remove(group.id)}
                />
              </span>
            </li>
          ))}
        </ul>
      ) : <p className="field-hint">No supersets in this workout.</p>}
      {editingId ? (
        <div className="groups-editor-picker">
          <p className="field-hint">Choose two or more exercises in performance order.</p>
          <div className="groups-editor-options">
            {exercises.slice().sort((a, b) => a.exercise_order - b.exercise_order).map((exercise) => (
              <label className="groups-editor-option" key={exercise.id}>
                <input type="checkbox" checked={selected.includes(exercise.id)} onChange={() => toggle(exercise.id)} />
                {exercise.exercise_name}
              </label>
            ))}
          </div>
          {error ? <p className="field-error" role="alert">{error}</p> : null}
          <div className="groups-editor-picker-actions">
            <Button variant="secondary" size="sm" onClick={() => setEditingId(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={saving}
              disabled={selected.length < 2}
              onClick={() => void save()}
            >
              Save superset
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          icon={PlusIcon}
          disabled={exercises.length < 2}
          onClick={() => begin()}
        >
          Add superset
        </Button>
      )}
    </div>
  );
}
