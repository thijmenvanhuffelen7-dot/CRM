import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInCalendarDays, format, formatDistanceToNowStrict, isToday, isTomorrow, isYesterday } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

let currency = "EUR";
export const setCurrency = (c: string) => (currency = c);

export function money(n: number, opts: { compact?: boolean } = {}) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency,
    maximumFractionDigits: opts.compact && Math.abs(n) >= 1000 ? 1 : 0,
    notation: opts.compact && Math.abs(n) >= 10000 ? "compact" : "standard",
  }).format(n);
}

export function num(n: number, compact = false) {
  return new Intl.NumberFormat("en-IE", { notation: compact ? "compact" : "standard", maximumFractionDigits: 1 }).format(n);
}

export const pct = (n: number, digits = 1) => `${n.toFixed(digits)}%`;

export function relativeDay(iso: string | null | undefined) {
  if (!iso) return "No date";
  const d = new Date(iso);
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  if (isYesterday(d)) return "Yesterday";
  const diff = differenceInCalendarDays(d, new Date());
  if (diff > 0 && diff < 7) return format(d, "EEEE");
  return format(d, diff > 300 || diff < -300 ? "d MMM yyyy" : "d MMM");
}

export function timeAgo(iso: string) {
  const d = new Date(iso);
  const secs = (Date.now() - d.getTime()) / 1000;
  if (secs < 60) return "just now";
  return formatDistanceToNowStrict(d, { addSuffix: true });
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter((p) => p && p[0] === p[0].toUpperCase())
    .slice(0, 2)
    .map((p) => p[0])
    .join("");
}

export function hashHue(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

export function fileSize(bytes: number) {
  if (!bytes) return "—";
  const u = ["B", "KB", "MB", "GB"];
  let i = 0;
  let b = bytes;
  while (b >= 1024 && i < u.length - 1) {
    b /= 1024;
    i++;
  }
  return `${b.toFixed(b < 10 && i > 0 ? 1 : 0)} ${u[i]}`;
}

export const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
export const modKey = isMac ? "⌘" : "Ctrl";

/** True when the keyboard event originates in a text-entry element. */
export function isTypingTarget(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null;
  if (!t) return false;
  return t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) || !!t.closest("[cmdk-root]");
}
