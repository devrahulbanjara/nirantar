import { BowlFoodIcon, PlusIcon } from "@phosphor-icons/react/dist/ssr";

import { AppShell } from "@/components/app-shell";
import { AggregateCard } from "@/components/ui/aggregate-card";
import {
  CollectionActions,
  CollectionEmptyBody,
  resolveCollectionStatus,
  type CreateAction,
} from "@/components/ui/collection";
import { MacroGrid } from "@/components/ui/data-viz";
import { DayNavigator } from "@/components/ui/day-navigator";
import { DomainIcon } from "@/components/ui/metric-tile";
import { PageContainer, PageHeader } from "@/components/ui/page-layout";
import { ViewToggle, type CollectionView } from "@/components/ui/view-toggle";
import { getKathmanduDate } from "@/lib/daily-summary";
import { getMeals, type Meal } from "@/lib/meals";
import { macrosFromMeal } from "@/lib/nutrition";
import { dayHref, formatKathmanduTime, parseDayParam } from "@/lib/time";

export const dynamic = "force-dynamic";

function MealCard({ meal }: { meal: Meal }) {
  return (
    <AggregateCard href={`/meals/${meal.id}`}>
      <header className="aggregate-card-header">
        <div className="aggregate-card-lead">
          <DomainIcon tone="meals" icon={BowlFoodIcon} />
          <div>
            <h3>{meal.name}</h3>
            <p>{formatKathmanduTime(meal.eaten_at)}</p>
          </div>
        </div>
      </header>
      <p className="exercise-preview">
        {meal.items.map((item) => item.name).join(" · ") || "No food items"}
      </p>
      <MacroGrid items={macrosFromMeal(meal)} />
    </AggregateCard>
  );
}

function mealCreateAction(date: string, today: string): CreateAction {
  return {
    label: "Log meal",
    href: dayHref("/meals/new", date, today),
    icon: PlusIcon,
  };
}

export default async function MealsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; view?: string }>;
}) {
  const params = await searchParams;
  const today = getKathmanduDate();
  const selectedDate = parseDayParam(params.date, today);
  const view: CollectionView = params.view === "grid" ? "grid" : "list";
  const result = await getMeals(selectedDate, selectedDate);
  const meals = result.status === "unavailable" ? [] : result.history.meals;
  const createAction = mealCreateAction(selectedDate, today);
  const viewParams = selectedDate === today ? undefined : { date: selectedDate };
  const isToday = selectedDate === today;

  const status = resolveCollectionStatus({
    unavailable: result.status === "unavailable",
    count: meals.length,
    isFiltered: false,
  });

  return (
    <AppShell activeDestination="meals">
      <PageContainer>
        <PageHeader
          title="Meals"
          actions={
            <CollectionActions
              status={status}
              viewToggle={
                <ViewToggle
                  basePath="/meals"
                  view={view}
                  preferenceKey="nirantar:view:meals"
                  params={viewParams}
                />
              }
              createAction={createAction}
            />
          }
        />

        <DayNavigator
          basePath="/meals"
          date={selectedDate}
          today={today}
          extraParams={{ view }}
        />

        {status !== "ready" ? (
          <CollectionEmptyBody
            status={status}
            id="no-meals-title"
            icon={<BowlFoodIcon size={24} weight="regular" />}
            createAction={createAction}
            emptyTitle={isToday ? "No meals logged today" : "No meals on this day"}
            emptyDescription={
              isToday
                ? "Log a meal to start today’s nutrition history."
                : "Log a meal for this day."
            }
            noResultsTitle="No meals on this day"
            noResultsDescription="Nothing was logged on this day."
            unavailableTitle="Meals are unavailable"
          />
        ) : (
          <div className="workout-list collection" data-view={view}>
            {meals
              .slice()
              .sort((a, b) => (a.eaten_at < b.eaten_at ? 1 : -1))
              .map((meal) => (
                <MealCard meal={meal} key={meal.id} />
              ))}
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}
