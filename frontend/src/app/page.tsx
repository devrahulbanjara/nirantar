import {
  BarbellIcon,
  BowlFoodIcon,
  FireIcon,
  GaugeIcon,
  MoonIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";

import { auth } from "@clerk/nextjs/server";

import { Button } from "@/components/ui/button";
import {
  GaugeBar,
  MacroGrid,
  MacroRings,
  StatusBadge,
} from "@/components/ui/data-viz";
import { DomainIcon } from "@/components/ui/metric-tile";
import { WeekStrip } from "@/components/ui/week-strip";

import { AppShell } from "@/components/app-shell";
import { Landing } from "@/components/landing";
import { SleepEntryDialog } from "@/components/sleep-entry-dialog";
import { StartWorkoutButton } from "@/components/workout-form/start-workout-button";
import { WorkoutActivityCalendar } from "@/components/workout-activity-calendar";
import { FeedbackState } from "@/components/ui/feedback-state";
import {
  PageContainer,
  PageHeader,
  SectionHeader,
} from "@/components/ui/page-layout";
import { WeightEntryDialog } from "@/components/weight-entry-dialog";
import {
  formatKathmanduDate,
  getDailySummary,
  getKathmanduDate,
  type DailySummary,
} from "@/lib/daily-summary";
import { getStreaks, type Streaks } from "@/lib/insights";
import {
  clampSummaryDate,
  formatNumeric,
  macrosFromSummary,
} from "@/lib/nutrition";
import { addDaysToDateString, dayHref, formatDurationSeconds } from "@/lib/time";
import {
  buildActivityCells,
  getWorkoutActivity,
} from "@/lib/workout-activity";
import { getWorkouts, openWorkoutOnDay } from "@/lib/workouts";

export const dynamic = "force-dynamic";

function EmptySummary() {
  return (
    <FeedbackState
      id="summary-unavailable-title"
      title="Today’s summary is unavailable"
      description="Refresh to try again."
      icon={<WarningCircleIcon size={24} weight="regular" />}
      tone="warning"
    />
  );
}

function UnavailableActivity() {
  return (
    <FeedbackState
      id="workout-activity-unavailable-title"
      title="Workout activity is unavailable"
      description="Refresh to try again."
      icon={<WarningCircleIcon size={24} weight="regular" />}
      tone="warning"
    />
  );
}

function SummaryContent({
  summary,
  streaks,
}: {
  summary: DailySummary;
  streaks: Streaks | null;
}) {
  const workoutLogged = summary.workouts.workout_count > 0;
  const workoutHero = workoutLogged
    ? formatDurationSeconds(summary.workouts.gym_duration_seconds)
    : summary.workouts.open_workout_count
      ? `${summary.workouts.open_workout_count} open`
      : "No workout";
  const weeklyTarget = streaks?.workouts.target_workout_days_per_week;
  const weeklyLogged = streaks?.workouts.workout_days_logged_this_week;
  const weeklyPercent =
    weeklyTarget && weeklyTarget > 0 && weeklyLogged !== undefined
      ? (weeklyLogged / weeklyTarget) * 100
      : null;
  const macros = macrosFromSummary(summary);
  const hasMacroTargets = macros.some((item) => item.target);
  const calories = summary.meals.nutrition.calories_kcal;
  const sleepHours = summary.sleep
    ? Number(summary.sleep.hours_slept).toFixed(1)
    : null;
  const weight = summary.body_weight
    ? formatNumeric(summary.body_weight.weight_kg, 3)
    : null;

  return (
    <div className="summary-grid">
      <article className="summary-card" aria-label="Workout">
        <div className="card-heading">
          <DomainIcon tone="workouts" icon={BarbellIcon} />
          <div>
            <p className="metric-hero">{workoutHero}</p>
            {weeklyTarget !== null && weeklyTarget !== undefined ? (
              <p className="card-subline">
                {weeklyLogged}/{weeklyTarget} days this week
              </p>
            ) : null}
          </div>
        </div>
        {weeklyPercent !== null ? (
          <GaugeBar
            label="Weekly target"
            value={weeklyLogged}
            target={weeklyTarget}
            unit="days"
            percentage={weeklyPercent}
            tone="workouts"
          />
        ) : null}
        {workoutLogged ? (
          <dl className="metric-list" data-count="3">
            <div>
              <dt>Working sets</dt>
              <dd>{summary.workouts.working_set_count}</dd>
            </div>
            <div>
              <dt>Drop sets</dt>
              <dd>{summary.workouts.dropset_count}</dd>
            </div>
            <div>
              <dt>Physical sets</dt>
              <dd>{summary.workouts.physical_set_count}</dd>
            </div>
          </dl>
        ) : null}
      </article>

      <article className="summary-card" aria-label="Nutrition">
        <div className="card-heading">
          <DomainIcon tone="meals" icon={BowlFoodIcon} />
          <div>
            <p className="metric-hero">
              {formatNumeric(calories.known_total, 0) ?? "Not provided"}
              {calories.known_total !== null ? <abbr>kcal</abbr> : null}
            </p>
            {summary.meals.meal_count > 0 ? (
              <p className="card-subline">
                {summary.meals.meal_count} meal
                {summary.meals.meal_count === 1 ? "" : "s"}
              </p>
            ) : (
              <p className="card-subline">No meals logged</p>
            )}
          </div>
        </div>
        {summary.meals.meal_count > 0 ? (
          <>
            {calories.target_value !== null ? (
              <GaugeBar
                label="Energy"
                value={formatNumeric(calories.known_total, 0) ?? "Not provided"}
                target={formatNumeric(calories.target_value, 0)}
                unit="kcal"
                percentage={calories.percentage_of_target}
                tone="calories"
              />
            ) : null}
            {hasMacroTargets ? (
              <MacroRings items={macros} />
            ) : (
              <MacroGrid items={macros} />
            )}
          </>
        ) : null}
      </article>

      <article className="summary-card" aria-label="Sleep">
        <div className="card-heading">
          <DomainIcon tone="sleep" icon={MoonIcon} />
          <div>
            <p className="metric-hero">
              {sleepHours ?? "Not logged"}
              {sleepHours ? <abbr>hrs</abbr> : null}
            </p>
            {summary.sleep?.quality_rating ? (
              <StatusBadge tone="neutral">
                Quality {summary.sleep.quality_rating}/5
              </StatusBadge>
            ) : null}
          </div>
        </div>
      </article>

      <article className="summary-card" aria-label="Body weight">
        <div className="card-heading">
          <DomainIcon tone="weight" icon={GaugeIcon} />
          <div>
            <p className="metric-hero">
              {weight ?? "Not logged"}
              {weight ? <abbr>kg</abbr> : null}
            </p>
            {summary.body_weight?.notes ? (
              <p className="card-subline">{summary.body_weight.notes}</p>
            ) : null}
            {summary.body_weight && summary.body_weight_goal ? (
              <p className="card-subline">
                {summary.body_weight_goal.is_at_goal
                  ? "At goal"
                  : `${Math.abs(Number(summary.body_weight_goal.weight_difference_from_goal_kg)).toFixed(1)} kg to ${Number(summary.body_weight_goal.weight_difference_from_goal_kg) > 0 ? "lose" : "gain"}`}
              </p>
            ) : null}
          </div>
        </div>
      </article>
    </div>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) {
    return <Landing />;
  }

  const params = await searchParams;
  const today = getKathmanduDate();
  const selectedDate = clampSummaryDate(params.date, today);
  const activityStart = addDaysToDateString(today, -364);
  const [result, activityResult, streakResult, workoutsResult] = await Promise.all([
    getDailySummary(selectedDate),
    getWorkoutActivity(activityStart, today),
    getStreaks(),
    getWorkouts(selectedDate, selectedDate),
  ]);
  const streaks = streakResult.ok ? streakResult.data : null;
  const openWorkout =
    workoutsResult.status === "ready"
      ? openWorkoutOnDay(workoutsResult.history.workouts)
      : null;
  const activeDates = new Set(
    activityResult.status === "ready"
      ? activityResult.activity.days
          .filter((day) => day.workout_count > 0)
          .map((day) => day.date)
      : [],
  );

  return (
    <AppShell activeDestination="today">
      <PageContainer>
        <PageHeader
          title={selectedDate === today ? "Today" : formatKathmanduDate(selectedDate)}
          eyebrow={selectedDate === today ? formatKathmanduDate(selectedDate) : undefined}
          actions={
            streaks && streaks.meals.current_streak_days > 0 ? (
              <span className="streak-badge">
                <FireIcon size={17} weight="fill" aria-hidden="true" />
                {streaks.meals.current_streak_days} day streak
              </span>
            ) : null
          }
        />

        <WeekStrip
          today={today}
          selected={selectedDate}
          activeDates={activeDates}
        />

        <div className="quick-actions">
          {openWorkout ? (
            <Button
              href={`/workouts/${openWorkout.id}/session`}
              variant="secondary"
              size="lg"
              icon={BarbellIcon}
            >
              Continue workout
            </Button>
          ) : (
            <StartWorkoutButton
              date={selectedDate}
              size="lg"
              variant="secondary"
            />
          )}
          <Button
            href={dayHref("/meals/new", selectedDate, today)}
            variant="secondary"
            size="lg"
            icon={BowlFoodIcon}
          >
            Log meal
          </Button>
          <WeightEntryDialog
            triggerLabel="Log weight"
            triggerVariant="secondary"
            triggerSize="lg"
            triggerGlyph="weight"
            defaultDate={selectedDate}
            existing={
              result.status === "ready" ? result.summary.body_weight ?? undefined : undefined
            }
          />
          <SleepEntryDialog
            triggerVariant="secondary"
            triggerSize="lg"
            triggerGlyph="sleep"
            existing={
              result.status === "ready" ? result.summary.sleep ?? undefined : undefined
            }
          />
        </div>

        <section className="daily-section" id="today-summary" aria-labelledby="daily-summary-title">
          <SectionHeader id="daily-summary-title" title="Daily summary" />
          {result.status === "ready" ? (
            <SummaryContent summary={result.summary} streaks={streaks} />
          ) : (
            <EmptySummary />
          )}
        </section>

        <section
          className="daily-section"
          id="workout-activity"
          aria-labelledby="workout-activity-title"
        >
          <SectionHeader id="workout-activity-title" title="Workout activity" />
          {activityResult.status === "ready" ? (
            <WorkoutActivityCalendar
              cells={buildActivityCells(
                activityStart,
                today,
                activityResult.activity.days,
              )}
              activeDayCount={activityResult.activity.active_day_count}
            />
          ) : (
            <UnavailableActivity />
          )}
        </section>
      </PageContainer>
    </AppShell>
  );
}
