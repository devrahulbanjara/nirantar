import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";

import { AppShell } from "@/components/app-shell";
import { NewWorkoutForm } from "@/components/workout-form/new-workout-form";

export const dynamic = "force-dynamic";

export default function NewWorkoutPage() {
  return (
    <AppShell activeDestination="workouts">
      <main className="editor-page">
        <header className="editor-page-heading">
          <Link href="/workouts" className="text-link editor-back-link">
            <ArrowLeftIcon size={16} weight="bold" aria-hidden="true" />
            Workouts
          </Link>
          <h1>Log workout</h1>
        </header>
        <NewWorkoutForm />
      </main>
    </AppShell>
  );
}
