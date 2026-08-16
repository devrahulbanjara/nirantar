export const clerkAppearance = {
  options: {
    socialButtonsVariant: "blockButton",
  },
  variables: {
    colorPrimary: "#D4143A",
    colorBackground: "#FFFFFF",
    colorForeground: "#202124",
    colorMutedForeground: "#686D76",
    colorMuted: "#F7F7F8",
    colorInput: "#FFFFFF",
    colorInputForeground: "#202124",
    colorBorder: "#DCDDE1",
    colorRing: "#202124",
    colorDanger: "#B42318",
    colorSuccess: "#18794E",
    colorWarning: "#946200",
    colorNeutral: "#3F4248",
    borderRadius: "0.625rem",
    fontFamily: 'var(--font-geist-sans), Inter, "Segoe UI", sans-serif',
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
