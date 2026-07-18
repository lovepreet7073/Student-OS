import type { Metadata } from "next";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { SignInForm } from "@/features/auth/components/sign-in-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your StudyOS account.",
};

interface LoginPageProps {
  searchParams: Promise<{ next?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next, error } = await searchParams;
  return (
    <AuthShell title="Welcome back" description="Sign in to continue your study journey.">
      <SignInForm next={next} initialError={error} />
    </AuthShell>
  );
}
