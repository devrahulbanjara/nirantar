"use server";

import { revalidatePath } from "next/cache";

import { apiGet, apiMutate, type ActionResult } from "@/lib/api";
import type { WeightEntry } from "@/lib/weights";

export type LogWeightResult =
  | { ok: true; data: WeightEntry }
  | { ok: false; status: number; message: string; existing?: WeightEntry };

export async function logWeight(payload: {
  weight_kg: number;
  measured_on?: string | null;
  notes?: string | null;
}): Promise<LogWeightResult> {
  const result = await apiMutate<WeightEntry>("/weights", {
    method: "POST",
    body: payload,
  });
  if (result.ok) {
    revalidatePath("/");
    revalidatePath("/history");
    return result;
  }

  if (result.status === 422 && /already logged/i.test(result.message)) {
    const measuredOn = payload.measured_on ?? undefined;
    if (measuredOn) {
      const existingResult = await apiGet<{ measured_on: string; entry: WeightEntry | null }>(
        `/weights/${measuredOn}`,
      );
      if (existingResult.ok && existingResult.data.entry) {
        return { ...result, existing: existingResult.data.entry };
      }
    }
  }
  return result;
}

export async function editWeight(
  measuredOn: string,
  expectedUpdatedAt: string,
  payload: { weight_kg?: number; notes?: string | null },
): Promise<ActionResult<WeightEntry>> {
  const result = await apiMutate<WeightEntry>(`/weights/${measuredOn}`, {
    method: "PATCH",
    body: { expected_updated_at: expectedUpdatedAt, ...payload },
  });
  if (result.ok) {
    revalidatePath("/");
    revalidatePath("/history");
  }
  return result;
}
