"use client";

import { ArrowLeftIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

export function BackButton({
  fallbackHref,
  label,
  collapseLabel = "never",
}: {
  fallbackHref: string;
  label: string;
  /** On narrow viewports, keep the arrow and hide the words so a toolbar stays one line. */
  collapseLabel?: "never" | "narrow";
}) {
  const router = useRouter();

  function goBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallbackHref);
  }

  return (
    <button
      type="button"
      className="back-button"
      data-collapse-label={collapseLabel}
      aria-label={label}
      onClick={goBack}
    >
      <ArrowLeftIcon size={18} weight="bold" aria-hidden="true" />
      <span className="back-button-label">{label}</span>
    </button>
  );
}
