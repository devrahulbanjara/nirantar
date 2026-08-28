"use server";

import { revalidatePath } from "next/cache";

import { apiGet, apiMutate, type ActionResult } from "@/lib/api";
import type { Meal } from "@/lib/meals";

export async function refetchMeal(mealId: string): Promise<ActionResult<Meal>> {
  return apiGet<Meal>(`/meals/${mealId}`);
}

export type FoodItemInput = {
  name: string;
  quantity?: number | null;
  unit?: string | null;
  calories_kcal?: number | null;
  protein_g?: number | null;
  carbohydrates_g?: number | null;
  fat_g?: number | null;
  notes?: string | null;
};

export type MealCreateInput = {
  eaten_at: string;
  name: string;
  notes?: string | null;
  items: FoodItemInput[];
};

export async function createMeal(
  payload: MealCreateInput,
): Promise<ActionResult<Meal>> {
  const result = await apiMutate<Meal>("/meals", {
    method: "POST",
    body: payload,
  });
  if (result.ok) {
    revalidatePath("/meals");
    revalidatePath("/");
  }
  return result;
}

export type MealEditOperation =
  | {
      operation: "update_meal";
      eaten_at?: string;
      name?: string;
      notes?: string | null;
    }
  | { operation: "add_food_item"; order: number; item: FoodItemInput }
  | ({ operation: "update_food_item"; item_id: string; order?: number } & Partial<FoodItemInput>)
  | { operation: "remove_food_item"; item_id: string };

export async function editMeal(
  mealId: string,
  expectedUpdatedAt: string,
  operations: MealEditOperation[],
): Promise<ActionResult<Meal>> {
  const result = await apiMutate<Meal>(`/meals/${mealId}`, {
    method: "PATCH",
    body: { expected_updated_at: expectedUpdatedAt, operations },
  });
  if (result.ok) {
    revalidatePath("/meals");
    revalidatePath(`/meals/${mealId}`);
    revalidatePath("/");
  }
  return result;
}

export async function deleteMeal(
  mealId: string,
  expectedUpdatedAt: string,
): Promise<ActionResult<{ meal_id: string; deleted: true }>> {
  const result = await apiMutate<{ meal_id: string; deleted: true }>(
    `/meals/${mealId}`,
    {
      method: "DELETE",
      body: {
        expected_updated_at: expectedUpdatedAt,
        confirmation: `DELETE ${mealId}`,
      },
    },
  );
  if (result.ok) {
    revalidatePath("/meals");
    revalidatePath("/");
  }
  return result;
}
