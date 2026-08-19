import { getApiAuthHeaders, getApiUrl } from "@/lib/api";
import { getKathmanduDate, KATHMANDU_OFFSET, KATHMANDU_TIMEZONE } from "@/lib/time";

export type NutrientTotal = {
  known_total: string | null;
  known_item_count: number;
  missing_item_count: number;
  complete: boolean;
  target_value: string | null;
  percentage_of_target: string | null;
};

export type DailySummary = {
  date: string;
  timezone: string;
  workouts: {
    workout_count: number;
    completed_workout_count: number;
    open_workout_count: number;
    gym_duration_seconds: number;
    working_set_count: number;
    dropset_count: number;
    physical_set_count: number;
  };
  sleep: {
    id: string;
    sleep_date: string;
    sleep_start: string;
    sleep_end: string;
    hours_slept: string;
    quality_rating: number | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
  } | null;
  meals: {
    meal_count: number;
    food_item_count: number;
    nutrition: {
      calories_kcal: NutrientTotal;
      protein_g: NutrientTotal;
      carbohydrates_g: NutrientTotal;
      fat_g: NutrientTotal;
    };
  };
  body_weight: {
    id: string;
    measured_on: string;
    weight_kg: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
  } | null;
  body_weight_goal: {
    goal_weight_kg: string;
    weight_difference_from_goal_kg: string;
    is_at_goal: boolean;
  } | null;
};

export type DailySummaryResult =
  | { status: "ready"; summary: DailySummary }
  | { status: "unavailable" };

export { getKathmanduDate };

export function formatKathmanduDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: KATHMANDU_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T00:00:00${KATHMANDU_OFFSET}`));
}

export async function getDailySummary(
  summaryDate: string,
): Promise<DailySummaryResult> {
  try {
    const headers = await getApiAuthHeaders();
    if (!headers) return { status: "unavailable" };

    const response = await fetch(
      getApiUrl(`/summaries/daily/${summaryDate}`),
      { cache: "no-store", headers, signal: AbortSignal.timeout(5000) },
    );

    if (!response.ok) {
      return { status: "unavailable" };
    }

    return { status: "ready", summary: (await response.json()) as DailySummary };
  } catch {
    return { status: "unavailable" };
  }
}
