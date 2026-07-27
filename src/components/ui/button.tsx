import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // BASE PHYSICS: Added group targeting, deep press mechanics, overflow control for inner effects, and icon scaling
  "group relative inline-flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-xl text-sm font-bold tracking-wide transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.95] active:brightness-90 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:transition-transform [&_svg]:duration-300 hover:[&_svg]:scale-110",
  {
    variants: {
      variant: {
        // DEFAULT: The hero button. Features a sweeping shimmer effect, 3D levitation, and a massive dynamic shadow.
        default: 
          "bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_40px_rgba(99,102,241,0.6)] border border-white/10 hover:border-white/20 hover:-translate-y-1 hover:brightness-110 after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_2s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent",
        
        // DESTRUCTIVE: Premium danger action. Deep red gradients with a crimson ambient glow.
        destructive: 
          "bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-[0_0_20px_rgba(244,63,94,0.3)] hover:shadow-[0_0_40px_rgba(244,63,94,0.5)] border border-rose-400/30 hover:border-rose-400/50 hover:-translate-y-1 hover:brightness-110",
        
        // OUTLINE: High-end dark glass. On hover, the border lights up with an indigo hue.
        outline:
          "bg-zinc-950/40 text-slate-200 border border-white/10 shadow-lg backdrop-blur-md hover:bg-white/5 hover:text-white hover:border-indigo-400/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:-translate-y-0.5",
        
        // SECONDARY: Frosted translucent glass with inner shadow for depth.
        secondary: 
          "bg-white/5 text-white border border-white/10 shadow-inner backdrop-blur-xl hover:bg-white/10 hover:border-white/20 hover:shadow-[0_4px_20px_rgba(255,255,255,0.05)] hover:-translate-y-0.5",
        
        // GHOST: Invisible until hovered, then reveals a soft glowing background.
        ghost: 
          "text-slate-400 hover:text-white hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]",
        
        // LINK: Sleek neon text link with drop shadow upon hover.
        link: 
          "text-indigo-400 underline-offset-4 hover:underline hover:text-indigo-300 hover:drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-14 rounded-2xl px-10 text-base", // Larger touch targets with softer corners
        icon: "h-11 w-11",
        "icon-sm": "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
