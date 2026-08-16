"use client";

import { PlusIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useState } from "react";

import { FoodItemFields } from "@/components/meal-form/food-item-fields";
import { emptyFoodItem, draftFoodItemToInput } from "@/components/meal-form/types";
import type { FoodItemInput } from "@/lib/actions/meals";

export function AddFoodItemInline({
  onAdd,
}: {
  onAdd: (item: FoodItemInput) => Promise<{ ok: boolean; message?: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(emptyFoodItem());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        type="button"
        className="button-secondary"
        onClick={() => setOpen(true)}
      >
        <PlusIcon size={18} weight="bold" aria-hidden="true" />
        Add food item
      </button>
    );
  }

  async function handleAdd() {
    if (!draft.name.trim()) {
      setError("Give this food item a name.");
      return;
    }
    setSaving(true);
    setError(null);
    const result = await onAdd(draftFoodItemToInput(draft));
    setSaving(false);
    if (result.ok) {
      setDraft(emptyFoodItem());
      setOpen(false);
    } else {
      setError(result.message ?? "Could not add this food item.");
    }
  }

  return (
    <div className="add-inline-form">
      <div className="field">
        <label className="field-label" htmlFor="new-food-item-name">
          Food item name
        </label>
        <input
          id="new-food-item-name"
          className="field-input"
          type="text"
          value={draft.name}
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
        />
      </div>
      <FoodItemFields
        values={draft}
        labelPrefix="New food item"
        onChange={(field, value) => setDraft({ ...draft, [field]: value })}
      />
      {error ? (
        <p className="field-error" role="alert">
          <WarningCircleIcon size={14} weight="fill" aria-hidden="true" />
          {error}
        </p>
      ) : null}
      <div className="add-inline-form-actions">
        <button
          type="button"
          className="button-secondary button-compact"
          onClick={() => {
            setOpen(false);
            setDraft(emptyFoodItem());
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          className="button-primary button-compact"
          disabled={saving}
          onClick={handleAdd}
        >
          {saving ? "Saving…" : "Save food item"}
        </button>
      </div>
    </div>
  );
}
