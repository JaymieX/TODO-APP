import { useClerk, useUser } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { adaptiveClerkAppearance } from "@/components/auth/clerk-appearance";
import { GeneralSettings } from "./GeneralSettings";

type SettingsTab = "general" | "account";

type SettingsDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

function GeneralIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path strokeLinecap="round" d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M7 14v6" />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 5 6v5c0 4.6 2.8 8.1 7 10 4.2-1.9 7-5.4 7-10V6l-7-3Z" />
      <path strokeLinecap="round" d="m9.5 12 1.6 1.6 3.5-3.6" />
    </svg>
  );
}

function AccountSecuritySettings({ onOpenClerk }: { onOpenClerk: () => void }) {
  return (
    <div className="w-full max-w-2xl text-ink">
      <div className="border-b border-line pb-5">
        <p className="text-xs font-semibold uppercase tracking-eyebrow text-primary">
          Identity and access
        </p>
        <h2 className="mt-2 font-title text-2xl font-semibold text-ink">
          Account &amp; security
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Your identity, sign-in methods, and active sessions are managed securely by Clerk.
        </p>
      </div>

      <section className="mt-6 rounded-xl border border-line bg-panel p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <AccountIcon />
        </div>
        <h3 className="mt-4 font-semibold text-ink">Clerk account manager</h3>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
          Update your profile and username, connect accounts, manage passwords, and review security settings.
        </p>
        <button
          type="button"
          onClick={onOpenClerk}
          className="mt-5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-surface transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Open account manager
        </button>
      </section>
    </div>
  );
}

const tabs: Array<{ id: SettingsTab; label: string; icon: typeof GeneralIcon }> = [
  { id: "general", label: "General", icon: GeneralIcon },
  { id: "account", label: "Account & security", icon: AccountIcon },
];

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const { openUserProfile } = useClerk();
  const { user } = useUser();

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleDialogKeys = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;

      // Keep keyboard focus inside the modal while it is open.
      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleDialogKeys);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleDialogKeys);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  const displayName = user?.fullName ?? user?.username ?? "Your account";
  const secondaryName = user?.primaryEmailAddress?.emailAddress ?? user?.username;

  const openClerkAccount = () => {
    onClose();
    openUserProfile({ appearance: adaptiveClerkAppearance });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-app/80 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-dialog-title"
        className="grid max-h-[min(48rem,calc(100vh-2rem))] w-full max-w-5xl overflow-hidden rounded-card border border-line bg-surface shadow-card md:grid-cols-[15rem_minmax(0,1fr)]"
      >
        <aside className="flex border-b border-line bg-panel p-4 md:min-h-[38rem] md:flex-col md:border-b-0 md:border-r md:p-5">
          <div className="min-w-0 flex-1 md:flex-none">
            <h1 id="settings-dialog-title" className="font-title text-2xl font-semibold text-ink">
              Settings
            </h1>
            <p className="mt-1 text-sm text-muted">Manage your workspace.</p>
          </div>

          <nav aria-label="Settings" className="ml-4 flex gap-1 overflow-x-auto md:ml-0 md:mt-7 md:flex-col">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-current={activeTab === id ? "page" : undefined}
                onClick={() => setActiveTab(id)}
                className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  activeTab === id
                    ? "bg-surface text-primary"
                    : "text-muted hover:bg-surface/70 hover:text-ink"
                }`}
              >
                <Icon />
                {label}
              </button>
            ))}
          </nav>

          <div className="mt-auto hidden border-t border-line pt-4 md:block">
            <p className="truncate text-sm font-semibold text-ink">{displayName}</p>
            {secondaryName ? <p className="mt-1 truncate text-xs text-subtle">{secondaryName}</p> : null}
          </div>
        </aside>

        <div className="relative min-h-0 overflow-y-auto p-5 sm:p-8">
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close settings"
            onClick={onClose}
            className="absolute right-4 top-4 grid size-9 place-items-center rounded-lg text-xl text-muted transition hover:bg-panel hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span aria-hidden="true">×</span>
          </button>

          <div className="pr-8">
            {activeTab === "general" ? <GeneralSettings /> : null}
            {activeTab === "account" ? (
              <AccountSecuritySettings onOpenClerk={openClerkAccount} />
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
