import { useEffect, useState } from "react";
import type { RateLimitUsage } from "@/features/rate-limit/rate-limit-database";
import { usageRepository } from "@/features/rate-limit/usage-repository";

function formatTimestamp(timestamp: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

export function UsageSettings() {
  const [usage, setUsage] = useState<RateLimitUsage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    usageRepository.getUsage()
      .then((nextUsage) => {
        if (isCurrent) setUsage(nextUsage);
      })
      .catch((caughtError: unknown) => {
        if (isCurrent) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load usage.");
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [reloadKey]);

  return (
    <div className="w-full max-w-2xl text-ink">
      <div className="border-b border-line pb-5">
        <p className="text-xs font-semibold uppercase tracking-eyebrow text-primary">
          Assistant allowance
        </p>
        <h2 className="mt-2 font-title text-2xl font-semibold text-ink">Usage</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Track how many AI assistant requests you have available in your current 24-hour window.
        </p>
      </div>

      <section aria-labelledby="assistant-usage-title" className="mt-6 rounded-xl border border-line bg-panel p-5">
        <h3 id="assistant-usage-title" className="font-semibold text-ink">AI assistant requests</h3>

        {error ? (
          <div className="mt-4" role="alert">
            <p className="text-sm text-danger">{error}</p>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setUsage(null);
                setReloadKey((key) => key + 1);
              }}
              className="mt-3 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink transition hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Try again
            </button>
          </div>
        ) : usage ? (
          <>
            <div className="mt-4 flex items-end justify-between gap-4">
              <p className="font-title text-3xl font-semibold text-ink">
                {usage.used} <span className="text-base font-normal text-muted">of {usage.limit} used</span>
              </p>
              <p className="text-sm font-semibold text-primary">{usage.remaining} remaining</p>
            </div>
            <progress
              aria-label="AI assistant request usage"
              className="mt-4 h-2 w-full accent-primary"
              max={usage.limit}
              value={usage.used}
            />
            <p className="mt-4 text-sm text-muted">
              {usage.resetAt
                ? `Resets ${formatTimestamp(usage.resetAt)}`
                : "Your 24-hour window starts with your next assistant request."}
            </p>
            {usage.lastRequestAt ? (
              <p className="mt-1 text-xs text-subtle">
                Last request: {formatTimestamp(usage.lastRequestAt)}
              </p>
            ) : null}
          </>
        ) : (
          <p className="mt-4 text-sm text-muted" role="status">Loading usage…</p>
        )}
      </section>
    </div>
  );
}
