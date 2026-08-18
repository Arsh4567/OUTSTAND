import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // PERFORMANCE: animate only transform/opacity. Box-shadow, border and layout
  // are intentionally not transitioned because they trigger extra paint work.
  // The cubic-bezier approximates a damped spring while staying compositor-friendly.
  "group relative inline-flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-xl text-sm font-bold tracking-wide transition-[transform,opacity] duration-[240ms] ease-[cubic-bezier(.22,1,.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:transition-transform [&_svg]:duration-200 [&_svg]:ease-[cubic-bezier(.22,1,.36,1)] hover:[&_svg]:scale-105",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 text-white shadow-[0_12px_30px_rgba(0,0,0,.22),0_0_20px_rgba(99,102,241,.28),inset_0_1px_1px_rgba(255,255,255,.18)] border border-white/10 hover:border-white/20 hover:-translate-y-0.5",
        destructive:
          "bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-[0_12px_30px_rgba(0,0,0,.24),0_0_20px_rgba(244,63,94,.22),inset_0_1px_1px_rgba(255,255,255,.16)] border border-rose-400/30 hover:border-rose-400/50 hover:-translate-y-0.5",
        outline:
          "bg-zinc-950/40 text-slate-200 border border-white/10 shadow-[0_10px_28px_rgba(0,0,0,.18),inset_0_1px_1px_rgba(255,255,255,.10)] backdrop-blur-md hover:bg-white/5 hover:text-white hover:border-indigo-400/50 hover:-translate-y-0.5",
        secondary:
          "bg-white/5 text-white border border-white/10 shadow-[0_10px_28px_rgba(0,0,0,.16),inset_0_1px_1px_rgba(255,255,255,.10)] backdrop-blur-xl hover:bg-white/10 hover:border-white/20 hover:-translate-y-0.5",
        ghost:
          "text-slate-400 hover:text-white hover:bg-white/10",
        link:
          "text-indigo-400 underline-offset-4 hover:underline hover:text-indigo-300",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-14 rounded-2xl px-10 text-base",
        icon: "h-11 w-11",
        "icon-sm": "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
