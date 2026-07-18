"use server";

import { redirect } from "next/navigation";

import { publicEnv } from "@/lib/env";
import { getSupabaseServer } from "@/lib/supabase/server";
import { err, ok, type ActionError, type Result } from "@/lib/result";

export async function signInWithGoogle(
  next?: string,
): Promise<Result<null, ActionError>> {
  const supabase = await getSupabaseServer();

  const redirectTo = new URL("/auth/callback", publicEnv.NEXT_PUBLIC_SITE_URL);
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    redirectTo.searchParams.set("next", next);
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectTo.toString(),
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error || !data.url) {
    return err({
      code: "UNKNOWN",
      message: "Google sign in isn't available right now. Enable it in Supabase → Auth → Providers.",
    });
  }

  redirect(data.url);

  return ok(null);
}
