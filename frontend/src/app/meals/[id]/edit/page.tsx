import { ArrowLeftIcon, WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { EditMealForm } from "@/components/meal-form/edit-meal-form";
import { getMeal } from "@/lib/meals";

export const dynamic = "force-dynamic";

export default async function EditMealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getMeal(id);

  if (result.status === "not-found") notFound();

  return (
    <AppShell activeDestination="meals">
      <main className="editor-page">
        <header className="editor-page-heading">
          <Link href={`/meals/${id}`} className="text-link editor-back-link">
            <ArrowLeftIcon size={16} weight="bold" aria-hidden="true" />
            Meal
          </Link>
          <h1>Edit meal</h1>
        </header>
        {result.status === "unavailable" ? (
          <section className="workouts-state" aria-labelledby="edit-meal-error-title">
            <WarningCircleIcon size={24} weight="regular" aria-hidden="true" />
            <div>
              <h2 id="edit-meal-error-title">This meal is unavailable</h2>
              <p>Refresh to try again.</p>
            </div>
          </section>
        ) : (
          <EditMealForm initialMeal={result.meal} />
        )}
      </main>
    </AppShell>
  );
}
