import Head from "next/head";
import { AppHeader } from "@/components/layout/AppHeader";
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
      <main className="min-h-screen bg-app px-4 py-8 text-ink sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          <AppHeader
            activeView="todos"
            eyebrow="Learning React"
            title="Todo Thingy"
            description="Stay focused, keep tasks moving, and celebrate your progress."
          />
          <TodoProgress />
          <TodoForm />
          <TodoListSection />
        </div>
      </main>
    </>
  );
}
