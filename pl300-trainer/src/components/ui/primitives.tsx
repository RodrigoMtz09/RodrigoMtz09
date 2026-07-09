import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// shadcn/ui-style primitives (cva + tailwind-merge), hand-rolled to keep the
// dependency surface to the approved stack.

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-amber-500 text-neutral-950 hover:bg-amber-400",
        outline:
          "border border-neutral-700 bg-transparent hover:bg-neutral-800 text-neutral-100",
        ghost: "hover:bg-neutral-800 text-neutral-100",
        subtle: "bg-neutral-800 text-neutral-100 hover:bg-neutral-700",
        danger: "bg-red-600 text-white hover:bg-red-500",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-neutral-800 bg-neutral-900/60 shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pb-2", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-lg font-semibold text-neutral-50", className)} {...props} />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pt-2", className)} {...props} />;
}

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      tone: {
        neutral: "bg-neutral-800 text-neutral-200",
        amber: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30",
        green: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
        red: "bg-red-500/15 text-red-300 ring-1 ring-red-500/30",
        blue: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export function Progress({
  value,
  className,
  tone = "amber",
}: {
  value: number; // 0..100
  className?: string;
  tone?: "amber" | "green" | "red" | "blue";
}) {
  const toneClass = {
    amber: "bg-amber-500",
    green: "bg-emerald-500",
    red: "bg-red-500",
    blue: "bg-sky-500",
  }[tone];
  return (
    <div
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-neutral-800",
        className,
      )}
    >
      <div
        className={cn("h-full rounded-full transition-all", toneClass)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
