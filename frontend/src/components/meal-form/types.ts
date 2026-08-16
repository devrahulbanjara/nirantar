import type { FoodItemInput } from "@/lib/actions/meals";

let counter = 0;
export function nextItemKey(): string {
  counter += 1;
  return `item-${counter}-${Date.now().toString(36)}`;
}

export type DraftFoodItem = {
  key: string;
  name: string;
  quantity: string;
  unit: string;
  calories_kcal: string;
  protein_g: string;
  carbohydrates_g: string;
  fat_g: string;
};

export function emptyFoodItem(): DraftFoodItem {
  return {
    key: nextItemKey(),
    name: "",
    quantity: "",
    unit: "",
    calories_kcal: "",
    protein_g: "",
    carbohydrates_g: "",
    fat_g: "",
  };
}

function toDecimal(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function draftFoodItemToInput(draft: DraftFoodItem): FoodItemInput {
  return {
    name: draft.name.trim(),
    quantity: toDecimal(draft.quantity),
    unit: draft.unit.trim() || null,
    calories_kcal: toDecimal(draft.calories_kcal),
    protein_g: toDecimal(draft.protein_g),
    carbohydrates_g: toDecimal(draft.carbohydrates_g),
    fat_g: toDecimal(draft.fat_g),
  };
}

export function decimalToEditValue(value: string | null): string {
  if (value === null) return "";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? String(parsed) : "";
}

export { toDecimal };
