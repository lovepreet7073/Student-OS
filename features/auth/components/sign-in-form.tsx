"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { signIn } from "../actions/sign-in";
import { signInSchema, type SignInInput } from "../schemas/auth";
import { AuthDivider } from "./auth-divider";
import { OAuthButtons } from "./oauth-buttons";
import { PasswordInput } from "./password-input";

const CALLBACK_ERROR_MESSAGE: Record<string, string> = {
  auth: "That sign-in link is invalid or has expired. Try again.",
  oauth: "Google sign in failed. Please try again.",
  "reset-expired": "Your reset link has expired. Request a new one below.",
};

interface SignInFormProps {
  next?: string;
  initialError?: string;
}

export function SignInForm({ next, initialError }: SignInFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (initialError && CALLBACK_ERROR_MESSAGE[initialError]) {
      toast.error(CALLBACK_ERROR_MESSAGE[initialError]);
    }
  }, [initialError]);

  async function onSubmit(values: SignInInput) {
    const result = await signIn(values, next);
    if (!result || result.ok) return;

    if (result.error.code === "VALIDATION" && result.error.fieldErrors) {
      applyFieldErrors(setError, result.error.fieldErrors);
      return;
    }
    toast.error(result.error.message);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <OAuthButtons next={next} />
      <AuthDivider>or continue with email</AuthDivider>

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
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-primary hover:underline"
          >
            Forgot?
          </Link>
        </div>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          enterKeyHint="done"
          placeholder="Enter your password"
          invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : undefined}
          {...register("password")}
        />
        <FieldError id="password-error" message={errors.password?.message} />
      </FieldGroup>

      <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
        Sign in
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Create one
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

type SetErrorFn = ReturnType<typeof useForm<SignInInput>>["setError"];

function applyFieldErrors(setError: SetErrorFn, fieldErrors: Record<string, string[]>) {
  for (const [field, messages] of Object.entries(fieldErrors)) {
    const msg = messages[0];
    if (msg) setError(field as keyof SignInInput, { message: msg });
  }
}
