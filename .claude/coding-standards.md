# Coding Standards

## TypeScript

- `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`.
- No `any`. Use `unknown` and narrow. If a library forces `any`, isolate it in a wrapper module.
- Prefer `type` for object shapes and unions; use `interface` only when extending third-party
  interfaces or writing declaration files.
- `import type` for type-only imports (enforced by ESLint).
- Explicit return types on exported functions.

## Naming

- **Files:** `kebab-case.ts`. React components: `kebab-case.tsx`, but the exported component
  is `PascalCase`.
- **Components:** `PascalCase`.
- **Hooks:** `useCamelCase`.
- **Server Actions:** verb-noun, e.g. `createNote`, `deleteBookmark`.
- **Zod schemas:** `xxxSchema` (e.g. `createNoteSchema`).
- **Types derived from schemas:** `z.infer<typeof xxxSchema>` — never restate.

## Functions

- One responsibility. If a function does two things, split it.
- Prefer early returns over nested conditionals.
- No side effects in pure helpers.
- Named parameters (`{ userId, cursor }`) for anything with more than 2 args.

## Server Actions

Every Server Action follows this shape:

```ts
"use server";

import { z } from "zod";
import { createNoteSchema } from "../schemas/note";
import { getSupabaseServer } from "@/lib/supabase/server";
import { ok, err, type Result, type ActionError } from "@/lib/result";

type Input = z.infer<typeof createNoteSchema>;

export async function createNote(input: Input): Promise<Result<{ id: string }, ActionError>> {
  const parsed = createNoteSchema.safeParse(input);
  if (!parsed.success) return err({ code: "VALIDATION", message: "Invalid input" });

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from("notes")
    .insert({ ... })
    .select("id")
    .single();

  if (error) return err({ code: "DB", message: error.message });
  return ok({ id: data.id });
}
```

- Always `safeParse`, never `parse` (never throw on validation).
- Never return raw Postgres error messages to end users — map to friendly messages in the UI.
- Revalidate cache tags after mutations (`revalidateTag("notes")`).

## Components

- Server by default. Add `"use client"` only when needed.
- Props: destructure in the signature. No prop-drilling more than 2 levels — lift or use context.
- One component per file. Sub-components live in the same folder as siblings unless reused
  elsewhere.
- Use `<Slot>` from Radix when a component needs polymorphism (e.g. `Button asChild`).

## Styling

- Tailwind classes only. No `styled-components`, no CSS-in-JS.
- Compose classes with `cn()` from `@/lib/utils`.
- Variants via `class-variance-authority` (see `Button` for the pattern).
- Never inline `style` — if a value is dynamic, use a CSS variable + Tailwind arbitrary values.

## Comments

Only for:
- Business rules that aren't obvious from the code.
- Workarounds for library bugs (link the issue).
- Non-obvious performance or security decisions.

Don't restate the code.

## Testing philosophy (to be introduced with the auth module)

- Vitest + Testing Library for unit + component.
- Playwright for critical user flows only (auth, checkout, AI generation).
- Integration tests hit a real ephemeral Supabase — no mocks of the DB.
