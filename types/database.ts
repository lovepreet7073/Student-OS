/**
 * Placeholder Database type. Overwritten by `pnpm db:types` once Supabase
 * migrations are applied. Keeps typed clients compiling before the first
 * schema is generated.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
