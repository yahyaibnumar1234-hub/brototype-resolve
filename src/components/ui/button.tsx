import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg rounded-2xl backdrop-blur-sm",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md hover:shadow-lg rounded-2xl",
        outline: "border border-border bg-background/50 backdrop-blur-md hover:bg-accent/50 hover:text-accent-foreground hover:border-accent rounded-2xl hover:shadow-md",
        secondary: "bg-secondary/80 text-secondary-foreground hover:bg-secondary backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-md metallic",
        ghost: "hover:bg-accent/10 hover:text-accent-foreground rounded-2xl backdrop-blur-sm",
        link: "text-primary underline-offset-4 hover:underline",
        glass: "bg-white/10 dark:bg-black/20 backdrop-blur-glass text-foreground border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-black/30 rounded-2xl shadow-glass",
        neon: "bg-primary text-primary-foreground rounded-2xl border border-accent shadow-neon hover:shadow-[0_0_30px_rgba(56,189,248,0.5)] neon-border",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 rounded-xl px-4",
        lg: "h-13 rounded-2xl px-10 text-base",
        icon: "h-11 w-11 rounded-2xl",
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
