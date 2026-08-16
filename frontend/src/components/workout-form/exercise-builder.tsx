"use client";

import {
  ArrowDownIcon,
  ArrowUpIcon,
  PlusIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { useId } from "react";

import { SetFields } from "@/components/workout-form/set-fields";
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
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={`Remove drop ${dropIndex + 1} of ${heading}`}
                        onClick={() =>
                          updateSet(setIndex, {
                            ...set,
                            dropsets: set.dropsets.filter(
                              (_, i) => i !== dropIndex,
                            ),
                          })
                        }
                      >
                        <TrashIcon size={16} />
                      </button>
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
                    <button
                      type="button"
                      className="button-secondary button-compact"
                      onClick={() =>
                        updateSet(setIndex, {
                          ...set,
                          dropsets: [...set.dropsets, emptyDropset()],
                        })
                      }
                    >
                      <PlusIcon size={16} weight="bold" aria-hidden="true" />
                      Add dropset
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="button-secondary button-compact"
                    onClick={() => removeSet(setIndex)}
                  >
                    <TrashIcon size={16} aria-hidden="true" />
                    Remove set
                  </button>
                </div>
              </details>
            </li>
          );
        })}
      </ol>

      <div className="exercise-builder-add-set">
        <button
          type="button"
          className="button-primary"
          onClick={addSet}
        >
          <PlusIcon size={18} weight="bold" aria-hidden="true" />
          Add another set
        </button>
      </div>
      <details className="exercise-builder-options">
        <summary>Exercise options</summary>
        <div className="exercise-builder-options-actions">
          <button
            type="button"
            className="button-secondary"
            disabled={!canMoveUp}
            onClick={() => onMove(-1)}
          >
            <ArrowUpIcon size={18} aria-hidden="true" />
            Move up
          </button>
          <button
            type="button"
            className="button-secondary"
            disabled={!canMoveDown}
            onClick={() => onMove(1)}
          >
            <ArrowDownIcon size={18} aria-hidden="true" />
            Move down
          </button>
          <button
            type="button"
            className="button-secondary"
            onClick={addWarmup}
          >
            <PlusIcon size={18} weight="bold" aria-hidden="true" />
            Add warm-up
          </button>
          <button
            type="button"
            className="button-secondary"
            onClick={onRemove}
          >
            <TrashIcon size={18} aria-hidden="true" />
            Remove exercise
          </button>
        </div>
      </details>
    </article>
  );
}
