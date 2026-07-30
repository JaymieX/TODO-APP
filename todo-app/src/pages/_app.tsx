import { ClerkProvider, useAuth } from "@clerk/nextjs";
import type { AppProps } from "next/app";
import { AuthBoundary } from "@/components/layout/AuthBoundary";
import { TodoProvider } from "@/features/todos/todo-context";
import { ThemeProvider } from "@/features/themes/theme-context";
import "@/styles/globals.css";

type AuthenticatedAppProps = Pick<AppProps, "Component" | "pageProps">;

function AuthenticatedApp({ Component, pageProps }: AuthenticatedAppProps) {
  const { userId } = useAuth();

  // Remount settings when accounts change so each Clerk user loads their own profile.
  return (
    <ThemeProvider key={userId}>
      <TodoProvider>
        <Component {...pageProps} />
      </TodoProvider>
    </ThemeProvider>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  // These providers stay mounted across page navigation to preserve app and auth state.
  return (
    <ClerkProvider
      {...pageProps}
      appearance={{
        cssLayerName: "clerk",
      }}
    >
      <AuthBoundary>
        <AuthenticatedApp Component={Component} pageProps={pageProps} />
      </AuthBoundary>
    </ClerkProvider>
  );
}
