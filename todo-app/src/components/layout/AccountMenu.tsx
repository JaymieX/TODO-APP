import { useClerk, useUser } from "@clerk/nextjs";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { SettingsDialog } from "./SettingsDialog";

type AccountMenuProps = {
  customItems?: ReactNode;
};

function SettingsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.5a2 2 0 0 1 2 2v.4a7 7 0 0 1 1.7 1l.4-.2a2 2 0 0 1 2.7.7l.5.8a2 2 0 0 1-.7 2.7l-.4.2a7 7 0 0 1 0 2l.4.2a2 2 0 0 1 .7 2.7l-.5.8a2 2 0 0 1-2.7.7l-.4-.2a7 7 0 0 1-1.7 1v.4a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-.4a7 7 0 0 1-1.7-1l-.4.2a2 2 0 0 1-2.7-.7l-.5-.8a2 2 0 0 1 .7-2.7l.4-.2a7 7 0 0 1 0-2l-.4-.2a2 2 0 0 1-.7-2.7l.5-.8a2 2 0 0 1 2.7-.7l.4.2a7 7 0 0 1 1.7-1v-.4a2 2 0 0 1 2-2h1Z" />
      <circle cx="11.5" cy="12" r="2.5" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H10M14 8l4 4-4 4M9 12h9" />
    </svg>
  );
}

export function AccountMenu({ customItems }: AccountMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { signOut } = useClerk();
  const { user } = useUser();

  useEffect(() => {
    if (!isMenuOpen) return;

    const closeMenu = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setIsMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };

    document.addEventListener("mousedown", closeMenu);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeMenu);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isMenuOpen]);

  const displayName = user?.fullName ?? user?.username ?? "Your account";
  const secondaryName = user?.username ?? user?.primaryEmailAddress?.emailAddress;
  const initial = displayName.slice(0, 1).toUpperCase();

  return (
    <>
      <div ref={menuRef} className="relative min-w-0">
        <button
          type="button"
          aria-label="Open account menu"
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
          onClick={() => setIsMenuOpen((open) => !open)}
          className="flex min-w-0 items-center gap-3 rounded-xl p-1.5 text-left transition hover:bg-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-primary bg-cover bg-center text-sm font-bold text-surface"
            style={user?.imageUrl ? { backgroundImage: `url(${user.imageUrl})` } : undefined}
          >
            {user?.imageUrl ? null : initial}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-ink">{displayName}</span>
            {secondaryName ? <span className="block truncate text-xs text-muted">{secondaryName}</span> : null}
          </span>
        </button>

        {isMenuOpen ? (
          <div
            role="menu"
            aria-label="Account menu"
            className="absolute bottom-full left-0 z-30 mb-2 w-64 rounded-xl border border-line bg-surface p-1.5 shadow-card"
          >
            {customItems}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsMenuOpen(false);
                setIsSettingsOpen(true);
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-muted transition hover:bg-panel hover:text-ink"
            >
              <SettingsIcon />
              Settings
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => void signOut({ redirectUrl: "/sign-in" })}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-muted transition hover:bg-panel hover:text-ink"
            >
              <SignOutIcon />
              Sign out
            </button>
          </div>
        ) : null}
      </div>

      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}
