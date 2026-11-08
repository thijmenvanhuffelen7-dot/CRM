import { cn } from "@/lib/utils";

export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[4px] border border-border bg-muted px-1 font-sans text-[10.5px] font-medium text-muted-foreground",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
