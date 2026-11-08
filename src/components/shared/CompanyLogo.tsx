import { cn, hashHue } from "@/lib/utils";

const sizes = { xs: "size-5 text-[9px] rounded-[5px]", sm: "size-6 text-[10px] rounded-[6px]", md: "size-8 text-xs rounded-[8px]", lg: "size-11 text-sm rounded-[10px]", xl: "size-16 text-xl rounded-[14px]" };

/** Monogram logo tile; brand colour when known, a stable hue otherwise. */
export function CompanyLogo({ name, color, size = "sm", className }: { name: string; color?: string; size?: keyof typeof sizes; className?: string }) {
  const letters = name
    .replace(/[^A-Za-z0-9 &]/g, "")
    .split(/\s+/)
    .filter((w) => w && w !== "&")
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  const bg = color ?? `hsl(${hashHue(name)} 45% 46%)`;
  return (
    <span
      aria-hidden
      className={cn("inline-grid shrink-0 select-none place-items-center font-semibold tracking-tight text-white shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)]", sizes[size], className)}
      style={{ background: bg }}
    >
      {letters}
    </span>
  );
}
