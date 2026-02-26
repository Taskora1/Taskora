"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function Nav() {
  const supabase = supabaseBrowser();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setEmail(session?.user.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
  }

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold tracking-tight">Taskora</Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/earn" className="hover:underline">Earn</Link>
          <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          <Link href="/withdraw" className="hover:underline">Withdraw</Link>
          <Link href="/faq" className="hover:underline">FAQ</Link>
          {email ? (
            <>
              <span className="text-neutral-600 hidden sm:inline">{email}</span>
              <button onClick={logout} className="rounded-md border px-3 py-1 hover:bg-neutral-50">Log out</button>
            </>
          ) : (
            <Link href="/login" className="rounded-md border px-3 py-1 hover:bg-neutral-50">Log in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
