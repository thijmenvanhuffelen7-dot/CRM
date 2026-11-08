import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUI } from "@/store/ui";
import { isTypingTarget, modKey } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { nav } from "./nav";

const anyOverlayOpen = () => !!document.querySelector("[role=dialog][data-state=open], [role=menu][data-state=open], [role=listbox][data-state=open]");

export function GlobalShortcuts() {
  const navigate = useNavigate();
  const [help, setHelp] = useState(false);
  const gPressed = useRef<number>(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const ui = useUI.getState();
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ui.setCommandOpen(!ui.commandOpen);
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e) || anyOverlayOpen()) return;

      if (Date.now() - gPressed.current < 900) {
        const item = nav.find((n) => n.key.toLowerCase() === e.key.toLowerCase());
        gPressed.current = 0;
        if (item) {
          e.preventDefault();
          navigate(item.to);
        }
        return;
      }
      if (e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        ui.toggleTheme();
        return;
      }
      switch (e.key) {
        case "g":
          gPressed.current = Date.now();
          break;
        case "t":
          e.preventDefault();
          ui.openQuickTask();
          break;
        case "n":
          e.preventDefault();
          ui.openNewCampaign();
          break;
        case "[":
          ui.toggleSidebar();
          break;
        case "/":
          e.preventDefault();
          ui.setCommandOpen(true);
          break;
        case "?":
          setHelp(true);
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  const groups: [string, [string, string[]][]][] = [
    [
      "General",
      [
        ["Command palette", [modKey, "K"]],
        ["Search", ["/"]],
        ["New task", ["T"]],
        ["New campaign", ["N"]],
        ["Toggle sidebar", ["["]],
        ["Toggle dark mode", ["Shift", "D"]],
        ["Show shortcuts", ["?"]],
      ],
    ],
    ["Navigation", nav.map((n) => [n.label, ["G", n.key]] as [string, string[]])],
  ];

  return (
    <Dialog open={help} onOpenChange={setHelp}>
      <DialogContent title="Keyboard shortcuts" description="Move around without touching the mouse." className="max-w-xl">
        <div className="grid gap-6 sm:grid-cols-2">
          {groups.map(([g, items]) => (
            <div key={g}>
              <p className="mb-2 text-xs font-medium text-muted-foreground">{g}</p>
              <ul className="space-y-1.5">
                {items.map(([label, keys]) => (
                  <li key={label} className="flex items-center justify-between text-sm">
                    {label}
                    <span className="flex gap-0.5">
                      {keys.map((k) => (
                        <Kbd key={k}>{k}</Kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
