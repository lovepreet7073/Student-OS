import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type = "text", invalid, leadingIcon, trailingIcon, ...props },
  ref,
) {
  // h-11 on mobile (44px touch target), h-10 on sm+ for denser desktop forms.
  // Base font-size stays 16px (`text-base`) to prevent iOS auto-zoom on focus.
  const base = cn(
    "flex h-11 w-full rounded-md border bg-transparent px-3 text-base shadow-sm transition-colors",
    "sm:h-10 sm:text-sm",
    "placeholder:text-muted-foreground",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
    invalid ? "border-danger focus-visible:ring-danger" : "border-input",
  );

  if (!leadingIcon && !trailingIcon) {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(base, className)}
        aria-invalid={invalid || undefined}
        {...props}
      />
    );
  }

  return (
    <div className="relative">
      {leadingIcon ? (
        <span
          className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 items-center text-muted-foreground [&_svg]:size-4"
          aria-hidden
        >
          {leadingIcon}
        </span>
      ) : null}
      <input
        ref={ref}
        type={type}
        className={cn(base, leadingIcon && "pl-9", trailingIcon && "pr-9", className)}
        aria-invalid={invalid || undefined}
        {...props}
      />
      {trailingIcon ? (
        // Trailing slot can hold interactive controls (e.g. password show/hide toggle).
        // Do not mark aria-hidden — child buttons keep their accessible names.
        <span className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center text-muted-foreground [&_svg]:size-4">
          {trailingIcon}
        </span>
      ) : null}
    </div>
  );
});

export { Input };
