"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

import { cn } from "@/lib/utils";

interface NotesSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

/**
 * Debounced search input. `value` prop is the committed value; `onChange`
 * fires after the debounce window.
 */
export function NotesSearchInput({
  value,
  onChange,
  placeholder = "Search notes",
  debounceMs = 300,
}: NotesSearchInputProps) {
  const [internal, setInternal] = useState(value);
  const timer = useRef<NodeJS.Timeout | null>(null);

  // Sync when the committed value changes externally (URL param, reset, etc.).
  useEffect(() => {
    setInternal(value);
  }, [value]);

  const handleChange = (next: string) => {
    setInternal(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(next), debounceMs);
  };

  const handleClear = () => {
    if (timer.current) clearTimeout(timer.current);
    setInternal("");
    onChange("");
  };

  return (
    <div
      className={cn(
        "flex h-[46px] items-center gap-2.5 rounded-md border border-border bg-card px-3.5",
        "focus-within:border-primary focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
      )}
    >
      <Search
        className="h-[19px] w-[19px] flex-shrink-0 text-muted-foreground"
        strokeWidth={2}
        aria-hidden
      />
      <input
        type="search"
        value={internal}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        inputMode="search"
        enterKeyHint="search"
        aria-label={placeholder}
        className="flex-1 border-none bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground sm:text-sm"
      />
      {internal.length > 0 ? (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
