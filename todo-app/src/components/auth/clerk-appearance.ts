// Clerk needs concrete colors here, so keep these aligned with the midnight-blue theme tokens.
export const midnightClerkAppearance = {
  variables: {
    colorPrimary: "#67e8f9",
    colorBackground: "#0f172a",
    colorForeground: "#f1f5f9",
    colorMutedForeground: "#94a3b8",
    colorInputBackground: "#080f20",
    colorInputForeground: "#f1f5f9",
    colorBorder: "#263248",
    colorDanger: "#fb7185",
    borderRadius: "0.75rem",
    fontFamily: "Arial, Helvetica, sans-serif",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full shadow-none",
    card: "w-full border border-line bg-surface shadow-card",
    headerTitle: "font-title text-2xl text-ink",
    headerSubtitle: "text-muted",
    socialButtonsBlockButton:
      "border-line bg-panel text-ink hover:bg-app",
    socialButtonsBlockButtonText: "font-semibold text-ink",
    dividerLine: "bg-line",
    dividerText: "text-subtle",
    formFieldLabel: "font-semibold text-muted",
    formFieldInput:
      "border-line bg-panel text-ink focus:border-primary focus:ring-primary",
    formButtonPrimary:
      "bg-primary font-semibold text-surface hover:bg-primary-hover",
    footerActionText: "text-muted",
    footerActionLink: "font-semibold text-primary hover:text-primary-hover",
    identityPreview: "border-line bg-panel",
    identityPreviewText: "text-ink",
    identityPreviewEditButton: "text-primary",
    formFieldAction: "text-primary hover:text-primary-hover",
    otpCodeFieldInput: "border-line bg-panel text-ink",
    alert: "border-line bg-panel",
  },
};

export const adaptiveClerkAppearance = {
  variables: {
    colorPrimary: "var(--theme-primary)",
    colorBackground: "var(--theme-surface)",
    colorForeground: "var(--theme-ink)",
    colorMutedForeground: "var(--theme-muted)",
    colorInputBackground: "var(--theme-panel)",
    colorInputForeground: "var(--theme-ink)",
    colorBorder: "var(--theme-line)",
    colorDanger: "var(--theme-danger)",
    borderRadius: "0.75rem",
    fontFamily: "Arial, Helvetica, sans-serif",
  },
  elements: {
    avatarBox: "h-9 w-9",
    userButtonBox: "flex-row-reverse gap-2.5",
    userButtonOuterIdentifier: "font-semibold text-ink",
    userButtonTrigger:
      "rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    userButtonPopoverCard:
      "w-72 border border-line bg-surface text-ink shadow-card",
    userButtonPopoverMain: "bg-surface",
    userPreview: "border-line bg-surface",
    userPreviewMainIdentifier: "font-semibold text-ink",
    userPreviewSecondaryIdentifier: "text-muted",
    userButtonPopoverActionButton:
      "text-muted hover:bg-panel hover:text-ink",
    userButtonPopoverActionButtonIcon: "text-subtle",
    userButtonPopoverActionButtonText: "font-medium",
    userButtonPopoverFooter: "border-t border-line bg-panel",
    userProfileRoot: "text-ink",
    navbar: "border-line bg-panel",
    navbarButton: "text-muted hover:bg-surface hover:text-ink",
    navbarButtonIcon: "text-subtle",
    pageScrollBox: "bg-surface",
    profileSection: "border-line",
    profileSectionTitleText: "text-ink",
    profileSectionContent: "text-muted",
  },
};
