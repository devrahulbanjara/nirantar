import { BowlFoodIcon } from "@phosphor-icons/react/dist/ssr";

import { AppShell } from "@/components/app-shell";
import { BackButton } from "@/components/ui/back-button";
import { EmptyState } from "@/components/ui/empty-state";

export default function MealNotFound() {
  return (
    <AppShell activeDestination="meals">
      <main className="page-container resource-detail-page">
        <EmptyState
          id="meal-not-found-title"
          title="Meal not found"
          description="It may have been deleted."
          icon={<BowlFoodIcon size={24} weight="regular" />}
          action={<BackButton fallbackHref="/meals" label="Back to meals" />}
        />
      </main>
    </AppShell>
  );
}
