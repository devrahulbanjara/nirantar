"use server";

import { revalidatePath } from "next/cache";

import { apiMutate } from "@/lib/api";
import type { SleepEntry } from "@/lib/sleep";

export async function logSleep(payload: {
  sleep_start: string;
  sleep_end: string;
  quality_rating: number | null;
  notes: string | null;
}) {
  const result = await apiMutate<SleepEntry>("/sleep", { method: "POST", body: payload });
  if (result.ok) {
    revalidatePath("/");
    revalidatePath("/sleep");
  }
  return result;
}

export async function editSleep(
  sleepId: string,
  expectedUpdatedAt: string,
  payload: {
    sleep_start: string;
    sleep_end: string;
    quality_rating: number | null;
    notes: string | null;
  },
) {
  const result = await apiMutate<SleepEntry>(`/sleep/${sleepId}`, {
    method: "PATCH",
    body: {
      expected_updated_at: expectedUpdatedAt,
      operations: [{ operation: "update_sleep", ...payload }],
    },
  });
  if (result.ok) {
    revalidatePath("/");
    revalidatePath("/sleep");
  }
  return result;
}
