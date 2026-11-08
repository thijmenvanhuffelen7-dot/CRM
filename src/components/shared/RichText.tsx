import { useEffect, useRef } from "react";
import { Bold, Heading3, Italic, Link2, List, ListOrdered, Underline } from "lucide-react";
import { cn, modKey } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";

const tools = [
  { cmd: "bold", icon: Bold, label: "Bold", keys: [modKey, "B"] },
  { cmd: "italic", icon: Italic, label: "Italic", keys: [modKey, "I"] },
  { cmd: "underline", icon: Underline, label: "Underline", keys: [modKey, "U"] },
  { cmd: "h3", icon: Heading3, label: "Heading" },
  { cmd: "insertUnorderedList", icon: List, label: "Bulleted list" },
  { cmd: "insertOrderedList", icon: ListOrdered, label: "Numbered list" },
  { cmd: "link", icon: Link2, label: "Link" },
] as const;

/** Lightweight rich-text editor (contentEditable) – saves HTML on blur. */
export function RichText({ value, onChange, placeholder = "Start writing…", className, readOnly }: { value: string; onChange: (html: string) => void; placeholder?: string; className?: string; readOnly?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && document.activeElement !== ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value;
  }, [value]);

  const exec = (cmd: string) => {
    ref.current?.focus();
    if (cmd === "h3") document.execCommand("formatBlock", false, document.queryCommandValue("formatBlock") === "h3" ? "p" : "h3");
    else if (cmd === "link") {
      const url = window.prompt("Link URL", "https://");
      if (url) document.execCommand("createLink", false, url);
    } else document.execCommand(cmd);
  };

  const save = () => {
    if (!ref.current) return;
    const html = ref.current.innerHTML === "<br>" ? "" : ref.current.innerHTML;
    if (html !== value) onChange(html);
  };

  return (
    <div className={cn("rounded-md border bg-card shadow-soft transition focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20", className)}>
      {!readOnly && (
        <div className="flex items-center gap-0.5 border-b px-1.5 py-1" role="toolbar" aria-label="Formatting">
          {tools.map((t) => (
            <Tooltip key={t.cmd} content={t.label} shortcut={"keys" in t ? [...t.keys] : undefined}>
              <button
                type="button"
                aria-label={t.label}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => exec(t.cmd)}
                className="rounded-[5px] p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                <t.icon className="size-3.5" />
              </button>
            </Tooltip>
          ))}
        </div>
      )}
      <div
        ref={ref}
        role="textbox"
        aria-multiline
        aria-label="Email copy"
        contentEditable={!readOnly}
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onBlur={save}
        className="prose-editor min-h-[160px] px-3 py-2.5 text-sm"
      />
    </div>
  );
}
