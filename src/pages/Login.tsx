import { useState } from "react";
import { ArrowRight, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { useAuth, roleLabels } from "@/store/auth";
import { useData } from "@/store/data";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { MemberAvatar } from "@/components/shared/Avatar";
import { hasSupabase, supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export default function Login() {
  const team = useData((s) => s.team);
  const agency = useData((s) => s.agency);
  const signIn = useAuth((s) => s.signIn);
  const [email, setEmail] = useState(team[0]?.email ?? "");
  const [password, setPassword] = useState("demo1234");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (hasSupabase && supabase) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        await new Promise((r) => setTimeout(r, 450));
      }
      const member = team.find((m) => m.email.toLowerCase() === email.trim().toLowerCase());
      if (!member) throw new Error("No team member with that email in this workspace.");
      signIn(member.id);
      toast.success(`Welcome back, ${member.name.split(" ")[0]}`);
    } catch (err) {
      toast.error("Couldn't sign in", { description: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-subtle px-4 py-10">
      <div className="w-full max-w-[380px] animate-fade-in">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 grid size-10 place-items-center rounded-[10px] bg-primary text-base font-bold text-primary-foreground shadow-pop">{agency.name[0]}</span>
          <h1 className="text-xl font-semibold">Sign in to {agency.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your agency workspace for clients, campaigns and pipeline.</p>
        </div>
        <form onSubmit={submit} className="space-y-3 rounded-lg border bg-card p-5 shadow-soft">
          <Field label="Work email" htmlFor="email">
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Password" htmlFor="password">
            <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <Button type="submit" className="mt-2 w-full" size="lg" disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <Mail />} Continue with email
          </Button>
        </form>

        {!hasSupabase && (
          <div className="mt-6">
            <p className="mb-2 text-center text-xs font-medium text-muted-foreground">Demo workspace — sign in as</p>
            <div className="grid gap-1.5">
              {team.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setEmail(m.email)}
                  className={cn(
                    "flex items-center gap-3 rounded-md border bg-card px-3 py-2 text-left shadow-soft transition hover:border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                    email === m.email && "border-primary/50 ring-1 ring-primary/30",
                  )}
                >
                  <MemberAvatar member={m} size="md" tooltip={false} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{m.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{roleLabels[m.role]} · {m.email}</span>
                  </span>
                  {email === m.email && <ArrowRight className="size-4 text-primary" />}
                </button>
              ))}
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">Any password works in demo mode. Roles change what you can edit.</p>
          </div>
        )}
      </div>
    </div>
  );
}
