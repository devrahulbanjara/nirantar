import {
  BarbellIcon,
  BowlFoodIcon,
  CheckCircleIcon,
  FireIcon,
  GaugeIcon,
  MoonIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";

import { auth } from "@clerk/nextjs/server";

import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { Landing } from "@/components/landing";
import { SleepEntryDialog } from "@/components/sleep-entry-dialog";
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
  type NutrientTotal,
} from "@/lib/daily-summary";
import { getStreaks, type Streaks } from "@/lib/insights";
import { addDaysToDateString } from "@/lib/time";
import {
  buildActivityCells,
  getWorkoutActivity,
} from "@/lib/workout-activity";

export const dynamic = "force-dynamic";

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
}

function formatNutrient(
  nutrient: NutrientTotal,
  unit: "kcal" | "g",
): string {
  if (nutrient.known_total === null) return "Not provided";
  return `${Number(nutrient.known_total).toLocaleString("en-US", {
    maximumFractionDigits: 1,
  })} ${unit}`;
}

function NutrientProgress({
  nutrient,
  unit,
}: {
  nutrient: NutrientTotal;
  unit: "kcal" | "g";
}) {
  const actual = formatNutrient(nutrient, unit);
  if (nutrient.target_value === null) return <h2>{actual}</h2>;
  const target = Number(nutrient.target_value).toLocaleString("en-US", {
    maximumFractionDigits: 1,
  });
  const percentage = Math.max(
    0,
    Math.min(100, Number(nutrient.percentage_of_target ?? 0)),
  );
  return (
    <>
      <h2>
        {actual.replace(` ${unit}`, "")} / {target} {unit}
      </h2>
      <div
        className="target-progress"
        role="progressbar"
        aria-label={`${unit === "kcal" ? "Energy" : "Protein"} target progress`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percentage)}
      >
        <span style={{ width: `${percentage}%` }} />
      </div>
    </>
  );
}

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

function NutritionCompleteness({ nutrient }: { nutrient: NutrientTotal }) {
  if (nutrient.complete) {
    return (
      <span className="completeness complete">
        <CheckCircleIcon size={15} weight="fill" aria-hidden="true" />
        Complete
      </span>
    );
  }

  return (
    <span className="completeness incomplete">
      <WarningCircleIcon size={15} weight="fill" aria-hidden="true" />
      {nutrient.known_item_count} of{" "}
      {nutrient.known_item_count + nutrient.missing_item_count} items
    </span>
  );
}

function SummaryContent({
  summary,
  streaks,
}: {
  summary: DailySummary;
  streaks: Streaks | null;
}) {
  const workoutStatus = summary.workouts.open_workout_count
    ? `${summary.workouts.open_workout_count} open`
    : summary.workouts.completed_workout_count
      ? `${summary.workouts.completed_workout_count} completed`
      : "No workout";

  return (
    <div className="summary-grid">
      <article className="summary-card workout-card">
        <div className="card-heading">
          <span className="icon-surface" aria-hidden="true">
            <BarbellIcon size={22} weight="bold" />
          </span>
          <div>
            <p className="eyebrow">Workout</p>
            <h2>{workoutStatus}</h2>
            {streaks && streaks.workouts.target_workout_days_per_week !== null ? (
              <p className="card-subline">
                {streaks.workouts.workout_days_logged_this_week}/
                {streaks.workouts.target_workout_days_per_week} this week
              </p>
            ) : null}
          </div>
        </div>
        {summary.workouts.workout_count > 0 ? (
          <dl className="metric-row">
            <div>
              <dt>Duration</dt>
              <dd>{formatDuration(summary.workouts.gym_duration_seconds)}</dd>
            </div>
            <div>
              <dt>Working sets</dt>
              <dd>{summary.workouts.working_set_count}</dd>
            </div>
            <div>
              <dt>Drop sets</dt>
              <dd>{summary.workouts.dropset_count}</dd>
            </div>
          </dl>
        ) : null}
      </article>

      <article className="summary-card meal-card">
        <div className="card-heading">
          <span className="icon-surface" aria-hidden="true">
            <BowlFoodIcon size={22} weight="bold" />
          </span>
          <div>
            <p className="eyebrow">Nutrition</p>
            <NutrientProgress
              nutrient={summary.meals.nutrition.calories_kcal}
              unit="kcal"
            />
          </div>
        </div>
        {summary.meals.meal_count > 0 ? (
          <>
            <dl className="nutrition-row">
              <div>
                <dt>Protein</dt>
                <dd>
                  <NutrientProgress
                    nutrient={summary.meals.nutrition.protein_g}
                    unit="g"
                  />
                </dd>
              </div>
            </dl>
            <NutritionCompleteness
              nutrient={summary.meals.nutrition.calories_kcal}
            />
          </>
        ) : null}
      </article>

      <article className="summary-card sleep-card">
        <div className="card-heading">
          <span className="icon-surface" aria-hidden="true">
            <MoonIcon size={22} weight="bold" />
          </span>
          <div>
            <p className="eyebrow">Sleep</p>
            <h2>
              {summary.sleep
                ? `${Number(summary.sleep.hours_slept).toFixed(1)} hrs`
                : "Not logged"}
            </h2>
          </div>
        </div>
        {summary.sleep?.quality_rating ? (
          <p className="card-note">Quality {summary.sleep.quality_rating}/5</p>
        ) : null}
      </article>

      <article className="summary-card weight-card">
        <div className="card-heading">
          <span className="icon-surface" aria-hidden="true">
            <GaugeIcon size={22} weight="bold" />
          </span>
          <div>
            <p className="eyebrow">Body weight</p>
            <h2>
              {summary.body_weight
                ? `${Number(summary.body_weight.weight_kg).toLocaleString("en-US", {
                    maximumFractionDigits: 3,
                  })} kg`
                : "Not logged"}
            </h2>
          </div>
        </div>
        {summary.body_weight?.notes ? (
          <p className="card-note">{summary.body_weight.notes}</p>
        ) : null}
        {summary.body_weight && summary.body_weight_goal ? (
          <p className="card-note">
            {summary.body_weight_goal.is_at_goal
              ? "At goal"
              : `${Math.abs(Number(summary.body_weight_goal.weight_difference_from_goal_kg)).toFixed(1)} kg to ${Number(summary.body_weight_goal.weight_difference_from_goal_kg) > 0 ? "lose" : "gain"}`}
          </p>
        ) : null}
      </article>
    </div>
  );
}

export default async function Home() {
  const { userId } = await auth();
  if (!userId) {
    return <Landing />;
  }

  const today = getKathmanduDate();
  const activityStart = addDaysToDateString(today, -364);
  const [result, activityResult, streakResult] = await Promise.all([
    getDailySummary(today),
    getWorkoutActivity(activityStart, today),
    getStreaks(),
  ]);
  const streaks = streakResult.ok ? streakResult.data : null;

  return (
    <AppShell activeDestination="today">
      <PageContainer>
        <PageHeader
          title="Today"
          eyebrow={formatKathmanduDate(today)}
          actions={
            streaks && streaks.meals.current_streak_days > 0 ? (
              <span className="streak-badge">
                <FireIcon size={17} weight="fill" aria-hidden="true" />
                {streaks.meals.current_streak_days} day streak
              </span>
            ) : null
          }
        />

        <div className="quick-actions">
          <Link href="/workouts/new" className="button-primary">
            <BarbellIcon size={18} weight="bold" aria-hidden="true" />
            Log workout
          </Link>
          <Link href="/meals/new" className="button-secondary">
            <BowlFoodIcon size={18} weight="bold" aria-hidden="true" />
            Log meal
          </Link>
          <WeightEntryDialog
            triggerLabel="Log weight"
            triggerClassName="button-secondary"
            defaultDate={today}
            createIcon={<GaugeIcon size={18} weight="bold" aria-hidden="true" />}
            existing={
              result.status === "ready" ? result.summary.body_weight ?? undefined : undefined
            }
          />
          <SleepEntryDialog
            triggerClassName="button-secondary"
            createIcon={<MoonIcon size={18} weight="bold" aria-hidden="true" />}
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
