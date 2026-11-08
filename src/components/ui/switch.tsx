import * as React from "react";
import * as Sw from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

export const Switch = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<typeof Sw.Root>>(({ className, ...props }, ref) => (
  <Sw.Root
    ref={ref}
    className={cn(
      "inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-input transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 data-[state=checked]:bg-primary",
      className,
    )}
    {...props}
  >
    <Sw.Thumb className="pointer-events-none block size-4 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0" />
  </Sw.Root>
));
Switch.displayName = "Switch";
