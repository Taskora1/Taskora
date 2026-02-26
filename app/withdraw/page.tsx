"use client";

import RequireAuth from "@/components/RequireAuth";

export default function WithdrawPage() {
  const locked = (process.env.NEXT_PUBLIC_WITHDRAW_LOCKED ?? "true") === "true";

  return (
    <RequireAuth>
      <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-3">
        <h1 className="text-xl font-semibold">Withdraw</h1>
        {locked ? (
          <>
            <div className="rounded-xl border bg-neutral-50 p-4 text-sm text-neutral-700">
              Withdrawals are currently <b>locked</b> during beta and/or until internal verification rules are met.
              <div className="mt-2 text-xs text-neutral-600">Processing time (when enabled): 3–7 business days.</div>
            </div>
            <ul className="list-disc pl-5 text-sm text-neutral-700 space-y-1">
              <li>Minimum withdrawal: 1500 points ($5)</li>
              <li>Credits are verified before payout</li>
              <li>Fraud attempts will be rejected</li>
            </ul>
          </>
        ) : (
          <div className="text-sm text-neutral-700">
            Withdrawals are enabled. (You can build the request form next.)
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
