import type { Icon } from "@phosphor-icons/react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FeedbackState } from "@/components/ui/feedback-state";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";

/**
 * Collection surfaces share one placement rule so a create action can never
 * render twice. See frontend/DESIGN.md -> Primary action placement.
 *
 * - `ready`       records exist and match the filter; the header owns the CTA.
 * - `first-use`   nothing to show and no filter applied; the empty state owns
 *                 the only CTA and the header omits it.
 * - `no-results`  records exist but the filter excluded them; the header keeps
 *                 the CTA and the empty state offers filter recovery instead.
 * - `unavailable` the request failed; the header keeps the CTA and the body
 *                 offers a retry.
 */
export type CollectionStatus =
  | "ready"
  | "first-use"
  | "no-results"
  | "unavailable";

export function resolveCollectionStatus({
  unavailable,
  count,
  isFiltered,
}: {
  unavailable: boolean;
  count: number;
  isFiltered: boolean;
}): CollectionStatus {
  if (unavailable) return "unavailable";
  if (count > 0) return "ready";
  return isFiltered ? "no-results" : "first-use";
}

/**
 * The create action for a collection, described once and placed by the layout
 * rather than by the page. Exactly one of these renders at a time.
 */
export type CreateAction = {
  label: string;
  href?: string;
  /** For dialog-driven creation, the trigger element rendered in place. */
  render?: (props: { size: "md" | "lg" }) => ReactNode;
  icon: Icon;
};

function renderCreateAction(action: CreateAction, size: "md" | "lg") {
  if (action.render) return action.render({ size });
  return (
    <Button href={action.href ?? "#"} variant="primary" size={size} icon={action.icon}>
      {action.label}
    </Button>
  );
}

/**
 * Header actions for a collection page. The create action is suppressed when
 * the empty state will own it, and the view toggle is hidden when there is
 * nothing to toggle.
 */
export function CollectionActions({
  status,
  filter,
  viewToggle,
  createAction,
}: {
  status: CollectionStatus;
  filter?: ReactNode;
  viewToggle?: ReactNode;
  createAction: CreateAction;
}) {
  return (
    <>
      {status === "ready" && viewToggle ? viewToggle : null}
      {filter}
      {status === "first-use" ? null : renderCreateAction(createAction, "md")}
    </>
  );
}

/**
 * The body state for a collection that has nothing to render. Chooses between
 * a first-use invitation, a filter-recovery state, and a retry state.
 */
export function CollectionEmptyBody({
  status,
  id,
  icon,
  createAction,
  emptyTitle,
  emptyDescription,
  noResultsTitle,
  noResultsDescription,
  clearFilterAction,
  unavailableTitle,
}: {
  status: Exclude<CollectionStatus, "ready">;
  id: string;
  icon: ReactNode;
  createAction: CreateAction;
  emptyTitle: string;
  emptyDescription: string;
  noResultsTitle: string;
  noResultsDescription: string;
  /** Recovery for a filter that matched nothing. Never a second create CTA. */
  clearFilterAction?: ReactNode;
  unavailableTitle: string;
}) {
  if (status === "unavailable") {
    return (
      <FeedbackState
        id={id}
        title={unavailableTitle}
        description="Refresh to try again."
        icon={<WarningCircleIcon size={24} weight="regular" />}
        tone="warning"
      />
    );
  }

  if (status === "no-results") {
    return (
      <EmptyState
        id={id}
        title={noResultsTitle}
        description={noResultsDescription}
        icon={icon}
        action={clearFilterAction}
      />
    );
  }

  return (
    <EmptyState
      id={id}
      title={emptyTitle}
      description={emptyDescription}
      icon={icon}
      action={renderCreateAction(createAction, "lg")}
    />
  );
}
