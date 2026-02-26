"use client";

import { useEffect, useMemo, useState } from "react";
import RequireAuth from "@/components/RequireAuth";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type Offer = {
  id: number;
  title: string;
  description: string | null;
  payout_points: number;
  url: string;
};

export default function EarnPage() {
  return (
    <RequireAuth>
      <EarnInner />
    </RequireAuth>
  );
}

function EarnInner() {
  const supabase = supabaseBrowser();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [safetyOffer, setSafetyOffer] = useState<Offer | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("offers")
        .select("id,title,description,payout_points,url")
        .eq("is_active", true)
        .order("id", { ascending: true })
        .limit(3);
      if (error) setError(error.message);
      setOffers((data ?? []) as any);
      setLoading(false);
    })();
  }, []);

  async function onClickOffer(offer: Offer) {
    setSafetyOffer(offer);
  }

  async function continueToOffer() {
    if (!safetyOffer) return;
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) return;

    // log click (RLS allows user insert own click)
    await supabase.from("clicks").insert({
      user_id: user.id,
      offer_id: safetyOffer.id,
      ip: null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });

    // redirect
    window.location.href = safetyOffer.url;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Earn</h1>
        <p className="mt-2 text-sm text-neutral-700">
          Choose a task. After completion, come back and submit a <b>screenshot proof</b>. Points are added only after verification.
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-neutral-600">Loading offers…</div>
      ) : error ? (
        <div className="rounded-lg border bg-white p-4 text-sm text-red-600">{error}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {offers.map((o) => (
            <div key={o.id} className="rounded-2xl border bg-white p-5 shadow-sm flex flex-col">
              <div className="font-semibold">{o.title}</div>
              <div className="mt-1 text-sm text-neutral-700 line-clamp-3">{o.description ?? "Complete the task and submit screenshot proof."}</div>
              <div className="mt-3 text-sm">
                <span className="rounded-full bg-neutral-100 px-2 py-1">Earn <b>{o.payout_points}</b> points</span>
              </div>
              <button onClick={() => onClickOffer(o)} className="mt-4 rounded-lg bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-800">
                Open task
              </button>
            </div>
          ))}
        </div>
      )}

      <SubmitProof />

      {/* Safety modal */}
      {safetyOffer && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border space-y-3">
            <div className="text-lg font-semibold">Before you continue</div>
            <ul className="list-disc pl-5 text-sm text-neutral-700 space-y-1">
              <li>Complete the task honestly.</li>
              <li><b>No VPN/proxy</b>. Abuse may ban your account.</li>
              <li>Take a clear screenshot after completion.</li>
              <li>Come back to Taskora and submit your screenshot proof.</li>
            </ul>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setSafetyOffer(null)} className="rounded-lg border px-4 py-2 hover:bg-neutral-50">Cancel</button>
              <button onClick={continueToOffer} className="rounded-lg bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-800">Continue</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SubmitProof() {
  const supabase = supabaseBrowser();
  const [offers, setOffers] = useState<{ id: number; title: string; payout_points: number }[]>([]);
  const [offerId, setOfferId] = useState<number | "">("");
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("offers").select("id,title,payout_points").eq("is_active", true).order("id").limit(50)
      .then(({ data }) => setOffers((data ?? []) as any));
  }, []);

  async function submit() {
    setMsg(null);
    if (!offerId) return setMsg("Please select a task.");
    if (!file) return setMsg("Please upload a screenshot.");
    setBusy(true);

    try {
      const { data: sess } = await supabase.auth.getSession();
      const user = sess.session?.user;
      if (!user) throw new Error("Not logged in.");

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${user.id}/${Date.now()}_${safeName}`;

      const up = await supabase.storage.from("proofs").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (up.error) throw up.error;

      const ins = await supabase.from("proof_submissions").insert({
        user_id: user.id,
        offer_id: offerId,
        screenshot_path: path,
        note: note || null,
      });
      if (ins.error) throw ins.error;

      setMsg("Submitted! Status: Pending verification (typically 24–72h).");
      setOfferId("");
      setFile(null);
      setNote("");
      // reset input
      const input = document.getElementById("proofFile") as HTMLInputElement | null;
      if (input) input.value = "";
    } catch (e: any) {
      setMsg(e?.message ?? "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Submit screenshot proof</h2>
      <p className="mt-1 text-sm text-neutral-700">After completing a task, upload a clear screenshot. Points are added only after admin approval.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Task</label>
          <select value={offerId} onChange={(e) => setOfferId(e.target.value ? Number(e.target.value) : "")}
            className="w-full rounded-lg border px-3 py-2 bg-white">
            <option value="">Select a task…</option>
            {offers.map(o => <option key={o.id} value={o.id}>{o.title} ({o.payout_points} pts)</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Screenshot</label>
          <input id="proofFile" type="file" accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full rounded-lg border px-3 py-2 bg-white" />
        </div>

        <div className="sm:col-span-2 space-y-2">
          <label className="text-sm font-medium">Note (optional)</label>
          <input value={note} onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-lg border px-3 py-2" placeholder="Anything the admin should know…" />
        </div>
      </div>

      {msg && <div className="mt-4 rounded-lg border bg-neutral-50 p-3 text-sm text-neutral-700">{msg}</div>}

      <button disabled={busy} onClick={submit}
        className="mt-4 rounded-lg bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-800 disabled:opacity-60">
        {busy ? "Submitting…" : "Submit proof"}
      </button>
    </div>
  );
}
