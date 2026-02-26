    export default function Page() {
      return (
        <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-3">
          <h1 className="text-xl font-semibold">Privacy Policy</h1>
          <div className="prose max-w-none prose-neutral">
            <p className="text-sm text-neutral-700">
We store only what we need to operate the service: account email, task activity (clicks/submissions), and reward status.
We do not use device fingerprinting. We may store basic security logs (e.g., IP for rate-limits) to prevent abuse.
</p>
          </div>
        </div>
      );
    }
