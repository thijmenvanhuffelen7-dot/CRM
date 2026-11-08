import * as React from "react";
import * as T from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export const Tabs = T.Root;
export function TabsList({ className, ...props }: React.ComponentPropsWithoutRef<typeof T.List>) {
  return <T.List className={cn("no-scrollbar flex items-center gap-1 overflow-x-auto border-b", className)} {...props} />;
}
export function TabsTrigger({ className, ...props }: React.ComponentPropsWithoutRef<typeof T.Trigger>) {
  return (
    <T.Trigger
      className={cn(
        "relative -mb-px flex shrink-0 items-center gap-1.5 border-b-2 border-transparent px-2.5 pb-2.5 pt-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:text-foreground data-[state=active]:border-foreground data-[state=active]:text-foreground [&_svg]:size-4",
        className,
      )}
      {...props}
    />
  );
}
export function TabsContent({ className, ...props }: React.ComponentPropsWithoutRef<typeof T.Content>) {
  return <T.Content className={cn("animate-fade-in pt-5 outline-none", className)} {...props} />;
}

/** Compact pill-style segmented control. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = "default",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode; icon?: React.ReactNode; title?: string }[];
  className?: string;
  size?: "sm" | "default";
}) {
  return (
    <div role="radiogroup" className={cn("inline-flex items-center rounded-sm border bg-muted/60 p-0.5", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          title={o.title}
          onClick={() => onChange(o.value)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-[6px] px-2.5 font-medium text-muted-foreground transition-all hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 [&_svg]:size-3.5",
            size === "sm" ? "h-6 text-xs" : "h-7 text-sm",
            value === o.value && "bg-card text-foreground shadow-soft",
          )}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}
