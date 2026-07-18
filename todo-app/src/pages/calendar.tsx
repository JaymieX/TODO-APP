import Head from "next/head";
import { CalendarBrowser } from "@/components/calendar/CalendarBrowser";
import { UpcomingTodos } from "@/components/calendar/UpcomingTodos";
import { AppHeader } from "@/components/layout/AppHeader";

export default function CalendarPage() {
  return (
    <>
      <Head>
        <title>Calendar | Todo Thingy</title>
        <meta
          name="description"
          content="View todo deadlines in a simple monthly calendar."
        />
      </Head>
      <main className="min-h-screen bg-app px-4 py-8 text-ink sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <AppHeader
            activeView="calendar"
            eyebrow="Calendar view"
            title="Plan your month"
            description="See deadlines at a glance and keep upcoming work moving."
          />
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.5fr)]">
            <CalendarBrowser />
            <UpcomingTodos />
          </div>
        </div>
      </main>
    </>
  );
}
