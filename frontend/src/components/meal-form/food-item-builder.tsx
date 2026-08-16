"use client";

import { TrashIcon } from "@phosphor-icons/react";

import { FoodItemFields } from "@/components/meal-form/food-item-fields";
import type { DraftFoodItem } from "@/components/meal-form/types";

export function FoodItemBuilder({
  draft,
  order,
  onChange,
  onRemove,
  showRemove,
}: {
  draft: DraftFoodItem;
  order: number;
  onChange: (next: DraftFoodItem) => void;
  onRemove: () => void;
  showRemove: boolean;
}) {
  return (
    <article className="food-item-builder">
      <header className="food-item-builder-header">
        <span className="exercise-builder-order" aria-hidden="true">
          {order}
        </span>
        <input
          className="field-input food-item-builder-name"
          type="text"
          placeholder="Food item name"
          aria-label={`Food item ${order} name`}
          value={draft.name}
          onChange={(event) => onChange({ ...draft, name: event.target.value })}
        />
        {showRemove ? (
          <button
            type="button"
            className="icon-button"
            aria-label={`Remove food item ${order}`}
            onClick={onRemove}
          >
            <TrashIcon size={18} />
          </button>
        ) : null}
      </header>
      <FoodItemFields
        values={draft}
        labelPrefix={`Food item ${order}`}
        onChange={(field, value) => onChange({ ...draft, [field]: value })}
      />
    </article>
  );
}
