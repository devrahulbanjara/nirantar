import { BarbellIcon } from "@phosphor-icons/react/dist/ssr";

import { AppShell } from "@/components/app-shell";
import { BackButton } from "@/components/ui/back-button";
import { EmptyState } from "@/components/ui/empty-state";

export default function WorkoutNotFound() {
  return (
    <AppShell activeDestination="workouts">
      <main className="page-container resource-detail-page">
        <EmptyState
          id="workout-not-found-title"
          title="Workout not found"
          description="It may have been deleted."
          icon={<BarbellIcon size={24} weight="regular" />}
          action={<BackButton fallbackHref="/workouts" label="Back to workouts" />}
        />
      </main>
    </AppShell>
  );
}
