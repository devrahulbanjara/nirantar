import { apiGet } from "@/lib/api";

export type Streaks = {
  as_of_date: string;
  meals: { current_streak_days: number; longest_streak_days: number };
  sleep: { current_streak_days: number; longest_streak_days: number };
  weight: { current_streak_days: number; longest_streak_days: number };
  workouts: {
    days_since_last_workout: number | null;
    workout_days_logged_this_week: number;
    target_workout_days_per_week: number | null;
  };
};

export async function getStreaks() {
  return apiGet<Streaks>("/insights/streaks");
}
