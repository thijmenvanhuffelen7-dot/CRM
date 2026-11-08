import { ListFilter } from "lucide-react";
import { DropdownMenu, DropdownMenuCheckItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FilterMenu({
  label,
  options,
  selected,
  onChange,
  icon,
}: {
  label: string;
  options: { value: string; label: React.ReactNode; icon?: React.ReactNode }[];
  selected: string[];
  onChange: (v: string[]) => void;
  icon?: React.ReactNode;
}) {
  const active = selected.length > 0;
  const toggle = (v: string) => onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  const first = options.find((o) => o.value === selected[0]);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="sm" className={cn("h-8", active && "border-primary/40 bg-primary/5 text-foreground")}>
          {icon ?? <ListFilter />}
          {label}
          {active && (
            <span className="ml-0.5 max-w-[120px] truncate font-normal text-muted-foreground">
              : {selected.length === 1 ? first?.label : `${selected.length} selected`}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-80 w-56 overflow-y-auto">
        <DropdownMenuLabel>Filter by {label.toLowerCase()}</DropdownMenuLabel>
        {options.map((o) => (
          <DropdownMenuCheckItem
            key={o.value}
            checked={selected.includes(o.value)}
            onSelect={(e) => {
              e.preventDefault();
              toggle(o.value);
            }}
          >
            {o.icon}
            <span className="truncate">{o.label}</span>
          </DropdownMenuCheckItem>
        ))}
        {active && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onChange([])}>Clear filter</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
