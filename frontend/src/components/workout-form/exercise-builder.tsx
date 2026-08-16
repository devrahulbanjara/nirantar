"use client";

import {
  ArrowDownIcon,
  ArrowUpIcon,
  PlusIcon,
  TrashIcon,
} from "@phosphor-icons/react";

import { SetFields } from "@/components/workout-form/set-fields";
import {
  emptyDropset,
  emptySet,
  moveItem,
  type DraftExercise,
  type DraftSet,
} from "@/components/workout-form/types";

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
  function updateSet(setIndex: number, next: DraftSet) {
    const sets = [...draft.sets];
    sets[setIndex] = next;
    onChange({ ...draft, sets });
  }

  function removeSet(setIndex: number) {
    onChange({ ...draft, sets: draft.sets.filter((_, i) => i !== setIndex) });
  }

  function addSet(type: DraftSet["type"]) {
    onChange({ ...draft, sets: [...draft.sets, emptySet(type)] });
  }

  function moveSet(setIndex: number, direction: -1 | 1) {
    onChange({ ...draft, sets: moveItem(draft.sets, setIndex, direction) });
  }

  return (
    <article className="exercise-builder">
      <header className="exercise-builder-header">
        <span className="exercise-builder-order" aria-hidden="true">
          {order}
        </span>
        <input
          className="field-input exercise-builder-name"
          type="text"
          placeholder="Exercise name"
          aria-label={`Exercise ${order} name`}
          value={draft.name}
          onChange={(event) => onChange({ ...draft, name: event.target.value })}
        />
        <div className="exercise-builder-move">
          <button
            type="button"
            className="icon-button"
            aria-label={`Move exercise ${order} up`}
            disabled={!canMoveUp}
            onClick={() => onMove(-1)}
          >
            <ArrowUpIcon size={18} />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label={`Move exercise ${order} down`}
            disabled={!canMoveDown}
            onClick={() => onMove(1)}
          >
            <ArrowDownIcon size={18} />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label={`Remove exercise ${order}`}
            onClick={onRemove}
          >
            <TrashIcon size={18} />
          </button>
        </div>
      </header>

      <ol className="exercise-builder-sets">
        {draft.sets.map((set, setIndex) => (
          <li className="set-builder-row" key={set.key}>
            <div className="set-builder-main">
              <label className="set-type-select">
                <span className="visually-hidden">
                  Set {setIndex + 1} type
                </span>
                <select
                  className="field-select"
                  value={set.type}
                  onChange={(event) =>
                    updateSet(setIndex, {
                      ...set,
                      type: event.target.value as DraftSet["type"],
                    })
                  }
                >
                  <option value="warmup">Warm-up</option>
                  <option value="working">Working</option>
                </select>
              </label>
              <SetFields
                values={set}
                labelPrefix={`Set ${setIndex + 1}`}
                onChange={(field, value) =>
                  updateSet(setIndex, { ...set, [field]: value })
                }
              />
              <div className="set-builder-actions">
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Move set ${setIndex + 1} up`}
                  disabled={setIndex === 0}
                  onClick={() => moveSet(setIndex, -1)}
                >
                  <ArrowUpIcon size={16} />
                </button>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Move set ${setIndex + 1} down`}
                  disabled={setIndex === draft.sets.length - 1}
                  onClick={() => moveSet(setIndex, 1)}
                >
                  <ArrowDownIcon size={16} />
                </button>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Remove set ${setIndex + 1}`}
                  onClick={() => removeSet(setIndex)}
                >
                  <TrashIcon size={16} />
                </button>
              </div>
            </div>

            {set.type === "working" ? (
              <div className="dropset-builder">
                {set.dropsets.map((dropset, dropIndex) => (
                  <div className="dropset-builder-row" key={dropset.key}>
                    <span className="dropset-builder-label">
                      Drop {dropIndex + 1}
                    </span>
                    <SetFields
                      values={dropset}
                      labelPrefix={`Set ${setIndex + 1} drop ${dropIndex + 1}`}
                      onChange={(field, value) => {
                        const dropsets = [...set.dropsets];
                        dropsets[dropIndex] = { ...dropset, [field]: value };
                        updateSet(setIndex, { ...set, dropsets });
                      }}
                    />
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`Remove drop ${dropIndex + 1} of set ${setIndex + 1}`}
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
                <button
                  type="button"
                  className="text-link dropset-add"
                  onClick={() =>
                    updateSet(setIndex, {
                      ...set,
                      dropsets: [...set.dropsets, emptyDropset()],
                    })
                  }
                >
                  <PlusIcon size={14} weight="bold" aria-hidden="true" />
                  Add dropset
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ol>

      <div className="exercise-builder-add-set">
        <button
          type="button"
          className="button-secondary button-compact"
          onClick={() => addSet("warmup")}
        >
          <PlusIcon size={16} weight="bold" aria-hidden="true" />
          Add warm-up
        </button>
        <button
          type="button"
          className="button-secondary button-compact"
          onClick={() => addSet("working")}
        >
          <PlusIcon size={16} weight="bold" aria-hidden="true" />
          Add set
        </button>
      </div>
    </article>
  );
}
