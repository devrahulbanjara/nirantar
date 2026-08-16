import { apiGet } from "@/lib/api";
import { addDaysToDateString } from "@/lib/time";

export type WorkoutActivityDay = {
  date: string;
  workout_count: number;
};

export type WorkoutActivity = {
  start_date: string;
  end_date: string;
  timezone: string;
  active_day_count: number;
  days: WorkoutActivityDay[];
};

export type WorkoutActivityResult =
  | { status: "ready"; activity: WorkoutActivity }
  | { status: "unavailable" };

export type ActivityCell = {
  date: string;
  workoutCount: number;
  level: 0 | 1;
  inRange: boolean;
};

export async function getWorkoutActivity(
  startDate: string,
  endDate: string,
): Promise<WorkoutActivityResult> {
  const search = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
  });
  const result = await apiGet<WorkoutActivity>(
    `/summaries/workout-activity?${search.toString()}`,
  );
  if (!result.ok) return { status: "unavailable" };
  return { status: "ready", activity: result.data };
}

/** Sunday on or before the given YYYY-MM-DD (Nepal calendar day as civil date). */
export function startOfWeekSunday(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return addDaysToDateString(date, -weekday);
}

export function eachDateInclusive(start: string, end: string): string[] {
  const dates: string[] = [];
  let current = start;
  while (current <= end) {
    dates.push(current);
    current = addDaysToDateString(current, 1);
  }
  return dates;
}

export function buildActivityCells(
  startDate: string,
  endDate: string,
  sparseDays: WorkoutActivityDay[],
): ActivityCell[] {
  const counts = new Map(
    sparseDays.map((day) => [day.date, day.workout_count] as const),
  );
  const gridStart = startOfWeekSunday(startDate);
  return eachDateInclusive(gridStart, endDate).map((date) => {
    const inRange = date >= startDate && date <= endDate;
    const workoutCount = inRange ? (counts.get(date) ?? 0) : 0;
    return {
      date,
      workoutCount,
      level: workoutCount > 0 ? 1 : 0,
      inRange,
    };
  });
}
