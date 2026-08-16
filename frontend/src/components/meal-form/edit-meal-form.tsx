"use client";

import { WarningCircleIcon } from "@phosphor-icons/react";
import { useRef, useState } from "react";

import { AddFoodItemInline } from "@/components/meal-form/add-food-item-inline";
import { EditableFoodItemRow } from "@/components/meal-form/editable-food-item-row";
import { StaleConflictDialog } from "@/components/stale-conflict-dialog";
import {
  editMeal,
  refetchMeal,
  type MealEditOperation,
} from "@/lib/actions/meals";
import type { Meal } from "@/lib/meals";
import {
  isoToKathmanduInputValue,
  kathmanduInputValueToIso,
} from "@/lib/time";

type OpResult = { ok: boolean; message?: string };

export function EditMealForm({ initialMeal }: { initialMeal: Meal }) {
  const [meal, setMeal] = useState(initialMeal);
  const mealRef = useRef(initialMeal);
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());
  const [conflict, setConflict] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const [eatenAt, setEatenAt] = useState(() =>
    isoToKathmanduInputValue(initialMeal.eaten_at),
  );
  const [name, setName] = useState(initialMeal.name);
  const [nameError, setNameError] = useState<string | null>(null);
  const [notes, setNotes] = useState(initialMeal.notes ?? "");

  function setMealState(next: Meal) {
    mealRef.current = next;
    setMeal(next);
  }

  function runOp(op: MealEditOperation): Promise<OpResult> {
    const task = async (): Promise<OpResult> => {
      setStatus("saving");
      setError(null);
      const current = mealRef.current;
      const result = await editMeal(current.id, current.updated_at, [op]);
      if (result.ok) {
        setMealState(result.data);
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
    const result = await refetchMeal(mealRef.current.id);
    if (result.ok) {
      setMealState(result.data);
      setConflict(false);
      setStatus("idle");
    }
  }

  async function commitEatenAt() {
    const current = mealRef.current;
    const iso = kathmanduInputValueToIso(eatenAt);
    if (new Date(iso).getTime() === new Date(current.eaten_at).getTime()) return;
    await runOp({ operation: "update_meal", eaten_at: iso });
  }

  async function commitName() {
    const current = mealRef.current;
    const next = name.trim();
    if (!next) {
      setNameError("Meal name cannot be blank.");
      return;
    }
    setNameError(null);
    if (next === current.name) return;
    await runOp({ operation: "update_meal", name: next });
  }

  async function commitNotes() {
    const current = mealRef.current;
    const next = notes.trim() || null;
    if (next === (current.notes ?? null)) return;
    await runOp({ operation: "update_meal", notes: next });
  }

  function nextItemOrder(): number {
    return Math.max(0, ...mealRef.current.items.map((item) => item.order)) + 1;
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
        <h2 className="editor-section-title">Meal</h2>
        <div className="field">
          <label className="field-label" htmlFor="edit-meal-eaten-at">
            Eaten at
          </label>
          <input
            id="edit-meal-eaten-at"
            className="field-input"
            type="datetime-local"
            value={eatenAt}
            onChange={(event) => setEatenAt(event.target.value)}
            onBlur={commitEatenAt}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="edit-meal-name">
            Name
          </label>
          <input
            id="edit-meal-name"
            className="field-input"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onBlur={commitName}
          />
          {nameError ? (
            <p className="field-error" role="alert">
              <WarningCircleIcon size={14} weight="fill" aria-hidden="true" />
              {nameError}
            </p>
          ) : null}
        </div>
        <div className="field">
          <label className="field-label" htmlFor="edit-meal-notes">
            Notes (optional)
          </label>
          <textarea
            id="edit-meal-notes"
            className="field-textarea"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            onBlur={commitNotes}
          />
        </div>
      </section>

      <section className="editor-section">
        <h2 className="editor-section-title">Food items</h2>
        <div className="food-item-builder-list">
          {meal.items
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((item, index) => (
              <EditableFoodItemRow
                key={item.id}
                item={item}
                order={index + 1}
                onRemove={() => runOp({ operation: "remove_food_item", item_id: item.id })}
                onCommit={(op) => runOp(op)}
              />
            ))}
        </div>
        <AddFoodItemInline
          onAdd={(item) =>
            runOp({ operation: "add_food_item", order: nextItemOrder(), item })
          }
        />
      </section>
    </div>
  );
}
