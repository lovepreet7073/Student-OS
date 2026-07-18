"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, User } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { signUp } from "../actions/sign-up";
import { signUpSchema, type SignUpInput } from "../schemas/auth";
import { AuthDivider } from "./auth-divider";
import { OAuthButtons } from "./oauth-buttons";
import { PasswordInput } from "./password-input";
import { VerifyEmailNotice } from "./verify-email-notice";

interface SignUpFormProps {
  next?: string;
}

export function SignUpForm({ next }: SignUpFormProps) {
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { displayName: "", email: "", password: "" },
  });

  async function onSubmit(values: SignUpInput) {
    const result = await signUp(values);
    if (!result || !result.ok) {
      if (result?.error.code === "VALIDATION" && result.error.fieldErrors) {
        for (const [field, messages] of Object.entries(result.error.fieldErrors)) {
          const msg = messages[0];
          if (msg) setError(field as keyof SignUpInput, { message: msg });
        }
        return;
      }
      toast.error(result?.error.message ?? "Sign up failed.");
      return;
    }
    if (result.data.needsVerification) {
      setVerificationEmail(result.data.email);
    }
    // Otherwise the action redirected — nothing to do here.
  }

  if (verificationEmail) {
    return <VerifyEmailNotice email={verificationEmail} />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <OAuthButtons next={next} />
      <AuthDivider>or sign up with email</AuthDivider>

      <FieldGroup>
        <Label htmlFor="displayName">Name</Label>
        <Input
          id="displayName"
          type="text"
          autoComplete="name"
          autoCapitalize="words"
          enterKeyHint="next"
          placeholder="Your name"
          leadingIcon={<User />}
          invalid={!!errors.displayName}
          aria-describedby={errors.displayName ? "displayName-error" : undefined}
          {...register("displayName")}
        />
        <FieldError id="displayName-error" message={errors.displayName?.message} />
      </FieldGroup>

      <FieldGroup>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          enterKeyHint="next"
          placeholder="you@example.com"
          leadingIcon={<Mail />}
          invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
        <FieldError id="email-error" message={errors.email?.message} />
      </FieldGroup>

      <FieldGroup>
        <Label htmlFor="password">Password</Label>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          enterKeyHint="done"
          placeholder="At least 8 characters"
          invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : "password-helper"}
          {...register("password")}
        />
        {errors.password ? (
          <FieldError id="password-error" message={errors.password.message} />
        ) : (
          <p id="password-helper" className="text-xs text-muted-foreground">
            Use at least 8 characters. Mix letters, numbers, and symbols for stronger security.
          </p>
        )}
      </FieldGroup>

      <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
        Create account
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        By continuing you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">
          Terms
        </Link>{" "}
        &{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
          Privacy
        </Link>
        .
      </p>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-2">{children}</div>;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-xs font-medium text-danger">
      {message}
    </p>
  );
}
