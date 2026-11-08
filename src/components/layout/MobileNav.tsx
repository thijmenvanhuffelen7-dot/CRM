import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { MoreHorizontal } from "lucide-react";
import * as D from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { nav } from "./nav";

const primary = nav.slice(0, 4);
const rest = nav.slice(4);

export function MobileNav() {
  const [more, setMore] = useState(false);
  const { pathname } = useLocation();
  const moreActive = rest.some((r) => pathname.startsWith(r.to));
  return (
    <>
      <nav aria-label="Main navigation" className="no-print fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 backdrop-blur-md pb-safe md:hidden">
        <div className="grid grid-cols-5">
          {primary.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => cn("flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-muted-foreground transition-colors", isActive && "text-primary")}
            >
              <item.icon className="size-5" />
              {item.label}
            </NavLink>
          ))}
          <button onClick={() => setMore(true)} className={cn("flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-muted-foreground", moreActive && "text-primary")}>
            <MoreHorizontal className="size-5" />
            More
          </button>
        </div>
      </nav>
      <D.Root open={more} onOpenChange={setMore}>
        <D.Portal>
          <D.Overlay className="fixed inset-0 z-50 bg-black/30 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
          <D.Content aria-describedby={undefined} className="fixed inset-x-0 bottom-0 z-50 rounded-t-xl border-t bg-background p-3 pb-safe shadow-pop data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom">
            <D.Title className="sr-only">More</D.Title>
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted" />
            <div className="grid gap-1 pb-3">
              {rest.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMore(false)}
                  className={({ isActive }) => cn("flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium", isActive ? "bg-accent" : "hover:bg-accent")}
                >
                  <item.icon className="size-4 text-muted-foreground" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </D.Content>
        </D.Portal>
      </D.Root>
    </>
  );
}
