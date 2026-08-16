import {
  BarbellIcon,
  CheckCircleIcon,
  ClockIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";

import { AppShell } from "@/components/app-shell";
import { formatKathmanduDate, getKathmanduDate } from "@/lib/daily-summary";
import { getRecentWorkouts, type Workout } from "@/lib/workouts";

export const dynamic = "force-dynamic";

const KATHMANDU_TIMEZONE = "Asia/Kathmandu";

function getLocalDate(timestamp: string): string {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: KATHMANDU_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(timestamp));
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function formatTime(timestamp: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: KATHMANDU_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function formatDuration(start: string, end: string | null): string {
  if (!end) return "In progress";

  const totalMinutes = Math.max(
    0,
    Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60_000),
  );
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
}

function groupWorkouts(workouts: Workout[]): Array<[string, Workout[]]> {
  const groups = new Map<string, Workout[]>();

  for (const workout of workouts) {
    const date = getLocalDate(workout.check_in_at);
    groups.set(date, [...(groups.get(date) ?? []), workout]);
  }

  return [...groups.entries()];
}

function WorkoutCard({ workout }: { workout: Workout }) {
  const exerciseNames = workout.exercises.map((item) => item.exercise_name);

  return (
    <article className="workout-list-card">
      <header className="workout-list-heading">
        <div>
          <h3>{workout.title ?? "Workout"}</h3>
          <p>
            {formatTime(workout.check_in_at)}
            {workout.check_out_at ? `–${formatTime(workout.check_out_at)}` : ""}
          </p>
        </div>
        <span
          className="workout-status"
          data-status={workout.check_out_at ? "completed" : "open"}
        >
          {workout.check_out_at ? (
            <CheckCircleIcon size={15} weight="fill" aria-hidden="true" />
          ) : (
            <ClockIcon size={15} weight="fill" aria-hidden="true" />
          )}
          {workout.check_out_at ? "Completed" : "Open"}
        </span>
      </header>

      <p className="exercise-preview">
        {exerciseNames.length > 0 ? exerciseNames.join(" · ") : "No exercises"}
      </p>

      <dl className="workout-list-metrics">
        <div>
          <dt>Duration</dt>
          <dd>{formatDuration(workout.check_in_at, workout.check_out_at)}</dd>
        </div>
        <div>
          <dt>Exercises</dt>
          <dd>{workout.exercises.length}</dd>
        </div>
        <div>
          <dt>Working sets</dt>
          <dd>{workout.working_set_count}</dd>
        </div>
        <div>
          <dt>Drop sets</dt>
          <dd>{workout.dropset_count}</dd>
        </div>
      </dl>
    </article>
  );
}

function EmptyWorkouts() {
  return (
    <section className="workouts-state" aria-labelledby="no-workouts-title">
      <BarbellIcon size={24} weight="regular" aria-hidden="true" />
      <div>
        <h2 id="no-workouts-title">No workouts yet</h2>
      </div>
    </section>
  );
}

function UnavailableWorkouts() {
  return (
    <section className="workouts-state" aria-labelledby="workouts-error-title">
      <WarningCircleIcon size={24} weight="regular" aria-hidden="true" />
      <div>
        <h2 id="workouts-error-title">Workouts are unavailable</h2>
        <p>Refresh to try again.</p>
      </div>
    </section>
  );
}

export default async function WorkoutsPage() {
  const result = await getRecentWorkouts();
  const today = getKathmanduDate();

  return (
    <AppShell activeDestination="workouts">
      <main className="workouts-page">
        <header className="workouts-page-heading">
          <h1>Workouts</h1>
        </header>

        {result.status === "unavailable" ? (
          <UnavailableWorkouts />
        ) : result.workouts.length === 0 ? (
          <EmptyWorkouts />
        ) : (
          <div className="workout-groups">
            {groupWorkouts(result.workouts).map(([date, workouts]) => (
              <section className="workout-day" key={date}>
                <h2>{date === today ? "Today" : formatKathmanduDate(date)}</h2>
                <div className="workout-list">
                  {workouts.map((workout) => (
                    <WorkoutCard workout={workout} key={workout.id} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </AppShell>
  );
}
