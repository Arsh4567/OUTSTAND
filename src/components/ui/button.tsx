import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // BASE PHYSICS: Added scale on active (shrink), smooth transitions, and premium border radii
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold cursor-pointer transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.96] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // DEFAULT: The primary Outstand glowing action button
        default: 
          "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] hover:from-blue-500 hover:to-indigo-500 border border-blue-500/30 hover:-translate-y-0.5",
        
        // DESTRUCTIVE: Glowing red for dangerous actions
        destructive: 
          "bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-[0_0_20px_rgba(225,29,72,0.3)] hover:shadow-[0_0_30px_rgba(225,29,72,0.5)] hover:from-rose-500 hover:to-red-500 border border-rose-500/30 hover:-translate-y-0.5",
        
        // OUTLINE: Clean, subtle glass outline
        outline:
          "border border-white/10 bg-transparent shadow-sm hover:bg-white/5 hover:text-white hover:border-white/20 backdrop-blur-sm",
        
        // SECONDARY: Frosted glass effect for secondary actions
        secondary: 
          "bg-white/5 text-slate-100 shadow-inner border border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-md hover:-translate-y-0.5",
        
        // GHOST: Clean text-only button that lights up on hover
        ghost: 
          "text-slate-400 hover:text-white hover:bg-white/10",
        
        // LINK: Sleek neon text link
        link: 
          "text-blue-400 underline-offset-4 hover:underline hover:text-blue-300",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-14 rounded-2xl px-10 text-base", // Larger touch targets for mobile
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
