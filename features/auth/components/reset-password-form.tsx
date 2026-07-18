"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { updatePassword } from "../actions/update-password";
import { resetPasswordSchema, type ResetPasswordInput } from "../schemas/auth";
import { PasswordInput } from "./password-input";

export function ResetPasswordForm() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "" },
  });

  async function onSubmit(values: ResetPasswordInput) {
    const result = await updatePassword(values);
    if (!result || result.ok) return;

    if (result.error.code === "VALIDATION" && result.error.fieldErrors) {
      for (const [field, messages] of Object.entries(result.error.fieldErrors)) {
        const msg = messages[0];
        if (msg) setError(field as keyof ResetPasswordInput, { message: msg });
      }
      return;
    }
    toast.error(result.error.message);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">New password</Label>
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
          <p id="password-error" role="alert" className="text-xs font-medium text-danger">
            {errors.password.message}
          </p>
        ) : (
          <p id="password-helper" className="text-xs text-muted-foreground">
            Use at least 8 characters.
          </p>
        )}
      </div>

      <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
        Update password
      </Button>
    </form>
  );
}
