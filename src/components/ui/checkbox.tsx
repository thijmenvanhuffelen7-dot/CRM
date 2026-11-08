import * as React from "react";
import * as C from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const Checkbox = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<typeof C.Root> & { round?: boolean }>(
  ({ className, round, ...props }, ref) => (
    <C.Root
      ref={ref}
      className={cn(
        "peer grid size-4 shrink-0 place-items-center border border-input bg-background transition-all hover:border-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
        round ? "rounded-full" : "rounded-[4px]",
        className,
      )}
      {...props}
    >
      <C.Indicator className="data-[state=checked]:animate-in data-[state=checked]:zoom-in-50">
        <Check className="size-3" strokeWidth={3} />
      </C.Indicator>
    </C.Root>
  ),
);
Checkbox.displayName = "Checkbox";
