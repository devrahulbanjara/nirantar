"use client";

import {
  BarbellIcon,
  BowlFoodIcon,
  GaugeIcon,
  GearIcon,
  HouseIcon,
  MoonIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Show, UserButton } from "@clerk/nextjs";
import type { Icon } from "@phosphor-icons/react";
import Link from "next/link";
import type { ReactNode } from "react";

import { BrandLogo } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { clerkAppearance } from "@/lib/clerk-appearance";

export type NavigationDestination = "today" | "workouts" | "meals" | "sleep" | "weight";

type NavigationItem = {
  destination: NavigationDestination;
  label: string;
  icon: Icon;
  href?: string;
};

const navigation: NavigationItem[] = [
  { destination: "today", label: "Today", icon: HouseIcon, href: "/" },
  {
    destination: "workouts",
    label: "Workouts",
    icon: BarbellIcon,
    href: "/workouts",
  },
  { destination: "meals", label: "Meals", icon: BowlFoodIcon, href: "/meals" },
  { destination: "sleep", label: "Sleep", icon: MoonIcon, href: "/sleep" },
  {
    destination: "weight",
    label: "Weight",
    icon: GaugeIcon,
    href: "/weight",
  },
];

function Navigation({ activeDestination }: { activeDestination: NavigationDestination | null }) {
  return (
    <nav className="app-navigation" aria-label="Primary navigation">
      {navigation.map(({ destination, label, icon: NavigationIcon, href }) => {
        const active = destination === activeDestination;
        const content = (
          <>
            <NavigationIcon size={22} weight={active ? "fill" : "regular"} />
            <span>{label}</span>
          </>
        );

        if (href) {
          return (
            <Link
              className="navigation-item"
              data-active={active || undefined}
              data-destination={destination}
              aria-current={active ? "page" : undefined}
              href={href}
              key={destination}
            >
              {content}
            </Link>
          );
        }

        return (
          <span
            className="navigation-item"
            aria-disabled="true"
            key={destination}
          >
            {content}
          </span>
        );
      })}
    </nav>
  );
}

function AccountControls({ layout }: { layout: "header" | "sidebar" }) {
  return (
    <div className="account-controls" data-layout={layout}>
      <ThemeToggle />
      <Show when="signed-out">
        {layout === "header" ? (
          <>
            <Button href="/sign-in" variant="secondary" size="md">
              Sign in
            </Button>
            <Button href="/sign-up" variant="primary" size="md">
              Sign up
            </Button>
          </>
        ) : (
          <Button href="/sign-in" variant="secondary" size="md">
            Sign in
          </Button>
        )}
      </Show>
      <Show when="signed-in">
        <UserButton appearance={clerkAppearance}>
          <UserButton.MenuItems>
            <UserButton.Link label="Settings" labelIcon={<GearIcon size={16} />} href="/settings" />
          </UserButton.MenuItems>
        </UserButton>
      </Show>
    </div>
  );
}

export function AppShell({
  activeDestination,
  children,
}: {
  activeDestination: NavigationDestination | null;
  children: ReactNode;
}) {
  return (
    <div className="app-shell">
      <aside className="desktop-sidebar">
        <BrandLogo />
        <Navigation activeDestination={activeDestination} />
        <AccountControls layout="sidebar" />
      </aside>
      <div className="app-frame">
        <header className="mobile-header">
          <BrandLogo />
          <AccountControls layout="header" />
        </header>
        {children}
      </div>
      <div className="mobile-navigation">
        <Navigation activeDestination={activeDestination} />
      </div>
    </div>
  );
}
