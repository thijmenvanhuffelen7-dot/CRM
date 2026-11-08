import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { inputClass } from "@/components/ui/input";

export type SortDir = "asc" | "desc";

export function useSort<T, K extends string>(rows: T[], accessors: Record<K, (r: T) => string | number>, initial: NoInfer<K>, dir: SortDir = "asc") {
  const [sort, setSort] = useState<{ key: K; dir: SortDir }>({ key: initial, dir });
  const sorted = useMemo(() => {
    const get = accessors[sort.key];
    return [...rows].sort((a, b) => {
      const x = get(a);
      const y = get(b);
      const r = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
      return sort.dir === "asc" ? r : -r;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sort]);
  const toggle = (key: K) => setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  return { sorted, sort, toggle };
}

export function SortHeader<K extends string>({ label, k, sort, onSort, className, align = "left" }: { label: string; k: K; sort: { key: K; dir: SortDir }; onSort: (k: K) => void; className?: string; align?: "left" | "right" }) {
  const active = sort.key === k;
  const Icon = !active ? ChevronsUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th scope="col" aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"} className={cn("h-9 whitespace-nowrap px-3 text-xs font-medium text-muted-foreground", align === "right" && "text-right", className)}>
      <button onClick={() => onSort(k)} className={cn("inline-flex items-center gap-1 rounded-sm transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60", active && "text-foreground", align === "right" && "flex-row-reverse")}>
        {label}
        <Icon className={cn("size-3", !active && "opacity-40")} />
      </button>
    </th>
  );
}

export function TableShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-lg border bg-card shadow-soft", className)}>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[720px] border-collapse text-sm">{children}</table>
      </div>
    </div>
  );
}

export const trClass = "border-t border-border/70 transition-colors hover:bg-accent/50";
export const tdClass = "px-3 py-2.5 align-middle";

export function SearchInput({ value, onChange, placeholder = "Search…", className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} className={cn(inputClass, "w-full pl-8 pr-7 sm:w-56")} />
      {value && (
        <button onClick={() => onChange("")} aria-label="Clear search" className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground">
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
