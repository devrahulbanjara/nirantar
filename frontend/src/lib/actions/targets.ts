"use server";

import { revalidatePath } from "next/cache";

import { apiMutate } from "@/lib/api";
import type { Targets } from "@/lib/targets";

export async function saveTargets(payload: Record<string, number | null>) {
  const result = await apiMutate<{ targets: Targets }>("/targets", {
    method: "PATCH",
    body: payload,
  });
  if (result.ok) {
    revalidatePath("/");
    revalidatePath("/settings");
  }
  return result;
}
