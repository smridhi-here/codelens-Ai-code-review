import Link from "next/link";

const steps = [
  {
    title: "Paste your code",
    body: "Drop in a function, a file, or a whole diff. JavaScript and Python are supported first.",
  },
  {
    title: "The engine reads it",
    body: "A Python analysis service, called through the Spring Boot API, checks structure, style, and common bug patterns.",
  },
  {
    title: "Get a structured review",
    body: "A score, and a line-by-line list of issues with a suggested fix for each one — not just a wall of text.",
  },
];

const pillars = [
  {
    title: "Bug patterns",
    body: "Empty catch blocks, bare excepts, loose equality — the mistakes that pass a glance but fail in production.",
  },
  {
    title: "Style & readability",
    body: "Line length, naming, leftover debug statements — the small things that make a diff slower to review.",
  },
  {
    title: "A score you can track",
    body: "Every review is stored, so quality over time is visible, not just a one-off comment.",
  },
];

export default function HomePage() {
  return (
    <div>
      <section className="mx-auto max-w-5xl px-6 pb-16 pt-20">
        <p className="font-mono text-xs uppercase tracking-wide text-slate">
          AI code review
        </p>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
          Know what's wrong with your code before your reviewer does.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-inkmute">
          Codelens reads a code submission the way a careful senior engineer
          would: it flags real bugs, calls out risky patterns, and explains
          the fix — in seconds, not in tomorrow's pull request comments.
        </p>
        <div className="mt-8 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="rounded-md bg-slate px-5 py-3 text-sm font-medium text-paper transition-colors hover:bg-slate-dark"
          >
            Review your code
          </Link>
          <Link
            href="/history"
            className="text-sm font-medium text-inkmute underline decoration-line underline-offset-4 hover:text-ink"
          >
            See past reviews
          </Link>
        </div>
      </section>

      <section className="border-t border-line bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-2xl font-semibold tracking-tight text-ink">
            How a review happens
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.title} className="rounded-md border border-line p-5">
                <span className="font-mono text-xs text-slate">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-medium text-ink">{step.title}</h3>
                <p className="mt-2 text-sm text-inkmute">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-ink">
          What it checks
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {pillars.map((p) => (
            <div key={p.title}>
              <h3 className="font-medium text-ink">{p.title}</h3>
              <p className="mt-2 text-sm text-inkmute">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-line bg-slate-light">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 px-6 py-14 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-semibold text-slate-dark">
              Try it on a real snippet
            </h2>
            <p className="mt-1 text-sm text-slate-dark/80">
              Create a free account to keep your review history.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="whitespace-nowrap rounded-md bg-slate-dark px-5 py-3 text-sm font-medium text-paper hover:opacity-90"
          >
            Open the reviewer
          </Link>
        </div>
      </section>
    </div>
  );
}
