import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group relative inline-flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-xl text-sm font-bold tracking-wide transition-[transform,background-color,border-color,color,opacity] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:transition-transform [&_svg]:duration-200 [&_svg]:ease-out hover:[&_svg]:scale-105",
  {
    variants: {
      variant: {
        default:
          "bg-cyan-300 text-slate-950 border border-cyan-200/30 shadow-[0_8px_24px_rgba(34,211,238,.12)] hover:-translate-y-0.5 hover:bg-cyan-200",
        destructive:
          "bg-rose-500 text-white border border-rose-400/30 hover:-translate-y-0.5 hover:bg-rose-400",
        outline:
          "bg-white/[0.02] text-slate-200 border border-white/10 hover:bg-white/[0.06] hover:text-white hover:border-white/20 hover:-translate-y-0.5",
        secondary:
          "bg-white/[0.05] text-white border border-white/10 hover:bg-white/[0.09] hover:border-white/20 hover:-translate-y-0.5",
        ghost:
          "text-slate-400 hover:text-white hover:bg-white/[0.05]",
        link:
          "text-cyan-300 underline-offset-4 hover:underline hover:text-cyan-200",
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
