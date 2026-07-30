import { Show, SignInButton, SignUpButton } from "@clerk/nextjs";
import { AccountMenu } from "./AccountMenu";

const authButton =
  "cursor-pointer rounded-xl px-3 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function AuthControls() {
  return (
    <div className="flex items-center gap-2">
      <Show when="signed-out">
        <SignInButton>
          <button className={`${authButton} text-muted hover:bg-panel hover:text-ink`}>
            Sign in
          </button>
        </SignInButton>
        <SignUpButton>
          <button className={`${authButton} bg-primary text-surface hover:bg-primary-hover`}>
            Sign up
          </button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <AccountMenu />
      </Show>
    </div>
  );
}
