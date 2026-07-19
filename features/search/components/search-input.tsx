"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

interface Props {
  initialValue?: string;
  placeholder: string;
}

/**
 * URL-driven search input. Types → 300ms debounce → replaces `?q=` so the page
 * re-renders with fresh server-side results. No JS-owned state beyond the
 * uncontrolled draft.
 */
export function SearchInput({ initialValue = "", placeholder }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    const current = params.get("q") ?? "";
    if (current === value) return;
    const id = setTimeout(() => {
      const next = new URLSearchParams(params);
      if (value.trim().length === 0) {
        next.delete("q");
      } else {
        next.set("q", value);
      }
      router.replace(`/app/search?${next.toString()}`);
    }, 300);
    return () => clearTimeout(id);
  }, [value]);

  return (
    <Input
      type="search"
      inputMode="search"
      autoFocus
      value={value}
      placeholder={placeholder}
      leadingIcon={<Search />}
      onChange={(e) => setValue(e.target.value)}
      aria-label={placeholder}
    />
  );
}
