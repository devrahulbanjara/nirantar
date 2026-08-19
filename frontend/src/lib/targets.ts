import { apiGet } from "@/lib/api";

export type Targets = {
  calorie_target_kcal: string | null;
  protein_target_g: string | null;
  carb_target_g: string | null;
  fat_target_g: string | null;
  goal_weight_kg: string | null;
  target_workout_days_per_week: number | null;
  updated_at: string;
};

export async function getTargets() {
  return apiGet<{ targets: Targets | null }>("/targets");
}
