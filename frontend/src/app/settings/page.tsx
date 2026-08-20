import { WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";

import { AppShell } from "@/components/app-shell";
import { TargetsForm } from "@/components/targets-form";
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
