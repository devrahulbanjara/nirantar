import {
  BowlFoodIcon,
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
import { getKathmanduDate } from "@/lib/daily-summary";
import { getMeals, type Meal } from "@/lib/meals";
import {
  formatDateLabel,
  formatKathmanduTime,
  getKathmanduLocalDate,
} from "@/lib/time";

export const dynamic = "force-dynamic";

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
    <AggregateCard href={`/meals/${meal.id}`}>
      <AggregateCardHeader
        title={meal.name}
        metadata={formatKathmanduTime(meal.eaten_at)}
      />
      <p className="exercise-preview">
        {meal.items.map((item) => item.name).join(" · ")}
      </p>
      <MetricList items={[
        { label: "Items", value: meal.items.length },
        { label: "Nutrition", value: knownNutritionSummary(meal) },
      ]} />
    </AggregateCard>
  );
}

function EmptyMeals({ isDefaultRange }: { isDefaultRange: boolean }) {
  return (
    <EmptyState
      id="no-meals-title"
      title={isDefaultRange ? "No meals logged today" : "No meals in this range"}
      description={
        isDefaultRange
          ? "Log a meal to start today’s nutrition history."
          : "Nothing was logged in the selected dates."
      }
      icon={<BowlFoodIcon size={24} weight="regular" />}
      action={
        <Link href="/meals/new" className="button-primary">
          <PlusIcon size={18} weight="bold" aria-hidden="true" />
          Log meal
        </Link>
      }
    />
  );
}

function UnavailableMeals() {
  return (
    <FeedbackState
      id="meals-error-title"
      title="Meals are unavailable"
      description="Refresh to try again."
      icon={<WarningCircleIcon size={24} weight="regular" />}
      tone="warning"
    />
  );
}

export default async function MealsPage({
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

  const result = await getMeals(startDate, endDate);

  return (
    <AppShell activeDestination="meals">
      <PageContainer>
        <PageHeader
          title="Meals"
          actions={
            <>
            <ViewToggle
              basePath="/meals"
              view={view}
              preferenceKey="nirantar:view:meals"
              params={
                isDefaultRange
                  ? undefined
                  : { start: startDate, end: endDate }
              }
            />
            <DateRangeFilter
              basePath="/meals"
              startDate={startDate}
              endDate={endDate}
              isDefaultRange={isDefaultRange}
              todayDate={today}
              clearBehavior="today"
              extraParams={{ view }}
            />
            <Link href="/meals/new" className="button-primary">
              <PlusIcon size={18} weight="bold" aria-hidden="true" />
              Log meal
            </Link>
            </>
          }
        />

        {result.status === "unavailable" ? (
          <UnavailableMeals />
        ) : result.history.meals.length === 0 ? (
          <EmptyMeals isDefaultRange={isDefaultRange} />
        ) : (
          <div className="workout-groups collection" data-view={view}>
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
      </PageContainer>
    </AppShell>
  );
}
