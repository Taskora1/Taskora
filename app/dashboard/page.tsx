"use client";

import { useEffect, useState } from "react";
import RequireAuth from "@/components/RequireAuth";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import Link from "next/link";

type Submission = {
  id: number;
  created_at: string;
  status: "pending" | "approved" | "rejected";
  admin_note: string | null;
  offers: { title: string; payout_points: number } | null;
};

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashInner />
    </RequireAuth>
  );
}

function DashInner() {
  const supabase = supabaseBrowser();
  const [points, setPoints] = useState<number>(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const user = sess.session?.user;
      if (!user) return;

      const prof = await supabase.from("profiles").select("points_balance,is_admin").eq("id", user.id).single();
      setPoints((prof.data?.points_balance ?? 0) as number);
      setIsAdmin(Boolean(prof.data?.is_admin));

      const s = await supabase
        .from("proof_submissions")
        .select("id,created_at,status,admin_note,offers(title,payout_points)")
        .order("created_at", { ascending: false })
        .limit(50);

      setSubs((s.data ?? []) as any);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="rounded-xl bg-neutral-100 px-4 py-3">
            <div className="text-xs text-neutral-600">Points balance</div>
            <div className="text-2xl font-semibold">{points}</div>
          </div>
          <div className="text-sm text-neutral-700">
            300 points = $1. Minimum withdrawal: 1500 points ($5).
          </div>
          {isAdmin && (
            <Link href="/admin" className="ml-auto rounded-lg border px-4 py-2 hover:bg-neutral-50">
              Admin panel
            </Link>
          )}
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Your proof submissions</h2>
        <p className="mt-1 text-sm text-neutral-700">Status updates appear here after review.</p>

        {loading ? (
          <div className="mt-4 text-sm text-neutral-600">Loading…</div>
        ) : subs.length === 0 ? (
          <div className="mt-4 text-sm text-neutral-600">No submissions yet. Go to Earn and submit proof.</div>
        ) : (
          <div className="mt-4 space-y-3">
            {subs.map((x) => (
              <div key={x.id} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium">{x.offers?.title ?? "Task"}</div>
                  <span className={
                    "rounded-full px-2 py-1 text-xs border " +
                    (x.status === "approved" ? "bg-green-50 border-green-200 text-green-700" :
                     x.status === "rejected" ? "bg-red-50 border-red-200 text-red-700" :
                     "bg-yellow-50 border-yellow-200 text-yellow-700")
                  }>
                    {x.status.toUpperCase()}
                  </span>
                </div>
                <div className="mt-1 text-xs text-neutral-600">Submitted: {new Date(x.created_at).toLocaleString()}</div>
                {x.admin_note && <div className="mt-2 text-sm text-neutral-700"><b>Admin note:</b> {x.admin_note}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
