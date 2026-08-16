import {
  BowlFoodIcon,
  PlusIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { DateRangeFilter } from "@/components/date-range-filter";
import { getKathmanduDate } from "@/lib/daily-summary";
import { getMeals, type Meal } from "@/lib/meals";
import {
  addDaysToDateString,
  formatDateLabel,
  formatKathmanduTime,
  getKathmanduLocalDate,
} from "@/lib/time";

export const dynamic = "force-dynamic";

const DEFAULT_RANGE_DAYS = 30;

function groupMealsByDate(meals: Meal[]): Array<[string, Meal[]]> {
  const groups = new Map<string, Meal[]>();
  for (const meal of meals) {
    const date = getKathmanduLocalDate(meal.eaten_at);
    groups.set(date, [...(groups.get(date) ?? []), meal]);
  }
  return [...groups.entries()].sort(([a], [b]) => (a < b ? 1 : -1));
}

function knownNutritionSummary(meal: Meal): string {
  const known = meal.items.filter((item) => item.calories_kcal !== null);
  if (known.length === 0) return "Nutrition not provided";
  const total = known.reduce((sum, item) => sum + Number(item.calories_kcal), 0);
  const label = `${total.toLocaleString("en-US", { maximumFractionDigits: 0 })} kcal`;
  return known.length === meal.items.length
    ? label
    : `${label} · ${known.length} of ${meal.items.length} items`;
}

function MealCard({ meal }: { meal: Meal }) {
  return (
    <Link href={`/meals/${meal.id}`} className="workout-list-card">
      <header className="workout-list-heading">
        <div>
          <h3>{meal.name}</h3>
          <p>{formatKathmanduTime(meal.eaten_at)}</p>
        </div>
      </header>
      <p className="exercise-preview">
        {meal.items.map((item) => item.name).join(" · ")}
      </p>
      <dl className="workout-list-metrics">
        <div>
          <dt>Items</dt>
          <dd>{meal.items.length}</dd>
        </div>
        <div>
          <dt>Nutrition</dt>
          <dd>{knownNutritionSummary(meal)}</dd>
        </div>
      </dl>
    </Link>
  );
}

function EmptyMeals() {
  return (
    <section className="workouts-state" aria-labelledby="no-meals-title">
      <BowlFoodIcon size={24} weight="regular" aria-hidden="true" />
      <div>
        <h2 id="no-meals-title">No meals logged</h2>
        <p>Nothing in this date range yet.</p>
      </div>
    </section>
  );
}

function UnavailableMeals() {
  return (
    <section className="workouts-state" aria-labelledby="meals-error-title">
      <WarningCircleIcon size={24} weight="regular" aria-hidden="true" />
      <div>
        <h2 id="meals-error-title">Meals are unavailable</h2>
        <p>Refresh to try again.</p>
      </div>
    </section>
  );
}

export default async function MealsPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const params = await searchParams;
  const today = getKathmanduDate();
  const endDate = params.end ?? today;
  const startDate = params.start ?? addDaysToDateString(endDate, -DEFAULT_RANGE_DAYS);
  const isDefaultRange = !params.start && !params.end;

  const result = await getMeals(startDate, endDate);

  return (
    <AppShell activeDestination="meals">
      <main className="workouts-page">
        <header className="workouts-page-heading">
          <h1>Meals</h1>
          <div className="page-heading-actions">
            <DateRangeFilter
              basePath="/meals"
              startDate={startDate}
              endDate={endDate}
              isDefaultRange={isDefaultRange}
            />
            <Link href="/meals/new" className="button-primary">
              <PlusIcon size={18} weight="bold" aria-hidden="true" />
              Log meal
            </Link>
          </div>
        </header>

        {result.status === "unavailable" ? (
          <UnavailableMeals />
        ) : result.history.meals.length === 0 ? (
          <EmptyMeals />
        ) : (
          <div className="workout-groups">
            {groupMealsByDate(result.history.meals).map(([date, meals]) => (
              <section className="workout-day" key={date}>
                <h2>{date === today ? "Today" : formatDateLabel(date)}</h2>
                <div className="workout-list">
                  {meals
                    .slice()
                    .sort((a, b) => (a.eaten_at < b.eaten_at ? 1 : -1))
                    .map((meal) => (
                      <MealCard meal={meal} key={meal.id} />
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
