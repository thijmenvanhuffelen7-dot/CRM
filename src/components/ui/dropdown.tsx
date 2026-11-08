import * as React from "react";
import * as DM from "@radix-ui/react-dropdown-menu";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const DropdownMenu = DM.Root;
export const DropdownMenuTrigger = DM.Trigger;

export function DropdownMenuContent({ className, align = "start", ...props }: React.ComponentPropsWithoutRef<typeof DM.Content>) {
  return (
    <DM.Portal>
      <DM.Content
        align={align}
        sideOffset={4}
        className={cn(
          "z-[70] min-w-[180px] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-pop",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[side=bottom]:slide-in-from-top-1",
          className,
        )}
        {...props}
      />
    </DM.Portal>
  );
}

export const itemClass =
  "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors data-[highlighted]:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:text-muted-foreground";

export function DropdownMenuItem({ className, destructive, ...props }: React.ComponentPropsWithoutRef<typeof DM.Item> & { destructive?: boolean }) {
  return <DM.Item className={cn(itemClass, destructive && "text-danger [&_svg]:text-danger", className)} {...props} />;
}

export function DropdownMenuCheckItem({ checked, children, className, ...props }: React.ComponentPropsWithoutRef<typeof DM.Item> & { checked?: boolean }) {
  return (
    <DM.Item className={cn(itemClass, "pr-7", className)} {...props}>
      {children}
      {checked && <Check className="absolute right-2 !text-foreground" />}
    </DM.Item>
  );
}

export function DropdownMenuLabel({ className, ...props }: React.ComponentPropsWithoutRef<typeof DM.Label>) {
  return <DM.Label className={cn("px-2 py-1.5 text-xs font-medium text-muted-foreground", className)} {...props} />;
}
export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <DM.Separator className={cn("-mx-1 my-1 h-px bg-border", className)} />;
}
