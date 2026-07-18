"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { sendPasswordReset } from "../actions/send-password-reset";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "../schemas/auth";
import { VerifyEmailNotice } from "./verify-email-notice";

export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    const result = await sendPasswordReset(values);
    if (!result.ok) {
      if (result.error.code === "VALIDATION" && result.error.fieldErrors) {
        for (const [field, messages] of Object.entries(result.error.fieldErrors)) {
          const msg = messages[0];
          if (msg) setError(field as keyof ForgotPasswordInput, { message: msg });
        }
        return;
      }
      toast.error(result.error.message);
      return;
    }
    setSentTo(values.email);
  }

  if (sentTo) {
    return <VerifyEmailNotice email={sentTo} />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          enterKeyHint="send"
          placeholder="you@example.com"
          leadingIcon={<Mail />}
          invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
        {errors.email ? (
          <p id="email-error" role="alert" className="text-xs font-medium text-danger">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
        Send reset link
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
