import { apiGet } from "@/lib/api";

export type WeightEntry = {
  id: string;
  measured_on: string;
  weight_kg: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type WeightHistory = {
  start_date: string;
  end_date: string;
  measurement_count: number;
  first_weight_kg: string | null;
  last_weight_kg: string | null;
  change_kg: string | null;
  entries: WeightEntry[];
};

export type WeightHistoryResult =
  | { status: "ready"; history: WeightHistory }
  | { status: "unavailable" };

export async function getWeightHistory(
  startDate: string,
  endDate: string,
): Promise<WeightHistoryResult> {
  const search = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
  });
  const result = await apiGet<WeightHistory>(`/weights?${search.toString()}`);
  if (!result.ok) return { status: "unavailable" };
  return { status: "ready", history: result.data };
}

export type WeightForDateResult =
  | { status: "ready"; measuredOn: string; entry: WeightEntry | null }
  | { status: "unavailable" };

export async function getWeightForDate(
  measuredOn: string,
): Promise<WeightForDateResult> {
  const result = await apiGet<{ measured_on: string; entry: WeightEntry | null }>(
    `/weights/${measuredOn}`,
  );
  if (!result.ok) return { status: "unavailable" };
  return {
    status: "ready",
    measuredOn: result.data.measured_on,
    entry: result.data.entry,
  };
}
