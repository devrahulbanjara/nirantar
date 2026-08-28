import { CheckCircleIcon, WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { BackButton } from "@/components/ui/back-button";
import { MacroGrid } from "@/components/ui/data-viz";
import { FeedbackState } from "@/components/ui/feedback-state";
import { MealDetailActions } from "@/components/meals/meal-detail-actions";
import { getMeal, type FoodItem } from "@/lib/meals";
import { macrosFromMeal } from "@/lib/nutrition";
import { formatKathmanduDateTime } from "@/lib/time";

export const dynamic = "force-dynamic";

function formatQuantity(item: FoodItem): string | null {
  if (item.quantity === null) return null;
  const value = Number(item.quantity);
  return item.unit ? `${value} ${item.unit}` : String(value);
}

function formatNutrientValue(value: string | null, unit: string): string {
  if (value === null) return "Not provided";
  return `${Number(value).toLocaleString("en-US", { maximumFractionDigits: 1 })} ${unit}`;
}

export default async function MealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getMeal(id);

  if (result.status === "not-found") notFound();

  return (
    <AppShell activeDestination="meals">
      <main className="page-container resource-detail-page">
        {result.status === "unavailable" ? (
          <FeedbackState
            id="meal-error-title"
            title="This meal is unavailable"
            description="Refresh to try again."
            icon={<WarningCircleIcon size={24} weight="regular" />}
            tone="warning"
          />
        ) : (
          <>
            <header className="detail-heading">
              <div>
                <BackButton fallbackHref="/meals" label="Back to meals" />
                <p className="local-date">
                  {formatKathmanduDateTime(result.meal.eaten_at)}
                </p>
                <h1>{result.meal.name}</h1>
              </div>
              <MealDetailActions
                mealId={result.meal.id}
                name={result.meal.name}
                updatedAt={result.meal.updated_at}
              />
            </header>

            {result.meal.notes ? (
              <p className="card-note detail-notes">{result.meal.notes}</p>
            ) : null}

            <MacroGrid items={macrosFromMeal(result.meal)} />

            <ol className="food-item-list">
              {result.meal.items
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((item) => (
                  <li className="food-item-row" key={item.id}>
                    <div className="food-item-row-heading">
                      <span className="food-item-row-name">{item.name}</span>
                      {formatQuantity(item) ? (
                        <span className="food-item-row-quantity">
                          {formatQuantity(item)}
                        </span>
                      ) : null}
                    </div>
                    <dl className="nutrition-row food-item-row-nutrition">
                      <div>
                        <dt>Calories</dt>
                        <dd>{formatNutrientValue(item.calories_kcal, "kcal")}</dd>
                      </div>
                      <div>
                        <dt>Protein</dt>
                        <dd>{formatNutrientValue(item.protein_g, "g")}</dd>
                      </div>
                      <div>
                        <dt>Carbohydrates</dt>
                        <dd>{formatNutrientValue(item.carbohydrates_g, "g")}</dd>
                      </div>
                      <div>
                        <dt>Fat</dt>
                        <dd>{formatNutrientValue(item.fat_g, "g")}</dd>
                      </div>
                    </dl>
                    {item.notes ? <p className="card-note">{item.notes}</p> : null}
                  </li>
                ))}
            </ol>
          </>
        )}
      </main>
    </AppShell>
  );
}
