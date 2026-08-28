"use client";

import { PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useState } from "react";

import { Button, IconButton } from "@/components/ui/button";

import { nextKey, type DraftExercise } from "@/components/workout-form/types";

export type DraftGroup = { key: string; exerciseKeys: string[] };

export function GroupsEditor({
  exercises,
  groups,
  onChange,
}: {
  exercises: DraftExercise[];
  groups: DraftGroup[];
  onChange: (groups: DraftGroup[]) => void;
}) {
  const [picking, setPicking] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const eligibleExercises = exercises.filter((exercise) => exercise.name.trim());

  function toggleSelected(key: string) {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  }

  function createGroup() {
    if (selected.length < 2) return;
    onChange([...groups, { key: nextKey("group"), exerciseKeys: selected }]);
    setSelected([]);
    setPicking(false);
  }

  function removeGroup(key: string) {
    onChange(groups.filter((group) => group.key !== key));
  }

  function exerciseLabel(key: string): string {
    const exercise = exercises.find((item) => item.key === key);
    return exercise?.name.trim() || "Untitled exercise";
  }

  return (
    <section className="groups-editor" aria-label="Supersets">
      {groups.length > 0 ? (
        <ul className="groups-editor-list">
          {groups.map((group, index) => (
            <li className="groups-editor-chip" key={group.key}>
              <span>
                <strong>Superset {index + 1}:</strong>{" "}
                {group.exerciseKeys.map(exerciseLabel).join(" + ")}
              </span>
              <IconButton
                icon={TrashIcon}
                tone="danger"
                label={`Remove superset ${index + 1}`}
                onClick={() => removeGroup(group.key)}
              />
            </li>
          ))}
        </ul>
      ) : null}

      {picking ? (
        <div className="groups-editor-picker">
          <p className="field-hint">
            Choose two or more exercises to group as a superset.
          </p>
          <div className="groups-editor-options">
            {eligibleExercises.map((exercise) => (
              <label className="groups-editor-option" key={exercise.key}>
                <input
                  type="checkbox"
                  checked={selected.includes(exercise.key)}
                  onChange={() => toggleSelected(exercise.key)}
                />
                {exercise.name.trim() || "Untitled exercise"}
              </label>
            ))}
          </div>
          <div className="groups-editor-picker-actions">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setPicking(false);
                setSelected([]);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={selected.length < 2}
              onClick={createGroup}
            >
              Create superset
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          icon={PlusIcon}
          disabled={eligibleExercises.length < 2}
          onClick={() => setPicking(true)}
        >
          Add superset
        </Button>
      )}
    </section>
  );
}
