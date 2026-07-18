import Head from "next/head";
import { CalendarBrowser } from "@/components/calendar/CalendarBrowser";
import { UpcomingTodos } from "@/components/calendar/UpcomingTodos";
import { PageIntro } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";

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
      <AppShell activeView="calendar">
        <div className="flex flex-col gap-6">
          <PageIntro
            eyebrow="Calendar view"
            title="Plan your month"
            description="See deadlines at a glance and keep upcoming work moving."
          />
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.5fr)]">
            <CalendarBrowser />
            <UpcomingTodos />
          </div>
        </div>
      </AppShell>
    </>
  );
}
