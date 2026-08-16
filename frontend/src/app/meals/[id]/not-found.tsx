import Link from "next/link";
import { BowlFoodIcon } from "@phosphor-icons/react/dist/ssr";

import { AppShell } from "@/components/app-shell";

export default function MealNotFound() {
  return (
    <AppShell activeDestination="meals">
      <main className="editor-page">
        <section className="workouts-state" aria-labelledby="meal-not-found-title">
          <BowlFoodIcon size={24} weight="regular" aria-hidden="true" />
          <div>
            <h2 id="meal-not-found-title">Meal not found</h2>
            <p>
              It may have been deleted. <Link href="/meals">Back to meals</Link>
            </p>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
