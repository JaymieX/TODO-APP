import type { AppProps } from "next/app";
import { TodoProvider } from "@/features/todos/todo-context";
import { ThemeProvider } from "@/features/themes/theme-context";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  // The provider wraps every page so navigation does not reset the todo state.
  return (
    <ThemeProvider>
      <TodoProvider>
        <Component {...pageProps} />
      </TodoProvider>
    </ThemeProvider>
  );
}
