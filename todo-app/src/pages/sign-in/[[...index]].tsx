import { SignIn } from "@clerk/nextjs";
import Head from "next/head";
import { AuthPageLayout } from "@/components/auth/AuthPageLayout";
import { midnightClerkAppearance } from "@/components/auth/clerk-appearance";

export default function SignInPage() {
  return (
    <>
      <Head>
        <title>Sign in | Todo Thingy</title>
        <meta
          name="description"
          content="Sign in to access your private tasks and saved preferences."
        />
      </Head>
      <AuthPageLayout
        eyebrow="Welcome back"
        title="Your plans are waiting."
        description="Sign in to pick up where you left off, with your tasks, deadlines, and preferred theme ready to go."
      >
        <SignIn
          appearance={midnightClerkAppearance}
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/"
        />
      </AuthPageLayout>
    </>
  );
}
