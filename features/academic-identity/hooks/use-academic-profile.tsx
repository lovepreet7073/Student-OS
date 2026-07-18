"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { AcademicProfile } from "../types";

const AcademicProfileContext = createContext<AcademicProfile | null>(null);

interface AcademicProfileProviderProps {
  profile: AcademicProfile;
  children: ReactNode;
}

/**
 * Wraps client subtrees that need access to the current user's academic
 * profile. The profile is fetched server-side in `/app/layout.tsx` and
 * threaded down as a prop, so this hook always returns a hydrated value
 * inside the `/app/*` shell.
 */
export function AcademicProfileProvider({
  profile,
  children,
}: AcademicProfileProviderProps) {
  return (
    <AcademicProfileContext.Provider value={profile}>
      {children}
    </AcademicProfileContext.Provider>
  );
}

/** Throws if used outside `AcademicProfileProvider`. Use inside `/app/*` only. */
export function useAcademicProfile(): AcademicProfile {
  const value = useContext(AcademicProfileContext);
  if (!value) {
    throw new Error(
      "useAcademicProfile must be used inside AcademicProfileProvider — did you forget to wrap /app in AcademicProfileProvider?",
    );
  }
  return value;
}

/** Safe variant that returns null when no profile is available. */
export function useAcademicProfileOptional(): AcademicProfile | null {
  return useContext(AcademicProfileContext);
}
