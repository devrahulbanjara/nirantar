import { AppShell } from "@/components/app-shell";
import { NewMealForm } from "@/components/meal-form/new-meal-form";
import { BackButton } from "@/components/ui/back-button";
import { getKathmanduDate } from "@/lib/daily-summary";
import { dayHref, parseDayParam } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function NewMealPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const today = getKathmanduDate();
  const date = parseDayParam(params.date, today);

  return (
    <AppShell activeDestination="meals">
      <main className="editor-page">
        <header className="editor-page-heading">
          <BackButton
            fallbackHref={dayHref("/meals", date, today)}
            label="Back to meals"
          />
          <h1>Log meal</h1>
        </header>
        <NewMealForm defaultDate={date} />
      </main>
    </AppShell>
  );
}
