import {
  BarbellIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusIcon,
} from "@phosphor-icons/react/dist/ssr";

import { AppShell } from "@/components/app-shell";
import {
  AggregateCard,
  MetricList,
} from "@/components/ui/aggregate-card";
import {
  CollectionActions,
  CollectionEmptyBody,
  resolveCollectionStatus,
  type CreateAction,
} from "@/components/ui/collection";
import { DayNavigator } from "@/components/ui/day-navigator";
import { DomainIcon } from "@/components/ui/metric-tile";
import { PageContainer, PageHeader } from "@/components/ui/page-layout";
import { ViewToggle, type CollectionView } from "@/components/ui/view-toggle";
import { StartWorkoutButton } from "@/components/workout-form/start-workout-button";
import { getKathmanduDate } from "@/lib/daily-summary";
import { parseDayParam } from "@/lib/time";
import { getWorkouts, openWorkoutOnDay, type Workout } from "@/lib/workouts";

export const dynamic = "force-dynamic";

const KATHMANDU_TIMEZONE = "Asia/Kathmandu";

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

function WorkoutCard({ workout }: { workout: Workout }) {
  const exerciseNames = workout.exercises.map((item) => item.exercise_name);
  const duration = formatDuration(workout.check_in_at, workout.check_out_at);
  const href = workout.check_out_at
    ? `/workouts/${workout.id}`
    : `/workouts/${workout.id}/session`;

  return (
    <AggregateCard href={href}>
      <header className="aggregate-card-header">
        <div className="aggregate-card-lead">
          <DomainIcon tone="workouts" icon={BarbellIcon} />
          <div>
            <h3>{workout.title ?? "Workout"}</h3>
            <p>
              {formatTime(workout.check_in_at)}
              {workout.check_out_at ? `–${formatTime(workout.check_out_at)}` : ""}
            </p>
          </div>
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

      <p className="metric-hero aggregate-card-hero">{duration}</p>

      <p className="exercise-preview">
        {exerciseNames.length > 0 ? exerciseNames.join(" · ") : "No exercises"}
      </p>

      <MetricList items={[
        { label: "Exercises", value: workout.exercises.length },
        { label: "Working sets", value: workout.working_set_count },
        { label: "Drop sets", value: workout.dropset_count },
      ]} />
    </AggregateCard>
  );
}

function workoutCreateAction(date: string, open: Workout | null): CreateAction {
  if (open) {
    return {
      label: "Continue workout",
      href: `/workouts/${open.id}/session`,
      icon: BarbellIcon,
    };
  }
  return {
    label: "Start workout",
    icon: PlusIcon,
    render: ({ size }) => <StartWorkoutButton date={date} size={size} />,
  };
}

export default async function WorkoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; view?: string }>;
}) {
  const params = await searchParams;
  const today = getKathmanduDate();
  const selectedDate = parseDayParam(params.date, today);
  const view: CollectionView = params.view === "grid" ? "grid" : "list";
  const result = await getWorkouts(selectedDate, selectedDate);
  const workouts = result.status === "unavailable" ? [] : result.history.workouts;
  const open = openWorkoutOnDay(workouts);
  const createAction = workoutCreateAction(selectedDate, open);
  const viewParams = selectedDate === today ? undefined : { date: selectedDate };
  const isToday = selectedDate === today;

  const status = resolveCollectionStatus({
    unavailable: result.status === "unavailable",
    count: workouts.length,
    isFiltered: false,
  });

  return (
    <AppShell activeDestination="workouts">
      <PageContainer>
        <PageHeader
          title="Workouts"
          actions={
            <CollectionActions
              status={status}
              viewToggle={
                <ViewToggle
                  basePath="/workouts"
                  view={view}
                  preferenceKey="nirantar:view:workouts"
                  params={viewParams}
                />
              }
              createAction={createAction}
            />
          }
        />

        <DayNavigator
          basePath="/workouts"
          date={selectedDate}
          today={today}
          extraParams={{ view }}
        />

        {status !== "ready" ? (
          <CollectionEmptyBody
            status={status}
            id="no-workouts-title"
            icon={<BarbellIcon size={24} weight="regular" />}
            createAction={createAction}
            emptyTitle={
              isToday ? "No workouts logged today" : "No workouts on this day"
            }
            emptyDescription={
              isToday
                ? "Start a workout to begin today’s history."
                : "Start a workout for this day."
            }
            noResultsTitle="No workouts on this day"
            noResultsDescription="Nothing was logged on this day."
            unavailableTitle="Workouts are unavailable"
          />
        ) : (
          <div
            className={
              view === "grid"
                ? "workout-list collection collection-grid-flat"
                : "workout-list collection"
            }
            data-view={view}
          >
            {workouts.map((workout) => (
              <WorkoutCard workout={workout} key={workout.id} />
            ))}
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}
