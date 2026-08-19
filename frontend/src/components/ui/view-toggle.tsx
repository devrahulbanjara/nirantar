"use client";

import { GridFourIcon, ListBulletsIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export type CollectionView = "list" | "grid";

function hrefFor(
  basePath: string,
  view: CollectionView,
  params?: Record<string, string>,
) {
  const search = new URLSearchParams(params);
  search.set("view", view);
  return `${basePath}?${search.toString()}`;
}

export function ViewToggle({
  basePath,
  view,
  params,
  preferenceKey,
}: {
  basePath: string;
  view: CollectionView;
  params?: Record<string, string>;
  preferenceKey: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const explicit = searchParams.get("view");
    if (explicit === "list" || explicit === "grid") {
      localStorage.setItem(preferenceKey, explicit);
      return;
    }
    const saved = localStorage.getItem(preferenceKey);
    if (saved === "list" || saved === "grid") {
      router.replace(hrefFor(basePath, saved, params));
    }
  }, [basePath, params, preferenceKey, router, searchParams]);

  function remember(nextView: CollectionView) {
    localStorage.setItem(preferenceKey, nextView);
  }

  return (
    <div className="view-toggle" role="group" aria-label="Choose display view">
      <Link
        href={hrefFor(basePath, "list", params)}
        className="view-toggle-option"
        aria-label="List view"
        aria-current={view === "list" ? "true" : undefined}
        title="List view"
        onClick={() => remember("list")}
      >
        <ListBulletsIcon size={18} weight="bold" aria-hidden="true" />
      </Link>
      <Link
        href={hrefFor(basePath, "grid", params)}
        className="view-toggle-option"
        aria-label="Grid view"
        aria-current={view === "grid" ? "true" : undefined}
        title="Grid view"
        onClick={() => remember("grid")}
      >
        <GridFourIcon size={18} weight="bold" aria-hidden="true" />
      </Link>
    </div>
  );
}
