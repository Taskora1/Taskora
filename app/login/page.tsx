"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import Link from "next/link";

export default function Login() {
  const supabase = supabaseBrowser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setMsg(null);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
        });
        if (error) throw error;
        setMsg("Signup successful. Please check your email to verify your account, then come back to log in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = "/dashboard";
      }
    } catch (e: any) {
      setMsg(e?.message ?? "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border bg-white p-6 shadow-sm space-y-4">
      <h1 className="text-xl font-semibold">{mode === "signup" ? "Create your account" : "Log in"}</h1>
      <p className="text-sm text-neutral-700">
        Verification is required. Use a real email.
      </p>

      <div className="space-y-2">
        <label className="text-sm font-medium">Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border px-3 py-2" placeholder="you@example.com" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border px-3 py-2" placeholder="••••••••" />
      </div>

      {msg && <div className="rounded-lg bg-neutral-50 p-3 text-sm text-neutral-700 border">{msg}</div>}

      <button disabled={busy} onClick={submit} className="w-full rounded-lg bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-800 disabled:opacity-60">
        {busy ? "Please wait…" : (mode === "signup" ? "Sign up" : "Log in")}
      </button>

      <div className="flex items-center justify-between text-sm">
        <button className="underline" onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setMsg(null); }}>
          Switch to {mode === "signup" ? "login" : "signup"}
        </button>
        <Link href="/" className="underline">Home</Link>
      </div>
    </div>
  );
}
