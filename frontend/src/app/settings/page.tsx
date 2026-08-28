import { WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";

import { AppShell } from "@/components/app-shell";
import { TargetsForm } from "@/components/targets-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { FeedbackState } from "@/components/ui/feedback-state";
import { PageContainer, PageHeader } from "@/components/ui/page-layout";
import { getTargets } from "@/lib/targets";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const result = await getTargets();
  return (
    <AppShell activeDestination={null}>
      <PageContainer width="reading">
        <PageHeader
          title="Settings"
          description="Set only the targets that matter to you."
        />
        <section className="settings-appearance" aria-labelledby="appearance-title">
          <h2 id="appearance-title" className="editor-section-title">
            Appearance
          </h2>
          <p className="page-description">
            Follow the device by default, or lock light or dark.
          </p>
          <ThemeToggle presentation="options" />
        </section>
        {result.ok ? (
          <TargetsForm targets={result.data.targets} />
        ) : (
          <FeedbackState
            id="targets-error-title"
            title="Targets are unavailable"
            description="Refresh to try again."
            icon={<WarningCircleIcon size={24} weight="regular" />}
            tone="warning"
          />
        )}
      </PageContainer>
    </AppShell>
  );
}
