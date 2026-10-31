"use client";

import { useState } from "react";
import Link from "next/link";
import RequireAuth from "../../components/RequireAuth";
import ScoreGauge from "../../components/ScoreGauge";
import IssueCard from "../../components/IssueCard";
import { submitReview } from "../../lib/api";

const SAMPLE = `function getUser(id) {
  var user = null
  try {
    user = db.find(id)
  } catch (e) {}
  if (user == null) {
    console.log("not found")
  }
  return user
}`;

function DashboardInner() {
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(SAMPLE);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!code.trim()) {
      setError("Paste some code first.");
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);

    try {
      // Browser -> Spring Boot -> Python AI engine -> saved in SQL -> back here
      const review = await submitReview(language, code);
      setResult(review);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        Review your code
      </h1>
      <p className="mt-2 max-w-xl text-sm text-inkmute">
        Paste a function or file below. It is sent to the Spring Boot API,
        analysed by the Python engine, and saved to the database.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="code" className="text-sm font-medium text-ink">
              Code
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-md border border-line bg-white px-2 py-1 text-sm text-ink"
              aria-label="Language"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
            </select>
          </div>
          <textarea
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            rows={16}
            className="mt-2 w-full rounded-md border border-line bg-white p-4 font-mono text-sm text-ink"
          />
          {error ? (
            <p className="mt-2 text-sm text-diff-del">{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 rounded-md bg-slate px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-slate-dark disabled:opacity-60"
          >
            {loading ? "Analyzing…" : "Run review"}
          </button>
        </div>

        <aside className="rounded-md border border-line bg-white p-5">
          <h2 className="text-sm font-medium text-ink">Result</h2>
          {!result && !loading ? (
            <p className="mt-3 text-sm text-inkmute">
              Run a review to see the score and findings here.
            </p>
          ) : null}
          {loading ? (
            <p className="mt-3 text-sm text-inkmute">Reading your code…</p>
          ) : null}
          {result ? (
            <div className="mt-3 flex flex-col items-center">
              <ScoreGauge score={result.score} />
              <p className="mt-2 text-center text-sm text-inkmute">
                {result.summary}
              </p>
              <Link
                href={`/history/${result.id}`}
                className="mt-4 rounded-md border border-line px-3 py-1.5 text-sm text-slate-dark hover:bg-slate-light"
              >
                Open full review &amp; fixed code
              </Link>
            </div>
          ) : null}
        </aside>
      </form>

      {result && result.issues.length > 0 ? (
        <div className="mt-10">
          <h2 className="text-lg font-medium text-ink">
            Findings ({result.issues.length})
          </h2>
          <div className="mt-4 flex flex-col gap-3">
            {result.issues.map((issue, idx) => (
              <IssueCard key={idx} issue={issue} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardInner />
    </RequireAuth>
  );
}
