export const clerkAppearance = {
  options: {
    socialButtonsVariant: "blockButton",
  },
  variables: {
    colorPrimary: "var(--action-bg)",
    colorBackground: "var(--surface)",
    colorForeground: "var(--ink)",
    colorMutedForeground: "var(--muted)",
    colorMuted: "var(--surface-strong)",
    colorInput: "var(--surface)",
    colorInputForeground: "var(--ink)",
    colorBorder: "var(--border)",
    colorRing: "var(--focus-ring)",
    colorDanger: "var(--danger)",
    colorSuccess: "var(--success)",
    colorWarning: "var(--warning)",
    colorNeutral: "var(--text)",
    borderRadius: "0.75rem",
    fontFamily: "var(--font-sans)",
    fontSize: "1rem",
  },
  elements: {
    rootBox: "clerk-root",
    cardBox: "clerk-card",
    headerTitle: "clerk-title",
    headerSubtitle: "clerk-subtitle",
    formButtonPrimary: "clerk-primary-button",
    socialButtonsBlockButton: "clerk-secondary-button",
    formFieldInput: "clerk-input",
    footerActionLink: "clerk-link",
    userButtonBox: "clerk-user-button-box",
    userButtonTrigger: "clerk-user-button-trigger",
    avatarBox: "clerk-avatar-box",
  },
} as const;

export const clerkLocalization = {
  signIn: {
    start: {
      subtitle: "",
      subtitleCombined: "",
    },
  },
  signUp: {
    start: {
      subtitle: "",
      subtitleCombined: "",
    },
  },
} as const;
