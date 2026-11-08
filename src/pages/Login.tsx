import { useState } from "react";
import { AlertCircle, Loader2, LogOut, Mail, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/store/auth";
import { useData } from "@/store/data";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { retrySync, useRemote } from "@/lib/sync";

function Shell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  const agency = useData((s) => s.agency);
  const name = agency.name || "your workspace";
  return (
    <div className="grid min-h-dvh place-items-center bg-subtle px-4 py-10">
      <div className="w-full max-w-[380px] animate-fade-in">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 grid size-10 place-items-center rounded-[10px] bg-primary text-base font-bold text-primary-foreground shadow-pop">{(agency.name || "C")[0]}</span>
          <h1 className="text-xl font-semibold">{title.replace("{name}", name)}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Shown when the Supabase environment variables are missing from the build. */
export function SetupRequired() {
  return (
    <Shell title="Connect Supabase" subtitle="This app stores its data in Supabase. Add the project URL and anon key to the environment, then rebuild.">
      <pre className="overflow-x-auto rounded-md border bg-card p-4 text-xs leading-relaxed shadow-soft">
        VITE_SUPABASE_URL=https://xxxx.supabase.co{"\n"}VITE_SUPABASE_ANON_KEY=eyJ…
      </pre>
      <p className="mt-3 text-center text-xs text-muted-foreground">Find both in Supabase → Project Settings → API.</p>
    </Shell>
  );
}

export default function Login() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name }, emailRedirectTo: window.location.origin } });
        if (error) throw error;
        if (!data.session) setSent(true);
      }
    } catch (err) {
      toast.error(mode === "signin" ? "Couldn't sign in" : "Couldn't create account", { description: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    if (!supabase || !email) return toast.message("Enter your email first");
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    if (error) toast.error(error.message);
    else toast.success("Password reset email sent");
  };

  if (sent)
    return (
      <Shell title="Check your inbox" subtitle={`We sent a confirmation link to ${email}. Open it to finish creating your account.`}>
        <Button variant="secondary" className="w-full" onClick={() => { setSent(false); setMode("signin"); }}>
          Back to sign in
        </Button>
      </Shell>
    );

  return (
    <Shell
      title={mode === "signin" ? "Sign in to {name}" : "Create your account"}
      subtitle={mode === "signin" ? "Your agency workspace for clients, campaigns and pipeline." : "Use the email address your admin invited. The very first account becomes the workspace admin."}
    >
      <form onSubmit={submit} className="space-y-3 rounded-lg border bg-card p-5 shadow-soft">
        {mode === "signup" && (
          <Field label="Full name" htmlFor="name">
            <Input id="name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
        )}
        <Field label="Work email" htmlFor="email">
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password" htmlFor="password">
          <Input id="password" type="password" minLength={6} autoComplete={mode === "signin" ? "current-password" : "new-password"} required value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Button type="submit" className="mt-2 w-full" size="lg" disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : <Mail />} {mode === "signin" ? "Sign in" : "Create account"}
        </Button>
        {mode === "signin" && (
          <button type="button" onClick={resetPassword} className="w-full text-center text-xs text-muted-foreground hover:text-foreground">
            Forgot password?
          </button>
        )}
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        {mode === "signin" ? "New to the workspace?" : "Already have an account?"}{" "}
        <button className="font-medium text-primary hover:underline" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
          {mode === "signin" ? "Create an account" : "Sign in"}
        </button>
      </p>
    </Shell>
  );
}

/** Signed in to Supabase, but not on the team (or the workspace couldn't load). */
export function AccessProblem() {
  const { status, email, error } = useRemote();
  const signOut = useAuth((s) => s.signOut);
  const noAccess = status === "no_access";
  return (
    <Shell
      title={noAccess ? "You're not on the team yet" : "Couldn't load the workspace"}
      subtitle={noAccess ? `${email} doesn't have access. Ask an admin to invite this email address on the Team page, then try again.` : (error ?? "Something went wrong.")}
    >
      <div className="flex flex-col gap-2">
        <Button onClick={() => void retrySync()}>
          <RotateCcw /> Try again
        </Button>
        <Button variant="secondary" onClick={signOut}>
          <LogOut /> Sign out
        </Button>
        {!noAccess && (
          <p className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" /> If this is a new Supabase project, check that the migration in supabase/migrations has run.
          </p>
        )}
      </div>
    </Shell>
  );
}
