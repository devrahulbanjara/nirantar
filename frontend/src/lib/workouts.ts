import { apiGet, getApiAuthHeaders, getApiUrl } from "@/lib/api";

export type SetType = "warmup" | "working" | "dropset";

export type Dropset = {
  id: string;
  set_order: number;
  set_type: SetType;
  weight_kg: string | null;
  reps: number | null;
  notes: string | null;
  parent_set_id: string;
};

export type ExerciseSet = {
  id: string;
  set_order: number;
  set_type: SetType;
  weight_kg: string | null;
  reps: number | null;
  notes: string | null;
  parent_set_id: string | null;
  dropsets: Dropset[];
};

export type WorkoutExercise = {
  id: string;
  exercise_name: string;
  exercise_order: number;
  notes: string | null;
  sets: ExerciseSet[];
};

export type GroupMember = {
  id: string;
  workout_exercise_id: string;
  exercise_name: string;
  member_order: number;
};

export type ExerciseGroup = {
  id: string;
  group_type: string;
  group_order: number;
  notes: string | null;
  members: GroupMember[];
};

export type Workout = {
  id: string;
  check_in_at: string;
  check_out_at: string | null;
  title: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  exercises: WorkoutExercise[];
  groups: ExerciseGroup[];
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

export type WorkoutResult =
  | { status: "ready"; workout: Workout }
  | { status: "not-found" }
  | { status: "unavailable" };

export async function getWorkout(workoutId: string): Promise<WorkoutResult> {
  const result = await apiGet<Workout>(`/workouts/${workoutId}`);
  if (result.ok) return { status: "ready", workout: result.data };
  if (result.status === 404) return { status: "not-found" };
  return { status: "unavailable" };
}
