"use client";

import {
  ArrowDownIcon,
  ArrowUpIcon,
  PlusIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { useId } from "react";

import { SetFields } from "@/components/workout-form/set-fields";
import { Button, IconButton } from "@/components/ui/button";
import {
  duplicateSet,
  emptyDropset,
  emptySet,
  type DraftExercise,
  type DraftSet,
} from "@/components/workout-form/types";

function setHeading(sets: DraftSet[], setIndex: number): string {
  const set = sets[setIndex];
  if (set.type === "warmup") return "Warm-up";
  const workingNumber = sets
    .slice(0, setIndex + 1)
    .filter((item) => item.type === "working").length;
  return `Set ${workingNumber}`;
}

function focusWeightField(setKey: string) {
  requestAnimationFrame(() => {
    const input = document.getElementById(`set-weight-${setKey}`);
    if (input instanceof HTMLInputElement) {
      input.focus();
      input.select();
    }
  });
}

export function ExerciseBuilder({
  draft,
  order,
  onChange,
  onRemove,
  onMove,
  canMoveUp,
  canMoveDown,
}: {
  draft: DraftExercise;
  order: number;
  onChange: (next: DraftExercise) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const nameId = useId();

  function updateSet(setIndex: number, next: DraftSet) {
    const sets = [...draft.sets];
    sets[setIndex] = next;
    onChange({ ...draft, sets });
  }

  function removeSet(setIndex: number) {
    onChange({ ...draft, sets: draft.sets.filter((_, i) => i !== setIndex) });
  }

  function addSet() {
    const lastSet = draft.sets.at(-1);
    const next = lastSet ? duplicateSet(lastSet) : emptySet();
    onChange({ ...draft, sets: [...draft.sets, next] });
    focusWeightField(next.key);
  }

  function addWarmup() {
    const next = emptySet("warmup");
    onChange({ ...draft, sets: [...draft.sets, next] });
    focusWeightField(next.key);
  }

  return (
    <article className="exercise-builder">
      <header className="exercise-builder-header">
        <label className="exercise-builder-name-field" htmlFor={nameId}>
          <span className="exercise-builder-label">Exercise {order}</span>
          <input
            id={nameId}
            className="field-input exercise-builder-name"
            type="text"
            enterKeyHint="next"
            autoComplete="off"
            autoCapitalize="words"
            placeholder="e.g. Barbell squat"
            value={draft.name}
            onChange={(event) => onChange({ ...draft, name: event.target.value })}
          />
        </label>
      </header>

      <ol className="exercise-builder-sets">
        {draft.sets.map((set, setIndex) => {
          const heading = setHeading(draft.sets, setIndex);
          return (
            <li className="set-builder-row" key={set.key}>
              <div className="set-builder-main">
                <p className="set-builder-heading">{heading}</p>
                <SetFields
                  values={set}
                  labelPrefix={heading}
                  weightInputProps={{
                    id: `set-weight-${set.key}`,
                    enterKeyHint: "next",
                  }}
                  repsInputProps={{ enterKeyHint: "done" }}
                  onChange={(field, value) =>
                    updateSet(setIndex, { ...set, [field]: value })
                  }
                />
              </div>

              {set.dropsets.length > 0 ? (
                <div
                  className="dropset-builder"
                  data-has-dropsets="true"
                >
                  {set.dropsets.map((dropset, dropIndex) => (
                    <div className="dropset-builder-row" key={dropset.key}>
                      <span className="dropset-builder-label">
                        Drop {dropIndex + 1}
                      </span>
                      <SetFields
                        values={dropset}
                        labelPrefix={`${heading} drop ${dropIndex + 1}`}
                        onChange={(field, value) => {
                          const dropsets = [...set.dropsets];
                          dropsets[dropIndex] = { ...dropset, [field]: value };
                          updateSet(setIndex, { ...set, dropsets });
                        }}
                      />
                      <IconButton
                        icon={TrashIcon}
                        tone="danger"
                        label={`Remove drop ${dropIndex + 1} of ${heading}`}
                        onClick={() =>
                          updateSet(setIndex, {
                            ...set,
                            dropsets: set.dropsets.filter(
                              (_, i) => i !== dropIndex,
                            ),
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              ) : null}

              <details className="set-builder-options">
                <summary>More</summary>
                <div className="set-builder-options-actions">
                  <label className="set-type-select">
                    <span className="set-field-label">Type</span>
                    <select
                      className="field-select"
                      value={set.type}
                      onChange={(event) =>
                        updateSet(setIndex, {
                          ...set,
                          type: event.target.value as DraftSet["type"],
                          dropsets:
                            event.target.value === "working"
                              ? set.dropsets
                              : [],
                        })
                      }
                    >
                      <option value="warmup">Warm-up</option>
                      <option value="working">Working</option>
                    </select>
                  </label>
                  {set.type === "working" ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={PlusIcon}
                      onClick={() =>
                        updateSet(setIndex, {
                          ...set,
                          dropsets: [...set.dropsets, emptyDropset()],
                        })
                      }
                    >
                      Add dropset
                    </Button>
                  ) : null}
                  <Button
                    variant="tertiary"
                    size="sm"
                    tone="danger"
                    icon={TrashIcon}
                    onClick={() => removeSet(setIndex)}
                  >
                    Remove set
                  </Button>
                </div>
              </details>
            </li>
          );
        })}
      </ol>

      <div className="exercise-builder-add-set">
        <Button variant="primary" icon={PlusIcon} onClick={addSet}>
          Add another set
        </Button>
      </div>
      <details className="exercise-builder-options">
        <summary>Exercise options</summary>
        <div className="exercise-builder-options-actions">
          <Button variant="secondary" icon={ArrowUpIcon} disabled={!canMoveUp} onClick={() => onMove(-1)}>
            Move up
          </Button>
          <Button variant="secondary" icon={ArrowDownIcon} disabled={!canMoveDown} onClick={() => onMove(1)}>
            Move down
          </Button>
          <Button variant="secondary" icon={PlusIcon} onClick={addWarmup}>
            Add warm-up
          </Button>
          <Button variant="tertiary" tone="danger" icon={TrashIcon} onClick={onRemove}>
            Remove exercise
          </Button>
        </div>
      </details>
    </article>
  );
}
