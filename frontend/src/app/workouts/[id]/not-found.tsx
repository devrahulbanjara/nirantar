import Link from "next/link";
import { BarbellIcon } from "@phosphor-icons/react/dist/ssr";

import { AppShell } from "@/components/app-shell";

export default function WorkoutNotFound() {
  return (
    <AppShell activeDestination="workouts">
      <main className="editor-page">
        <section className="workouts-state" aria-labelledby="workout-not-found-title">
          <BarbellIcon size={24} weight="regular" aria-hidden="true" />
          <div>
            <h2 id="workout-not-found-title">Workout not found</h2>
            <p>
              It may have been deleted. <Link href="/workouts">Back to workouts</Link>
            </p>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
