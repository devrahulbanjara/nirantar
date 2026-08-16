import {
  BarbellIcon,
  BowlFoodIcon,
  CheckCircleIcon,
  GaugeIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";

import { AppShell } from "@/components/app-shell";
import {
  formatKathmanduDate,
  getDailySummary,
  getKathmanduDate,
  type DailySummary,
  type NutrientTotal,
} from "@/lib/daily-summary";

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

function EmptySummary() {
  return (
    <section className="status-panel" aria-labelledby="summary-unavailable-title">
      <WarningCircleIcon size={24} weight="regular" aria-hidden="true" />
      <div>
        <h2 id="summary-unavailable-title">Today’s summary is unavailable</h2>
        <p>Refresh to try again.</p>
      </div>
    </section>
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

function SummaryContent({ summary }: { summary: DailySummary }) {
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
            <p className="eyebrow">Meals</p>
            <h2>
              {summary.meals.meal_count === 0
                ? "No meals logged"
                : `${summary.meals.meal_count} logged`}
            </h2>
          </div>
        </div>
        {summary.meals.meal_count > 0 ? (
          <>
            <dl className="nutrition-row">
              <div>
                <dt>Energy</dt>
                <dd>
                  {formatNutrient(summary.meals.nutrition.calories_kcal, "kcal")}
                </dd>
              </div>
              <div>
                <dt>Protein</dt>
                <dd>{formatNutrient(summary.meals.nutrition.protein_g, "g")}</dd>
              </div>
            </dl>
            <NutritionCompleteness
              nutrient={summary.meals.nutrition.calories_kcal}
            />
          </>
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
      </article>
    </div>
  );
}

export default async function Home() {
  const today = getKathmanduDate();
  const result = await getDailySummary(today);

  return (
    <AppShell activeDestination="today">
      <main className="today-page">
        <header className="page-heading">
          <div>
            <p className="local-date">{formatKathmanduDate(today)}</p>
            <h1>Today</h1>
          </div>
        </header>

        <section className="daily-section" id="today-summary" aria-labelledby="daily-summary-title">
          <div className="section-heading">
            <h2 id="daily-summary-title">Daily summary</h2>
          </div>
          {result.status === "ready" ? (
            <SummaryContent summary={result.summary} />
          ) : (
            <EmptySummary />
          )}
        </section>
      </main>
    </AppShell>
  );
}
