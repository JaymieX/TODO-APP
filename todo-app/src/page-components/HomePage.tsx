import { TodoApp } from "@/src/presentation/components/TodoApp";

export default function HomePage() {
  const serverNow = new Date().toISOString();

  return <TodoApp serverNow={serverNow} />;
}
