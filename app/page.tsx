import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Taskora</h1>
        <p className="mt-2 text-neutral-700">
          A task-based <b>reward credits</b> platform. Complete tasks, submit proof, and earn credits after verification.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/earn" className="rounded-lg bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-800">
            Start earning
          </Link>
          <Link href="/login" className="rounded-lg border px-4 py-2 hover:bg-neutral-50">
            Create account
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { t: "1) Choose a task", d: "Pick a simple task from the Earn page." },
          { t: "2) Complete & upload proof", d: "Submit a screenshot proof after completion." },
          { t: "3) Get verified credits", d: "Admin verifies your proof and credits your points." },
        ].map((x) => (
          <div key={x.t} className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="font-semibold">{x.t}</div>
            <div className="mt-1 text-sm text-neutral-700">{x.d}</div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Safety & compliance</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-neutral-700">
          <li>No VPN / proxy traffic.</li>
          <li>No fake proofs. Fraud leads to a permanent ban and forfeited credits.</li>
          <li>Credits are added only after verification.</li>
          <li>Withdrawal availability is subject to verification and internal rules.</li>
        </ul>
      </section>
    </div>
  );
}
