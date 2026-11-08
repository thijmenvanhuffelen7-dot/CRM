import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { inputClass } from "@/components/ui/input";
import { Select, type Option } from "@/components/ui/select";

const displayClass =
  "group/inline -mx-1.5 flex min-h-7 w-[calc(100%+12px)] cursor-text items-center rounded-sm px-1.5 py-1 text-left text-sm transition-colors hover:bg-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:cursor-default disabled:hover:bg-transparent";

export function InlineText({
  value,
  onSave,
  placeholder = "Empty",
  multiline,
  className,
  inputClassName,
  ariaLabel,
  disabled,
  display,
}: {
  value: string;
  onSave: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  inputClassName?: string;
  ariaLabel?: string;
  disabled?: boolean;
  display?: (v: string) => React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  useEffect(() => setDraft(value), [value]);
  useEffect(() => {
    if (editing) {
      ref.current?.focus();
      ref.current?.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() !== value) onSave(draft.trim());
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      setDraft(value);
      setEditing(false);
    }
    if (e.key === "Enter" && (!multiline || e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      commit();
    }
  };

  if (editing) {
    const common = {
      ref,
      value: draft,
      "aria-label": ariaLabel,
      onChange: (e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => setDraft(e.target.value),
      onBlur: commit,
      onKeyDown,
    };
    return multiline ? (
      <textarea {...common} rows={4} className={cn(inputClass, "-mx-1.5 h-auto w-[calc(100%+12px)] px-1.5 py-1 leading-relaxed", inputClassName)} />
    ) : (
      <input {...common} className={cn(inputClass, "-mx-1.5 h-7 w-[calc(100%+12px)] px-1.5", inputClassName)} />
    );
  }
  return (
    <button type="button" disabled={disabled} aria-label={ariaLabel ? `Edit ${ariaLabel}` : undefined} onClick={() => setEditing(true)} className={cn(displayClass, multiline && "items-start whitespace-pre-wrap", className)}>
      {value ? display ? display(value) : <span className="min-w-0 break-words">{value}</span> : <span className="text-muted-foreground/70">{placeholder}</span>}
    </button>
  );
}

export function InlineNumber({
  value,
  onSave,
  format: fmt = (n) => String(n),
  ariaLabel,
  disabled,
  className,
}: {
  value: number;
  onSave: (v: number) => void;
  format?: (n: number) => string;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => setDraft(String(value)), [value]);
  useEffect(() => {
    if (editing) ref.current?.select();
  }, [editing]);
  const commit = () => {
    setEditing(false);
    const n = Number(draft.replace(/[^\d.-]/g, ""));
    if (!Number.isNaN(n) && n !== value) onSave(n);
  };
  if (editing)
    return (
      <input
        ref={ref}
        inputMode="decimal"
        aria-label={ariaLabel}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            e.stopPropagation();
            setDraft(String(value));
            setEditing(false);
          }
        }}
        className={cn(inputClass, "-mx-1.5 h-7 w-[calc(100%+12px)] px-1.5 tabular")}
      />
    );
  return (
    <button type="button" disabled={disabled} aria-label={ariaLabel ? `Edit ${ariaLabel}` : undefined} onClick={() => setEditing(true)} className={cn(displayClass, "tabular", className)}>
      {fmt(value)}
    </button>
  );
}

export function InlineSelect({
  value,
  onSave,
  options,
  ariaLabel,
  placeholder,
  className,
}: {
  value?: string;
  onSave: (v: string) => void;
  options: Option[];
  ariaLabel?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <Select
      variant="ghost"
      value={value}
      onValueChange={onSave}
      options={options}
      ariaLabel={ariaLabel}
      placeholder={placeholder}
      triggerClassName={cn("-mx-1.5 w-[calc(100%+12px)] justify-between [&>svg]:opacity-0 hover:[&>svg]:opacity-50", className)}
    />
  );
}

export function InlineDate({
  value,
  onSave,
  withTime,
  ariaLabel,
  placeholder = "Set date",
  className,
  display,
}: {
  value: string | null;
  onSave: (iso: string | null) => void;
  withTime?: boolean;
  ariaLabel?: string;
  placeholder?: string;
  className?: string;
  display?: (iso: string) => React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (editing) {
      ref.current?.focus();
      try {
        ref.current?.showPicker?.();
      } catch {
        /* not supported */
      }
    }
  }, [editing]);
  const fmtValue = value ? format(new Date(value), withTime ? "yyyy-MM-dd'T'HH:mm" : "yyyy-MM-dd") : "";
  if (editing)
    return (
      <input
        ref={ref}
        type={withTime ? "datetime-local" : "date"}
        aria-label={ariaLabel}
        defaultValue={fmtValue}
        onBlur={(e) => {
          setEditing(false);
          const v = e.target.value;
          if (!v) return onSave(null);
          const d = withTime ? new Date(v) : new Date(`${v}T17:00`);
          if (d.toISOString() !== value) onSave(d.toISOString());
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") {
            e.stopPropagation();
            setEditing(false);
          }
        }}
        className={cn(inputClass, "-mx-1.5 h-7 w-[calc(100%+12px)] px-1.5")}
      />
    );
  return (
    <button type="button" aria-label={ariaLabel ? `Edit ${ariaLabel}` : undefined} onClick={() => setEditing(true)} className={cn(displayClass, "gap-1.5", className)}>
      {value ? (
        display ? display(value) : <span>{format(new Date(value), withTime ? "EEE d MMM, HH:mm" : "EEE d MMM yyyy")}</span>
      ) : (
        <span className="flex items-center gap-1.5 text-muted-foreground/70">
          <CalendarIcon className="size-3.5" />
          {placeholder}
        </span>
      )}
    </button>
  );
}

/** Label / value row used in detail panels. */
export function PropRow({ label, children, icon }: { label: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-center gap-2 py-0.5 sm:grid-cols-[140px_1fr]">
      <div className="flex items-center gap-2 text-sm text-muted-foreground [&_svg]:size-3.5">
        {icon}
        {label}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
