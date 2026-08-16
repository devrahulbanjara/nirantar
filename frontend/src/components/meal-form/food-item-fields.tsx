"use client";

import type { DraftFoodItem } from "@/components/meal-form/types";

export type FoodItemFieldValues = Omit<DraftFoodItem, "key">;

export function FoodItemFields({
  values,
  onChange,
  labelPrefix,
}: {
  values: FoodItemFieldValues;
  onChange: (field: keyof FoodItemFieldValues, value: string) => void;
  labelPrefix: string;
}) {
  return (
    <div className="food-item-fields">
      <label className="field set-field-optional food-item-quantity">
        <span className="set-field-label">Quantity</span>
        <input
          className="set-field-input"
          type="number"
          inputMode="decimal"
          min={0}
          step={0.5}
          aria-label={`${labelPrefix} quantity`}
          value={values.quantity}
          onChange={(event) => onChange("quantity", event.target.value)}
        />
      </label>
      <label className="field set-field-optional food-item-unit">
        <span className="set-field-label">Unit</span>
        <input
          className="set-field-input"
          type="text"
          placeholder="piece, slice, g…"
          aria-label={`${labelPrefix} unit`}
          value={values.unit}
          onChange={(event) => onChange("unit", event.target.value)}
        />
      </label>
      <label className="set-field set-field-optional">
        <span className="set-field-label">Calories</span>
        <span className="set-field-with-unit">
          <input
            className="set-field-input"
            type="number"
            inputMode="decimal"
            min={0}
            step={1}
            aria-label={`${labelPrefix} calories`}
            value={values.calories_kcal}
            onChange={(event) => onChange("calories_kcal", event.target.value)}
          />
          <span className="set-field-unit">kcal</span>
        </span>
      </label>
      <label className="set-field set-field-optional">
        <span className="set-field-label">Protein</span>
        <span className="set-field-with-unit">
          <input
            className="set-field-input"
            type="number"
            inputMode="decimal"
            min={0}
            step={0.5}
            aria-label={`${labelPrefix} protein`}
            value={values.protein_g}
            onChange={(event) => onChange("protein_g", event.target.value)}
          />
          <span className="set-field-unit">g</span>
        </span>
      </label>
      <label className="set-field set-field-optional">
        <span className="set-field-label">Carbs</span>
        <span className="set-field-with-unit">
          <input
            className="set-field-input"
            type="number"
            inputMode="decimal"
            min={0}
            step={0.5}
            aria-label={`${labelPrefix} carbohydrates`}
            value={values.carbohydrates_g}
            onChange={(event) => onChange("carbohydrates_g", event.target.value)}
          />
          <span className="set-field-unit">g</span>
        </span>
      </label>
      <label className="set-field set-field-optional">
        <span className="set-field-label">Fat</span>
        <span className="set-field-with-unit">
          <input
            className="set-field-input"
            type="number"
            inputMode="decimal"
            min={0}
            step={0.5}
            aria-label={`${labelPrefix} fat`}
            value={values.fat_g}
            onChange={(event) => onChange("fat_g", event.target.value)}
          />
          <span className="set-field-unit">g</span>
        </span>
      </label>
    </div>
  );
}
