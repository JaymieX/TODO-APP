import Head from "next/head";
import { AppShell } from "@/components/layout/AppShell";
import { PageIntro } from "@/components/layout/AppHeader";
import { TodoForm } from "@/components/todos/TodoForm";
import { TodoListSection } from "@/components/todos/TodoListSection";
import { TodoProgress } from "@/components/todos/TodoProgress";

export default function HomePage() {
  return (
    <>
      <Head>
        <title>Todo Thingy</title>
        <meta
          name="description"
          content="A small, learner-friendly todo app built with React and Next.js."
        />
      </Head>
      <AppShell activeView="todos">
        <div className="flex w-full flex-col gap-6 lg:gap-8">
          <PageIntro
            eyebrow="Learning React"
            title="Todo Thingy"
            description="Stay focused, keep tasks moving, and celebrate your progress."
          />
          <TodoProgress />
          <TodoForm />
          <TodoListSection />
        </div>
      </AppShell>
    </>
  );
}
