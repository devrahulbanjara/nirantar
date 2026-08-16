import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";

import { AppShell } from "@/components/app-shell";
import { NewMealForm } from "@/components/meal-form/new-meal-form";

export const dynamic = "force-dynamic";

export default function NewMealPage() {
  return (
    <AppShell activeDestination="meals">
      <main className="editor-page">
        <header className="editor-page-heading">
          <Link href="/meals" className="text-link editor-back-link">
            <ArrowLeftIcon size={16} weight="bold" aria-hidden="true" />
            Meals
          </Link>
          <h1>Log meal</h1>
        </header>
        <NewMealForm />
      </main>
    </AppShell>
  );
}
