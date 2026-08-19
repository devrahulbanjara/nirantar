import { AppShell } from "@/components/app-shell";
import { NewMealForm } from "@/components/meal-form/new-meal-form";
import { BackButton } from "@/components/ui/back-button";

export const dynamic = "force-dynamic";

export default function NewMealPage() {
  return (
    <AppShell activeDestination="meals">
      <main className="editor-page">
        <header className="editor-page-heading">
          <BackButton fallbackHref="/meals" label="Back to meals" />
          <h1>Log meal</h1>
        </header>
        <NewMealForm />
      </main>
    </AppShell>
  );
}
