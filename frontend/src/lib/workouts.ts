import { getApiAuthHeaders, getApiUrl } from "@/lib/api";

export type Workout = {
  id: string;
  check_in_at: string;
  check_out_at: string | null;
  title: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  exercises: Array<{
    id: string;
    exercise_name: string;
    exercise_order: number;
  }>;
  groups: Array<{
    id: string;
    group_type: string;
    group_order: number;
  }>;
  working_set_count: number;
  dropset_count: number;
  physical_set_count: number;
};

export type RecentWorkoutsResult =
  | { status: "ready"; workouts: Workout[] }
  | { status: "unavailable" };

export async function getRecentWorkouts(
  limit = 20,
): Promise<RecentWorkoutsResult> {
  try {
    const headers = await getApiAuthHeaders();
    if (!headers) return { status: "unavailable" };

    const response = await fetch(getApiUrl(`/workouts/recent?limit=${limit}`), {
      cache: "no-store",
      headers,
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return { status: "unavailable" };
    }

    return {
      status: "ready",
      workouts: (await response.json()) as Workout[],
    };
  } catch {
    return { status: "unavailable" };
  }
}
