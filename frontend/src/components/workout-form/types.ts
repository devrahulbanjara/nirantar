import type {
  DropsetInput,
  ExerciseInput,
  SetInput,
} from "@/lib/actions/workouts";

let counter = 0;
/** Stable client-only keys for React lists and superset exercise_refs; never sent as-is to the server. */
export function nextKey(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}-${Date.now().toString(36)}`;
}

export type DraftDropset = {
  key: string;
  weight_kg: string;
  reps: string;
  notes: string;
};

export type DraftSet = {
  key: string;
  type: "warmup" | "working";
  weight_kg: string;
  reps: string;
  notes: string;
  dropsets: DraftDropset[];
};

export type DraftExercise = {
  key: string;
  name: string;
  notes: string;
  sets: DraftSet[];
};

export function emptyDropset(): DraftDropset {
  return {
    key: nextKey("drop"),
    weight_kg: "",
    reps: "",
    notes: "",
  };
}

export function emptySet(type: DraftSet["type"] = "working"): DraftSet {
  return {
    key: nextKey("set"),
    type,
    weight_kg: "",
    reps: "",
    notes: "",
    dropsets: [],
  };
}

export function duplicateSet(set: DraftSet): DraftSet {
  return {
    ...emptySet(set.type),
    weight_kg: set.weight_kg,
    reps: set.reps,
  };
}

export function emptyExercise(): DraftExercise {
  return { key: nextKey("exercise"), name: "", notes: "", sets: [emptySet()] };
}

export function emptyWorkingSets(count = 3): SetInput[] {
  return Array.from({ length: count }, (_, index) => ({
    order: index + 1,
    type: "working" as const,
  }));
}

export function toDecimal(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function toInt(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}

export function validateSetValues(values: {
  weight_kg: string;
  reps: string;
}): string | null {
  const weight = toDecimal(values.weight_kg);
  if (weight !== null && weight < 0) return "Weight cannot be negative.";
  const reps = toInt(values.reps);
  if (reps !== null && reps < 0) return "Reps cannot be negative.";
  return null;
}

export function draftDropsetToInput(
  draft: DraftDropset,
  order: number,
): DropsetInput {
  return {
    order,
    weight_kg: toDecimal(draft.weight_kg),
    reps: toInt(draft.reps),
    notes: draft.notes.trim() || null,
  };
}

export function draftSetToInput(draft: DraftSet, order: number): SetInput {
  return {
    order,
    type: draft.type,
    weight_kg: toDecimal(draft.weight_kg),
    reps: toInt(draft.reps),
    notes: draft.notes.trim() || null,
    dropsets: draft.dropsets.map((dropset, index) =>
      draftDropsetToInput(dropset, index + 1),
    ),
  };
}

export function draftExerciseToInput(
  draft: DraftExercise,
  order: number,
): ExerciseInput {
  return {
    name: draft.name.trim(),
    order,
    notes: draft.notes.trim() || null,
    client_ref: draft.key,
    sets: draft.sets.map((set, index) => draftSetToInput(set, index + 1)),
  };
}

/** Normalize a stored decimal string (e.g. "10.000") to its edit-field text (e.g. "10"). */
export function decimalToEditValue(value: string | null): string {
  if (value === null) return "";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? String(parsed) : "";
}

export function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
