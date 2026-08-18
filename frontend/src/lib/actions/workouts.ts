"use server";

import { revalidatePath } from "next/cache";

import { apiGet, apiMutate, type ActionResult } from "@/lib/api";
import type { Workout } from "@/lib/workouts";

export async function refetchWorkout(
  workoutId: string,
): Promise<ActionResult<Workout>> {
  return apiGet<Workout>(`/workouts/${workoutId}`);
}

export type DropsetInput = {
  order: number;
  weight_kg?: number | null;
  reps?: number | null;
  rir?: number | null;
  rpe?: number | null;
  notes?: string | null;
};

export type SetInput = {
  order: number;
  type: "warmup" | "working";
  weight_kg?: number | null;
  reps?: number | null;
  rir?: number | null;
  rpe?: number | null;
  notes?: string | null;
  client_ref?: string | null;
  dropsets?: DropsetInput[];
};

export type ExerciseInput = {
  name: string;
  order: number;
  notes?: string | null;
  client_ref?: string | null;
  sets: SetInput[];
};

export type GroupInput = {
  type: "superset";
  order: number;
  notes?: string | null;
  exercise_refs: string[];
};

export type WorkoutCreateInput = {
  check_in_at: string;
  check_out_at?: string | null;
  title?: string | null;
  notes?: string | null;
  exercises: ExerciseInput[];
  groups: GroupInput[];
};

export async function createWorkout(
  payload: WorkoutCreateInput,
): Promise<ActionResult<Workout>> {
  const result = await apiMutate<Workout>("/workouts", {
    method: "POST",
    body: payload,
  });
  if (result.ok) {
    revalidatePath("/workouts");
    revalidatePath("/");
  }
  return result;
}

export type WorkoutEditOperation =
  | {
      operation: "update_workout";
      check_in_at?: string;
      check_out_at?: string | null;
      title?: string | null;
      notes?: string | null;
    }
  | { operation: "add_exercise"; exercise: ExerciseInput }
  | {
      operation: "update_exercise";
      exercise_id: string;
      name?: string;
      order?: number;
      notes?: string | null;
    }
  | { operation: "remove_exercise"; exercise_id: string }
  | { operation: "add_set"; exercise_id: string; set: SetInput }
  | {
      operation: "add_dropset";
      parent_set_id: string;
      dropset: DropsetInput;
    }
  | {
      operation: "update_set";
      set_id: string;
      order?: number;
      weight_kg?: number | null;
      reps?: number | null;
      rir?: number | null;
      rpe?: number | null;
      notes?: string | null;
    }
  | { operation: "remove_set"; set_id: string; cascade_dropsets?: boolean }
  | { operation: "add_superset"; order: number; notes?: string | null; workout_exercise_ids: string[] }
  | { operation: "update_superset"; superset_id: string; order?: number; notes?: string | null; workout_exercise_ids?: string[] }
  | { operation: "remove_superset"; superset_id: string };

export async function editWorkout(
  workoutId: string,
  expectedUpdatedAt: string,
  operations: WorkoutEditOperation[],
): Promise<ActionResult<Workout>> {
  const result = await apiMutate<Workout>(`/workouts/${workoutId}`, {
    method: "PATCH",
    body: { expected_updated_at: expectedUpdatedAt, operations },
  });
  if (result.ok) {
    revalidatePath("/workouts");
    revalidatePath(`/workouts/${workoutId}`);
    revalidatePath("/");
  }
  return result;
}

export async function deleteWorkout(
  workoutId: string,
  expectedUpdatedAt: string,
  confirmation: string,
): Promise<ActionResult<{ workout_id: string; deleted: true }>> {
  const result = await apiMutate<{ workout_id: string; deleted: true }>(
    `/workouts/${workoutId}`,
    {
      method: "DELETE",
      body: { expected_updated_at: expectedUpdatedAt, confirmation },
    },
  );
  if (result.ok) {
    revalidatePath("/workouts");
    revalidatePath("/");
  }
  return result;
}
