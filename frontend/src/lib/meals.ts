import { apiGet } from "@/lib/api";

export type FoodItem = {
  id: string;
  order: number;
  name: string;
  quantity: string | null;
  unit: string | null;
  calories_kcal: string | null;
  protein_g: string | null;
  carbohydrates_g: string | null;
  fat_g: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Meal = {
  id: string;
  eaten_at: string;
  name: string;
  notes: string | null;
  items: FoodItem[];
  created_at: string;
  updated_at: string;
};

export type MealHistory = {
  start_date: string;
  end_date: string;
  meal_count: number;
  meals: Meal[];
};

export type MealHistoryResult =
  | { status: "ready"; history: MealHistory }
  | { status: "unavailable" };

export async function getMeals(
  startDate: string,
  endDate: string,
  limit = 200,
): Promise<MealHistoryResult> {
  const search = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
    limit: String(limit),
  });
  const result = await apiGet<MealHistory>(`/meals?${search.toString()}`);
  if (!result.ok) return { status: "unavailable" };
  return { status: "ready", history: result.data };
}

export type MealResult =
  | { status: "ready"; meal: Meal }
  | { status: "not-found" }
  | { status: "unavailable" };

export async function getMeal(mealId: string): Promise<MealResult> {
  const result = await apiGet<Meal>(`/meals/${mealId}`);
  if (result.ok) return { status: "ready", meal: result.data };
  if (result.status === 404) return { status: "not-found" };
  return { status: "unavailable" };
}
