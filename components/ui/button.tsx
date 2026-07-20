import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Button sizes are **mobile-first**. Default `md` is 44px tall on mobile
 * (touch-target minimum) and stays 40px on desktop for a slightly denser feel.
 * Use `sm` only in dense desktop contexts (tables, toolbars) — never as the
 * primary mobile action.
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-[13px] font-medium",
    "transition-colors duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0",
    "touch-manipulation select-none",
  ],
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline:
          "border border-border bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        danger: "bg-danger text-danger-foreground shadow-sm hover:bg-danger/90",
        link: "text-primary underline-offset-4 hover:underline",
      },
      // Density note: mobile stays at 44px on md+ (constitutional touch-target
      // rule). Desktop is denser — sm:h-9 (36px) feels dashboard-native.
      // `sm` variant is dense on both, meant for toolbars/dialogs only.
      size: {
        sm:   "h-8 px-2.5 text-[11.5px]",
        md:   "h-11 px-3 sm:h-9",
        lg:   "h-11 px-5 text-[14px] sm:h-10",
        icon: "h-11 w-11 sm:h-9 sm:w-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant,
    size,
    asChild = false,
    loading = false,
    fullWidth = false,
    disabled,
    children,
    ...props
  },
  ref,
) {
  const isDisabled = disabled || loading;
  const classes = cn(buttonVariants({ variant, size }), fullWidth && "w-full", className);

  // Radix `Slot` requires exactly one child. When `asChild` is true we
  // forward `children` unchanged — loading spinners only render for the
  // native <button> path. (`Link`s wrapping icons + text still work because
  // Link itself is the single child.)
  if (asChild) {
    return (
      <Slot
        ref={ref}
        className={classes}
        aria-busy={loading || undefined}
        data-disabled={isDisabled || undefined}
        {...props}
      >
        {children}
      </Slot>
    );
  }

  return (
    <button
      ref={ref}
      className={classes}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
});

export { Button, buttonVariants };
