import { Input } from "@/components/ui/input";

/**
 * Visual-only, per the locked scope for this phase — explicitly NOT a
 * `<form>` (so there's no native submit/navigation to accidentally
 * trigger) and the button has no handler at all. No subscribers table,
 * no API route, no email persistence, no fake "subscribed!" success
 * state — any of that is out of scope until a future phase.
 */
export function BlogSubscribeBox() {
  return (
    <div className="flex h-full flex-col justify-center gap-3 rounded-(--public-radius-card) border border-slate-200 bg-white p-6">
      <h2 className="text-base font-bold text-(--public-primary)">Stay Updated!</h2>
      <p className="text-sm text-slate-500">Subscribe and get our weekly newsletter in your inbox.</p>
      <Input type="email" placeholder="Enter your email" aria-label="Email address" className="h-11" />
      <button
        type="button"
        disabled
        aria-disabled="true"
        title="Subscriptions aren't available yet"
        className="h-11 w-full cursor-not-allowed rounded-md bg-(--public-accent)/60 text-sm font-semibold text-white"
      >
        Subscribe Now
      </button>
    </div>
  );
}
