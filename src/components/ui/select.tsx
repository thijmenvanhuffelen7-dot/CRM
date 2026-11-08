import * as React from "react";
import * as S from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { inputClass } from "./input";

export interface Option {
  value: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

export function Select({
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  className,
  triggerClassName,
  ariaLabel,
  variant = "input",
}: {
  value?: string;
  onValueChange: (v: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  ariaLabel?: string;
  variant?: "input" | "ghost";
}) {
  return (
    <S.Root value={value} onValueChange={onValueChange}>
      <S.Trigger
        aria-label={ariaLabel}
        className={cn(
          variant === "input"
            ? cn(inputClass, "justify-between gap-2")
            : "inline-flex h-7 items-center gap-1.5 rounded-sm px-1.5 text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
          "[&>span]:flex [&>span]:items-center [&>span]:gap-2 [&>span]:truncate",
          triggerClassName,
        )}
      >
        <S.Value placeholder={<span className="text-muted-foreground">{placeholder}</span>} />
        <S.Icon asChild>
          <ChevronDown className="size-3.5 shrink-0 opacity-50" />
        </S.Icon>
      </S.Trigger>
      <S.Portal>
        <S.Content
          position="popper"
          sideOffset={4}
          className={cn(
            "z-[75] max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-pop data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            className,
          )}
        >
          <S.Viewport className="p-1">
            {options.map((o) => (
              <S.Item
                key={o.value}
                value={o.value}
                className="relative flex cursor-default select-none items-center gap-2 rounded-sm py-1.5 pl-2 pr-7 text-sm outline-none data-[highlighted]:bg-accent"
              >
                <S.ItemText>
                  <span className="flex items-center gap-2">
                    {o.icon}
                    {o.label}
                  </span>
                </S.ItemText>
                <S.ItemIndicator className="absolute right-2">
                  <Check className="size-3.5" />
                </S.ItemIndicator>
              </S.Item>
            ))}
          </S.Viewport>
        </S.Content>
      </S.Portal>
    </S.Root>
  );
}
