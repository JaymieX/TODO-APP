import { SignUp } from "@clerk/nextjs";
import Head from "next/head";
import { AuthPageLayout } from "@/components/auth/AuthPageLayout";
import { midnightClerkAppearance } from "@/components/auth/clerk-appearance";

export default function SignUpPage() {
  return (
    <>
      <Head>
        <title>Create account | Todo Thingy</title>
        <meta
          name="description"
          content="Create an account to keep your tasks and preferences in sync."
        />
      </Head>
      <AuthPageLayout
        eyebrow="Start planning"
        title="Make space for what matters."
        description="Create your private workspace and keep every task, deadline, and preference connected to you."
      >
        <SignUp
          appearance={midnightClerkAppearance}
          signInUrl="/sign-in"
          fallbackRedirectUrl="/"
        />
      </AuthPageLayout>
    </>
  );
}
