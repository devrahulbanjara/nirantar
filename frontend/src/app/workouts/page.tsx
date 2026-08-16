import {
  BarbellIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { DateRangeFilter } from "@/components/date-range-filter";
import {
  AggregateCard,
  AggregateCardHeader,
  MetricList,
} from "@/components/ui/aggregate-card";
import { EmptyState } from "@/components/ui/empty-state";
import { FeedbackState } from "@/components/ui/feedback-state";
import { PageContainer, PageHeader } from "@/components/ui/page-layout";
import { ViewToggle, type CollectionView } from "@/components/ui/view-toggle";
import { formatKathmanduDate, getKathmanduDate } from "@/lib/daily-summary";
import { getWorkouts, type Workout } from "@/lib/workouts";

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

function WorkoutCard({
  workout,
  dateLabel,
}: {
  workout: Workout;
  dateLabel?: string;
}) {
  const exerciseNames = workout.exercises.map((item) => item.exercise_name);

  return (
    <AggregateCard href={`/workouts/${workout.id}`}>
      <AggregateCardHeader
        title={workout.title ?? "Workout"}
        metadata={
          <>
            {dateLabel ? <span className="aggregate-card-date">{dateLabel} · </span> : null}
            {formatTime(workout.check_in_at)}
            {workout.check_out_at ? `–${formatTime(workout.check_out_at)}` : ""}
          </>
        }
        status={<span
          className="workout-status"
          data-status={workout.check_out_at ? "completed" : "open"}
        >
          {workout.check_out_at ? (
            <CheckCircleIcon size={15} weight="fill" aria-hidden="true" />
          ) : (
            <ClockIcon size={15} weight="fill" aria-hidden="true" />
          )}
          {workout.check_out_at ? "Completed" : "Open"}
        </span>}
      />

      <p className="exercise-preview">
        {exerciseNames.length > 0 ? exerciseNames.join(" · ") : "No exercises"}
      </p>

      <MetricList items={[
        { label: "Duration", value: formatDuration(workout.check_in_at, workout.check_out_at) },
        { label: "Exercises", value: workout.exercises.length },
        { label: "Working sets", value: workout.working_set_count },
        { label: "Drop sets", value: workout.dropset_count },
      ]} />
    </AggregateCard>
  );
}

function EmptyWorkouts({ isDefaultRange }: { isDefaultRange: boolean }) {
  return (
    <EmptyState
      id="no-workouts-title"
      title={isDefaultRange ? "No workouts logged today" : "No workouts in this range"}
      description={
        isDefaultRange
          ? "Log a workout to begin today’s history."
          : "Nothing was logged in the selected dates."
      }
      icon={<BarbellIcon size={24} weight="regular" />}
      action={
        <Link href="/workouts/new" className="button-primary">
          <PlusIcon size={18} weight="bold" aria-hidden="true" />
          Log workout
        </Link>
      }
    />
  );
}

function UnavailableWorkouts() {
  return (
    <FeedbackState
      id="workouts-error-title"
      title="Workouts are unavailable"
      description="Refresh to try again."
      icon={<WarningCircleIcon size={24} weight="regular" />}
      tone="warning"
    />
  );
}

export default async function WorkoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string; view?: string }>;
}) {
  const params = await searchParams;
  const today = getKathmanduDate();
  const endDate = params.end ?? today;
  const startDate = params.start ?? today;
  const isDefaultRange = !params.start && !params.end;
  const view: CollectionView = params.view === "grid" ? "grid" : "list";
  const result = await getWorkouts(startDate, endDate);

  return (
    <AppShell activeDestination="workouts">
      <PageContainer>
        <PageHeader
          title="Workouts"
          actions={
            <>
              <ViewToggle
                basePath="/workouts"
                view={view}
                preferenceKey="nirantar:view:workouts"
                params={
                  isDefaultRange
                    ? undefined
                    : { start: startDate, end: endDate }
                }
              />
              <DateRangeFilter
                basePath="/workouts"
                startDate={startDate}
                endDate={endDate}
                isDefaultRange={isDefaultRange}
                todayDate={today}
                clearBehavior="today"
                extraParams={{ view }}
              />
              <Link href="/workouts/new" className="button-primary">
                <PlusIcon size={18} weight="bold" aria-hidden="true" />
                Log workout
              </Link>
            </>
          }
        />

        {result.status === "unavailable" ? (
          <UnavailableWorkouts />
        ) : result.history.workouts.length === 0 ? (
          <EmptyWorkouts isDefaultRange={isDefaultRange} />
        ) : view === "grid" ? (
          <div className="workout-list collection collection-grid-flat" data-view="grid">
            {groupWorkouts(result.history.workouts).flatMap(([date, workouts]) =>
              workouts.map((workout) => (
                <WorkoutCard
                  workout={workout}
                  dateLabel={date === today ? "Today" : formatKathmanduDate(date)}
                  key={workout.id}
                />
              )),
            )}
          </div>
        ) : (
          <div className="workout-groups collection" data-view={view}>
            {groupWorkouts(result.history.workouts).map(([date, workouts]) => (
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
      </PageContainer>
    </AppShell>
  );
}
