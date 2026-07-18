import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

/**
 * Mobile-first textarea. `text-base` on mobile prevents iOS auto-zoom on focus.
 * Vertical resize allowed by default — auth flows / long-form content decides.
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, invalid, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          "flex min-h-[120px] w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-sm transition-colors",
          "sm:text-sm",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:cursor-not-allowed disabled:opacity-50",
          invalid ? "border-danger focus-visible:ring-danger" : "border-input",
          className,
        )}
        {...props}
      />
    );
  },
);

export { Textarea };
