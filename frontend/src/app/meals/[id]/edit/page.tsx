import { WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { EditMealForm } from "@/components/meal-form/edit-meal-form";
import { BackButton } from "@/components/ui/back-button";
import { FeedbackState } from "@/components/ui/feedback-state";
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
          <BackButton fallbackHref={`/meals/${id}`} label="Back to meal" />
          <h1>Edit meal</h1>
        </header>
        {result.status === "unavailable" ? (
          <FeedbackState
            id="edit-meal-error-title"
            title="This meal is unavailable"
            description="Refresh to try again."
            icon={<WarningCircleIcon size={24} weight="regular" />}
            tone="warning"
          />
        ) : (
          <EditMealForm initialMeal={result.meal} />
        )}
      </main>
    </AppShell>
  );
}
