"use client";

import { useEffect, useState } from "react";
import RequireAuth from "@/components/RequireAuth";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type Row = {
  id: number;
  created_at: string;
  status: "pending" | "approved" | "rejected";
  note: string | null;
  admin_note: string | null;
  screenshot_path: string;
  user_id: string;
  offers: { title: string; payout_points: number } | null;
  profiles: { email: string | null } | null;
};

export default function AdminPage() {
  return (
    <RequireAuth>
      <AdminInner />
    </RequireAuth>
  );
}

function AdminInner() {
  const supabase = supabaseBrowser();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setMsg(null);
    const { data: sess } = await supabase.auth.getSession();
    const user = sess.session?.user;
    if (!user) return;

    const prof = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
    if (!prof.data?.is_admin) {
      setAllowed(false);
      return;
    }
    setAllowed(true);

    const q = await supabase
      .from("proof_submissions")
      .select("id,created_at,status,note,admin_note,screenshot_path,user_id,offers(title,payout_points),profiles(email)")
      .order("created_at", { ascending: false })
      .limit(200);

    setRows((q.data ?? []) as any);
  }

  useEffect(() => { load(); }, []);

  async function openScreenshot(path: string) {
    setMsg(null);
    const { data, error } = await supabase.storage.from("proofs").createSignedUrl(path, 60);
    if (error) return setMsg(error.message);
    window.open(data.signedUrl, "_blank");
  }

  async function act(id: number, action: "approve" | "reject") {
    setBusyId(id);
    setMsg(null);
    const adminNote = prompt(action === "approve" ? "Admin note (optional):" : "Reason for rejection (recommended):") ?? "";
    const { error } = await supabase.rpc("admin_review_submission", {
      p_submission_id: id,
      p_action: action,
      p_admin_note: adminNote || null
    });
    if (error) setMsg(error.message);
    await load();
    setBusyId(null);
  }

  if (allowed === null) return <div className="text-sm text-neutral-600">Loading…</div>;

  if (allowed === false) {
    return (
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Admin</h1>
        <p className="mt-2 text-sm text-red-700">Access denied. You are not an admin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Admin panel</h1>
        <p className="mt-1 text-sm text-neutral-700">Review screenshot proofs. Approving adds points automatically.</p>
        {msg && <div className="mt-3 rounded-lg border bg-neutral-50 p-3 text-sm text-neutral-700">{msg}</div>}
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-neutral-600">
            <tr>
              <th className="py-2 pr-3">User</th>
              <th className="py-2 pr-3">Task</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Submitted</th>
              <th className="py-2 pr-3">Proof</th>
              <th className="py-2 pr-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="py-3 pr-3">{r.profiles?.email ?? r.user_id.slice(0, 8)}</td>
                <td className="py-3 pr-3">{r.offers?.title ?? "Task"}</td>
                <td className="py-3 pr-3">
                  <span className="rounded-full border px-2 py-1 text-xs">{r.status}</span>
                </td>
                <td className="py-3 pr-3">{new Date(r.created_at).toLocaleString()}</td>
                <td className="py-3 pr-3">
                  <button onClick={() => openScreenshot(r.screenshot_path)} className="underline">Open</button>
                </td>
                <td className="py-3 pr-3">
                  <div className="flex gap-2">
                    <button disabled={busyId === r.id} onClick={() => act(r.id, "approve")}
                      className="rounded-md border px-3 py-1 hover:bg-neutral-50 disabled:opacity-50">
                      Approve
                    </button>
                    <button disabled={busyId === r.id} onClick={() => act(r.id, "reject")}
                      className="rounded-md border px-3 py-1 hover:bg-neutral-50 disabled:opacity-50">
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 text-xs text-neutral-600">
          Tip: Keep rewards pending by default. Approve only when the screenshot clearly proves completion.
        </div>
      </div>
    </div>
  );
}
