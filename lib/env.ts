import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
});

// Empty string in `.env.local` counts as "not set" — matches how devs pre-fill
// placeholder slots. Real min-length validation happens at usage site via
// `requireServerEnv`.
const optionalNonEmpty = z.preprocess(
  (v) => (typeof v === "string" && v.trim().length === 0 ? undefined : v),
  z.string().min(1).optional(),
);

// Server env: eagerly validated for public-mirrored vars; feature keys are
// optional at boot and asserted at first use so dev can start without them.
const serverSchema = publicSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: optionalNonEmpty,
  GEMINI_API_KEY: optionalNonEmpty,
});

type ServerEnv = z.infer<typeof serverSchema>;
type PublicEnv = z.infer<typeof publicSchema>;

function parseServerEnv(): ServerEnv {
  const parsed = serverSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  · ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid server environment variables:\n${issues}`);
  }

  return parsed.data;
}

function parsePublicEnv(): PublicEnv {
  const parsed = publicSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  · ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid public environment variables:\n${issues}`);
  }

  return parsed.data;
}

export const serverEnv: ServerEnv =
  typeof window === "undefined" ? parseServerEnv() : (undefined as unknown as ServerEnv);

export const publicEnv: PublicEnv = parsePublicEnv();

/**
 * Asserts a feature-scoped env var is present at usage site. Use in code that
 * requires the key (e.g. Gemini client, service-role client).
 */
export function requireServerEnv<K extends keyof ServerEnv>(key: K): NonNullable<ServerEnv[K]> {
  const value = serverEnv[key];
  if (value === undefined || value === null || value === "") {
    throw new Error(
      `Missing required server env var: ${String(key)}. Add it to .env.local before using this feature.`,
    );
  }
  return value as NonNullable<ServerEnv[K]>;
}
