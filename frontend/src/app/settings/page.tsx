import { AppShell } from "@/components/app-shell";
import { TargetsForm } from "@/components/targets-form";
import { getTargets } from "@/lib/targets";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const result = await getTargets();
  return (
    <AppShell activeDestination={null}>
      <main className="form-page settings-page">
        <header className="workouts-page-heading">
          <div>
            <h1>Settings</h1>
            <p className="page-description">Set only the targets that matter to you.</p>
          </div>
        </header>
        {result.ok ? (
          <TargetsForm targets={result.data.targets} />
        ) : (
          <section className="workouts-state" role="alert">
            <h2>Targets are unavailable</h2>
            <p>Refresh to try again.</p>
          </section>
        )}
      </main>
    </AppShell>
  );
}
