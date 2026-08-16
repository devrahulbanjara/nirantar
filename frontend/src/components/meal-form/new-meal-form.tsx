"use client";

import { PlusIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FoodItemBuilder } from "@/components/meal-form/food-item-builder";
import {
  draftFoodItemToInput,
  emptyFoodItem,
  type DraftFoodItem,
} from "@/components/meal-form/types";
import { createMeal, type MealCreateInput } from "@/lib/actions/meals";
import { kathmanduInputValueToIso, nowAsKathmanduInputValue } from "@/lib/time";

export function NewMealForm() {
  const router = useRouter();
  const [eatenAt, setEatenAt] = useState(nowAsKathmanduInputValue());
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<DraftFoodItem[]>([emptyFoodItem()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateItem(index: number, next: DraftFoodItem) {
    const list = [...items];
    list[index] = next;
    setItems(list);
  }

  async function handleSubmit() {
    setError(null);
    if (!name.trim()) {
      setError("Give this meal a name.");
      return;
    }
    const missingNameOrders = items
      .map((item, index) => (item.name.trim() ? null : index + 1))
      .filter((order): order is number => order !== null);
    if (missingNameOrders.length === items.length) {
      setError("Add at least one food item with a name.");
      return;
    }
    if (missingNameOrders.length > 0) {
      setError(
        `Food item ${missingNameOrders.join(", ")} needs a name before you can save.`,
      );
      return;
    }

    const payload: MealCreateInput = {
      eaten_at: kathmanduInputValueToIso(eatenAt),
      name: name.trim(),
      notes: notes.trim() || null,
      items: items.map(draftFoodItemToInput),
    };

    setSaving(true);
    const result = await createMeal(payload);
    setSaving(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.push(`/meals/${result.data.id}`);
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
        <h2 className="editor-section-title">Meal</h2>
        <div className="field">
          <label className="field-label" htmlFor="meal-eaten-at">
            Eaten at
          </label>
          <input
            id="meal-eaten-at"
            className="field-input"
            type="datetime-local"
            value={eatenAt}
            onChange={(event) => setEatenAt(event.target.value)}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="meal-name">
            Name
          </label>
          <input
            id="meal-name"
            className="field-input"
            type="text"
            placeholder="Breakfast, Lunch, Snack…"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="meal-notes">
            Notes (optional)
          </label>
          <textarea
            id="meal-notes"
            className="field-textarea"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>
      </section>

      <section className="editor-section">
        <h2 className="editor-section-title">Food items</h2>
        <div className="food-item-builder-list">
          {items.map((item, index) => (
            <FoodItemBuilder
              key={item.key}
              draft={item}
              order={index + 1}
              onChange={(next) => updateItem(index, next)}
              onRemove={() => setItems(items.filter((_, i) => i !== index))}
              showRemove={items.length > 1}
            />
          ))}
        </div>
        <button
          type="button"
          className="button-secondary"
          onClick={() => setItems([...items, emptyFoodItem()])}
        >
          <PlusIcon size={18} weight="bold" aria-hidden="true" />
          Add food item
        </button>
      </section>

      <div className="sticky-action-bar">
        <button
          type="button"
          className="button-primary"
          disabled={saving}
          onClick={handleSubmit}
        >
          {saving ? "Saving…" : "Save meal"}
        </button>
      </div>
    </div>
  );
}
