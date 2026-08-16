import {
  BarbellIcon,
  BowlFoodIcon,
  CalendarDotsIcon,
  HouseIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import type { ReactNode } from "react";

type NavigationItem = {
  label: string;
  icon: Icon;
  active?: boolean;
};

const navigation: NavigationItem[] = [
  { label: "Today", icon: HouseIcon, active: true },
  { label: "Workouts", icon: BarbellIcon },
  { label: "Meals", icon: BowlFoodIcon },
  { label: "History", icon: CalendarDotsIcon },
];

function Navigation() {
  return (
    <nav className="app-navigation" aria-label="Primary navigation">
      {navigation.map(({ label, icon: NavigationIcon, active }) => (
        <span
          className="navigation-item"
          data-active={active || undefined}
          aria-current={active ? "page" : undefined}
          aria-disabled={active ? undefined : true}
          key={label}
        >
          <NavigationIcon size={22} weight={active ? "fill" : "regular"} />
          <span>{label}</span>
        </span>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <aside className="desktop-sidebar">
        <div className="brand-mark" aria-label="Nirantar">
          <span aria-hidden="true">N</span>
        </div>
        <Navigation />
      </aside>
      <div className="app-frame">
        <header className="mobile-header">
          <div className="brand-mark" aria-label="Nirantar">
            <span aria-hidden="true">N</span>
          </div>
          <span className="wordmark">Nirantar</span>
        </header>
        {children}
      </div>
      <div className="mobile-navigation">
        <Navigation />
      </div>
    </div>
  );
}
