import { apiGet } from "@/lib/api";

export type SleepEntry = {
  id: string;
  sleep_date: string;
  sleep_start: string;
  sleep_end: string;
  hours_slept: string;
  quality_rating: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export async function getSleepHistory(startDate: string, endDate: string) {
  const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
  return apiGet<{ start_date: string; end_date: string; entries: SleepEntry[] }>(
    `/sleep?${params}`,
  );
}
