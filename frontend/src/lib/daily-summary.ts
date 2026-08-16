export type NutrientTotal = {
  known_total: string | null;
  known_item_count: number;
  missing_item_count: number;
  complete: boolean;
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
};

export type DailySummaryResult =
  | { status: "ready"; summary: DailySummary }
  | { status: "unavailable" };

const KATHMANDU_TIMEZONE = "Asia/Kathmandu";

export function getKathmanduDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: KATHMANDU_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

  return `${values.year}-${values.month}-${values.day}`;
}

export function formatKathmanduDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: KATHMANDU_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T00:00:00+05:45`));
}

export async function getDailySummary(
  summaryDate: string,
): Promise<DailySummaryResult> {
  const baseUrl = process.env.NIRANTAR_API_URL ?? "http://127.0.0.1:8000";

  try {
    const response = await fetch(
      `${baseUrl.replace(/\/$/, "")}/summaries/daily/${summaryDate}`,
      { cache: "no-store", signal: AbortSignal.timeout(5000) },
    );

    if (!response.ok) {
      return { status: "unavailable" };
    }

    return { status: "ready", summary: (await response.json()) as DailySummary };
  } catch {
    return { status: "unavailable" };
  }
}
