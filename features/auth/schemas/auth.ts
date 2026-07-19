import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Enter your email address")
  .email("Enter a valid email address");

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(72, "Password is too long");

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, "Enter your name")
  .max(60, "Name is too long");

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password"),
});
export type SignInInput = z.infer<typeof signInSchema>;

export const roleSchema = z.enum(["student", "teacher"]);

export const signUpSchema = z.object({
  role: roleSchema,
  displayName: displayNameSchema,
  email: emailSchema,
  password: passwordSchema,
});
export type SignUpInput = z.infer<typeof signUpSchema>;

/** Six-digit numeric code sent via email. */
export const otpTokenSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Enter the 6-digit code");

export const sendOtpSchema = z.object({
  email: emailSchema,
  /** Signup captures role + display name up-front so we can attach them to the
   *  auth user on first send. Login-only callers omit both. */
  role: roleSchema.optional(),
  displayName: displayNameSchema.optional(),
});
export type SendOtpInput = z.infer<typeof sendOtpSchema>;

export const verifyOtpSchema = z.object({
  email: emailSchema,
  token: otpTokenSchema,
});
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  password: passwordSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
