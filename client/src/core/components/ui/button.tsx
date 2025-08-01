import * as React from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 ring-ring/10 dark:ring-ring/20 dark:outline-ring/40 outline-ring/50 focus-visible:ring-4 focus-visible:outline-1 aria-invalid:focus-visible:ring-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary border-[1.5px] cursor-pointer border-[rgba(0,77,64,0.4)] bg-gradient-to-b from-[#00796b] to-[#00695c]   text-primary-foreground shadow-[0_2px_4px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.2)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] hover:bg-gradient-to-b hover:from-[#00897b] hover:to-[#00796b] active:bg-gradient-to-b active:from-[#00695c] active:to-[#004d40] overflow-hidden grain-effect before:animate-grainbt",
        destructive:
          "bg-destructive text-destructive-foreground border-[1.5px] cursor-pointer border-[rgba(136,14,79,0.4)] bg-gradient-to-b from-[#c2185b] to-[#ad1457] text-white font-semibold shadow-[0_2px_4px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.2)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] hover:bg-gradient-to-b hover:from-[#d81b60] hover:to-[#c2185b] active:bg-gradient-to-b active:from-[#ad1457] active:to-[#880e4f] overflow-hidden grain-effect ",
        outline: "border border-input bg-transparent hover:bg-neutral-200/40 border-secondary-900/10",
        secondary: "bg-[#f4f4f4] text-[#333333] shadow-xs hover:bg-[#d0d0d0]/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);




function Button({
  className,
  variant,
  size,
  disabled,
  children,
  loading = false,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';


  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} disabled={loading || disabled} {...props} >
    {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
    <Slottable>{children}</Slottable>
  </Comp>
    ;
}

export { Button, buttonVariants };
