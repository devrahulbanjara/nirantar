"use client";

import { TrashIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useState } from "react";

import { FoodItemFields, type FoodItemFieldValues } from "@/components/meal-form/food-item-fields";
import { IconButton, TextLink } from "@/components/ui/button";
import { decimalToEditValue, toDecimal } from "@/components/meal-form/types";
import type { FoodItemInput, MealEditOperation } from "@/lib/actions/meals";
import type { FoodItem } from "@/lib/meals";

type OpResult = { ok: boolean; message?: string };

function toValues(item: FoodItem): FoodItemFieldValues {
  return {
    name: item.name,
    quantity: decimalToEditValue(item.quantity),
    unit: item.unit ?? "",
    calories_kcal: decimalToEditValue(item.calories_kcal),
    protein_g: decimalToEditValue(item.protein_g),
    carbohydrates_g: decimalToEditValue(item.carbohydrates_g),
    fat_g: decimalToEditValue(item.fat_g),
  };
}

export function EditableFoodItemRow({
  item,
  order,
  onRemove,
  onCommit,
}: {
  item: FoodItem;
  order: number;
  onRemove: () => Promise<OpResult>;
  onCommit: (
    op: Extract<MealEditOperation, { operation: "update_food_item" }>,
  ) => Promise<OpResult>;
}) {
  const [values, setValues] = useState<FoodItemFieldValues>(() => toValues(item));
  const [committed, setCommitted] = useState<FoodItemFieldValues>(() => toValues(item));
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  async function commitIfChanged() {
    if (!values.name.trim()) {
      setError("Food item name cannot be blank.");
      return;
    }

    const changes: Partial<FoodItemInput> = {};
    if (values.name.trim() !== committed.name) {
      changes.name = values.name.trim();
    }
    if (values.quantity !== committed.quantity) changes.quantity = toDecimal(values.quantity);
    if (values.unit.trim() !== committed.unit) changes.unit = values.unit.trim() || null;
    if (values.calories_kcal !== committed.calories_kcal) {
      changes.calories_kcal = toDecimal(values.calories_kcal);
    }
    if (values.protein_g !== committed.protein_g) {
      changes.protein_g = toDecimal(values.protein_g);
    }
    if (values.carbohydrates_g !== committed.carbohydrates_g) {
      changes.carbohydrates_g = toDecimal(values.carbohydrates_g);
    }
    if (values.fat_g !== committed.fat_g) changes.fat_g = toDecimal(values.fat_g);
    if (Object.keys(changes).length === 0) return;

    setError(null);
    const result = await onCommit({
      operation: "update_food_item",
      item_id: item.id,
      ...changes,
    });
    if (result.ok) {
      setCommitted(values);
    } else {
      setError(result.message ?? "Could not save this food item.");
    }
  }

  return (
    <div
      className="food-item-builder"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          void commitIfChanged();
        }
      }}
    >
      <header className="food-item-builder-header">
        <span className="exercise-builder-order" aria-hidden="true">
          {order}
        </span>
        <input
          className="field-input food-item-builder-name"
          type="text"
          aria-label={`Food item ${order} name`}
          value={values.name}
          onChange={(event) => setValues({ ...values, name: event.target.value })}
        />
        <IconButton
          icon={TrashIcon}
          tone="danger"
          label={`Remove food item ${order}`}
          disabled={removing}
          onClick={async () => {
            setRemoving(true);
            const result = await onRemove();
            setRemoving(false);
            if (!result.ok) {
              setError(result.message ?? "Could not remove this food item.");
            }
          }}
        />
      </header>
      <FoodItemFields
        values={values}
        labelPrefix={`Food item ${order}`}
        onChange={(field, value) => setValues({ ...values, [field]: value })}
      />
      {error ? (
        <p className="field-error" role="alert">
          <WarningCircleIcon size={14} weight="fill" aria-hidden="true" />
          {error}{" "}
          <TextLink onClick={commitIfChanged}>Try again</TextLink>
        </p>
      ) : null}
    </div>
  );
}
