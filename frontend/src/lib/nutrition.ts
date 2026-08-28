import type { FoodItem, Meal } from "@/lib/meals";
import type { DailySummary, NutrientTotal } from "@/lib/daily-summary";

export type NutrientKey = "calories_kcal" | "protein_g" | "carbohydrates_g" | "fat_g";
export type MacroTone = "calories" | "protein" | "carbs" | "fat";

export type MacroItem = {
  tone: MacroTone;
  label: string;
  unit: string;
  value: string | null;
  target?: string | null;
  percentage?: string | null;
};

export function formatNumeric(
  value: string | number | null | undefined,
  digits = 1,
): string | null {
  if (value === null || value === undefined) return null;
  const amount = Number(value);
  if (!Number.isFinite(amount)) return null;
  return amount.toLocaleString("en-US", { maximumFractionDigits: digits });
}

export function formatNutrient(
  nutrient: Pick<NutrientTotal, "known_total">,
  digits = 1,
): string {
  return formatNumeric(nutrient.known_total, digits) ?? "Not provided";
}

export function sumMealNutrient(items: FoodItem[], key: NutrientKey) {
  let total = 0;
  let known = 0;
  for (const item of items) {
    const value = item[key];
    if (value !== null) {
      total += Number(value);
      known += 1;
    }
  }
  return { total, known };
}

function mealMacro(
  items: FoodItem[],
  key: NutrientKey,
  tone: MacroItem["tone"],
  label: string,
  unit: string,
  digits: number,
): MacroItem {
  const { total, known } = sumMealNutrient(items, key);
  return {
    tone,
    label,
    unit,
    value: known === 0 ? null : formatNumeric(total, digits),
  };
}

export function macrosFromMeal(meal: Meal): MacroItem[] {
  return [
    mealMacro(meal.items, "calories_kcal", "calories", "Calories", "kcal", 0),
    mealMacro(meal.items, "protein_g", "protein", "Protein", "g", 1),
    mealMacro(meal.items, "carbohydrates_g", "carbs", "Carbs", "g", 1),
    mealMacro(meal.items, "fat_g", "fat", "Fat", "g", 1),
  ];
}

export function macrosFromSummary(summary: DailySummary): MacroItem[] {
  const nutrition = summary.meals.nutrition;
  return [
    {
      tone: "calories",
      label: "Calories",
      unit: "kcal",
      value: formatNumeric(nutrition.calories_kcal.known_total, 0),
      target: formatNumeric(nutrition.calories_kcal.target_value, 0),
      percentage: nutrition.calories_kcal.percentage_of_target,
    },
    {
      tone: "protein",
      label: "Protein",
      unit: "g",
      value: formatNumeric(nutrition.protein_g.known_total, 1),
      target: formatNumeric(nutrition.protein_g.target_value, 1),
      percentage: nutrition.protein_g.percentage_of_target,
    },
    {
      tone: "carbs",
      label: "Carbs",
      unit: "g",
      value: formatNumeric(nutrition.carbohydrates_g.known_total, 1),
      target: formatNumeric(nutrition.carbohydrates_g.target_value, 1),
      percentage: nutrition.carbohydrates_g.percentage_of_target,
    },
    {
      tone: "fat",
      label: "Fat",
      unit: "g",
      value: formatNumeric(nutrition.fat_g.known_total, 1),
      target: formatNumeric(nutrition.fat_g.target_value, 1),
      percentage: nutrition.fat_g.percentage_of_target,
    },
  ];
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function clampSummaryDate(raw: string | undefined, today: string): string {
  if (!raw || !DATE_PATTERN.test(raw) || raw > today) return today;
  return raw;
}
