    export default function Page() {
      return (
        <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-3">
          <h1 className="text-xl font-semibold">FAQ</h1>
          <div className="prose max-w-none prose-neutral">
            <ul className="list-disc pl-5 space-y-2 text-sm text-neutral-700">
<li><b>When do I receive points?</b> After your screenshot proof is verified. Typical verification: 24–72 hours.</li>
<li><b>Can I use VPN?</b> No. VPN/proxy traffic is not allowed.</li>
<li><b>Are rewards guaranteed?</b> No. Rewards are subject to verification and advertiser/task rules.</li>
<li><b>How do withdrawals work?</b> Withdrawals may remain locked during beta and are subject to processing time (3–7 business days).</li>
</ul>
          </div>
        </div>
      );
    }
