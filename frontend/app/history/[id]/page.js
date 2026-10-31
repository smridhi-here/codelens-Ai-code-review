"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import RequireAuth from "../../../components/RequireAuth";
import ScoreGauge from "../../../components/ScoreGauge";
import IssueCard from "../../../components/IssueCard";
import { fetchReview, requestFix } from "../../../lib/api";
import { diffLines } from "../../../lib/diff";

const LINE_BG = {
  error: "bg-diff-delBg",
  warning: "bg-diff-warnBg",
  info: "bg-slate-light",
};
const RANK = { error: 3, warning: 2, info: 1 };

function DetailInner() {
  const { id } = useParams();
  const [review, setReview] = useState(null);
  const [error, setError] = useState(null);

  const [fix, setFix] = useState(null);
  const [fixError, setFixError] = useState(null);
  const [fixing, setFixing] = useState(false);
  const [tab, setTab] = useState("changes");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchReview(id)
      .then(setReview)
      .catch((err) => setError(err.message));
  }, [id]);

  // line number -> worst severity + the issues on that line
  const byLine = useMemo(() => {
    const map = {};
    (review?.issues || []).forEach((issue) => {
      if (!issue.line) return;
      const entry = map[issue.line] || { severity: "info", issues: [] };
      if (RANK[issue.severity] > RANK[entry.severity]) entry.severity = issue.severity;
      entry.issues.push(issue);
      map[issue.line] = entry;
    });
    return map;
  }, [review]);

  const diffRows = useMemo(
    () => (fix && review ? diffLines(review.code, fix.fixedCode) : []),
    [fix, review]
  );

  async function handleFix() {
    setFixing(true);
    setFix(null);
    setFixError(null);
    setCopied(false);
    try {
      const result = await requestFix(id);
      if (result.error || !result.fixedCode) {
        setFixError(result.error || "The AI did not return any code.");
      } else {
        setFix(result);
        setTab("changes");
      }
    } catch (err) {
      setFixError(err.message);
    } finally {
      setFixing(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(fix.fixedCode);
      setCopied(true);
    } catch (e) {
      setCopied(false);
    }
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-12">
        <Link href="/history" className="text-sm text-slate underline underline-offset-2">
          ← Back to history
        </Link>
        <p className="mt-6 rounded-md bg-diff-delBg p-3 text-sm text-diff-del">{error}</p>
      </div>
    );
  }
  if (!review) {
    return <div className="mx-auto max-w-5xl px-6 py-12 text-sm text-inkmute">Loading…</div>;
  }

  const codeLines = review.code.split("\n");

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <Link href="/history" className="text-sm text-slate underline underline-offset-2">
        ← Back to history
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Review #{review.id}
          </h1>
          <p className="mt-1 text-sm capitalize text-inkmute">
            {review.language} ·{" "}
            {new Date(review.createdAt).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr,1fr]">
        {/* code with highlighted lines */}
        <div className="overflow-hidden rounded-md border border-line bg-white">
          <div className="border-b border-line bg-slate-light px-4 py-2 text-xs font-medium text-slate-dark">
            Your code — highlighted lines have findings
          </div>
          <div className="overflow-x-auto py-2 font-mono text-sm">
            {codeLines.map((text, index) => {
              const n = index + 1;
              const hit = byLine[n];
              return (
                <div
                  key={n}
                  className={`flex ${hit ? LINE_BG[hit.severity] : ""}`}
                  title={hit ? hit.issues.map((i) => i.message).join("\n") : undefined}
                >
                  <span className="w-10 shrink-0 select-none pr-3 text-right text-xs leading-6 text-inkmute">
                    {n}
                  </span>
                  <pre className="flex-1 whitespace-pre pr-4 leading-6 text-ink">{text || " "}</pre>
                  {hit ? (
                    <span className="shrink-0 pr-3 text-xs leading-6 text-inkmute">
                      {hit.issues.map((i) => i.rule).join(", ")}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <aside className="h-fit rounded-md border border-line bg-white p-5">
          <h2 className="text-sm font-medium text-ink">Result</h2>
          <div className="mt-3 flex flex-col items-center">
            <ScoreGauge score={review.score} />
            <p className="mt-2 text-center text-sm text-inkmute">{review.summary}</p>
          </div>
        </aside>
      </div>

      {/* findings */}
      <div className="mt-10">
        <h2 className="text-lg font-medium text-ink">
          Findings ({review.issues.length})
        </h2>
        {review.issues.length === 0 ? (
          <p className="mt-3 text-sm text-inkmute">Nothing to fix here.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {review.issues.map((issue, idx) => (
              <IssueCard key={idx} issue={issue} />
            ))}
          </div>
        )}
      </div>

      {/* AI fix */}
      <div className="mt-12 rounded-md border border-line bg-white p-6">
        <h2 className="text-lg font-medium text-ink">Fixed code</h2>
        <p className="mt-1 max-w-xl text-sm text-inkmute">
          Ask the AI to rewrite this code with the findings above fixed. Review
          the changes before using them.
        </p>
        <button
          onClick={handleFix}
          disabled={fixing}
          className="mt-4 rounded-md bg-slate px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-slate-dark disabled:opacity-60"
        >
          {fixing ? "Generating fix… (up to a minute)" : fix ? "Generate again" : "Show fixed code"}
        </button>

        {fixError ? (
          <p className="mt-4 rounded-md bg-diff-delBg p-3 text-sm text-diff-del">{fixError}</p>
        ) : null}

        {fix ? (
          <div className="mt-6">
            {fix.explanation ? (
              <p className="whitespace-pre-line rounded-md bg-slate-light p-4 text-sm text-slate-dark">
                {fix.explanation}
              </p>
            ) : null}

            <div className="mt-4 flex items-center justify-between">
              <div className="flex gap-1">
                {[
                  ["changes", "Changes"],
                  ["code", "Fixed code"],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className={`rounded-md px-3 py-1.5 text-sm ${
                      tab === key
                        ? "bg-slate-light text-slate-dark"
                        : "text-inkmute hover:bg-slate-light"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                onClick={handleCopy}
                className="rounded-md border border-line px-3 py-1.5 text-sm text-ink hover:bg-slate-light"
              >
                {copied ? "Copied!" : "Copy fixed code"}
              </button>
            </div>

            <div className="mt-3 overflow-x-auto rounded-md border border-line py-2 font-mono text-sm">
              {tab === "changes"
                ? diffRows.map((row, idx) => (
                    <div
                      key={idx}
                      className={`flex ${
                        row.type === "add"
                          ? "bg-diff-addBg"
                          : row.type === "del"
                          ? "bg-diff-delBg"
                          : ""
                      }`}
                    >
                      <span
                        className={`w-8 shrink-0 select-none text-center leading-6 ${
                          row.type === "add"
                            ? "text-diff-add"
                            : row.type === "del"
                            ? "text-diff-del"
                            : "text-inkmute"
                        }`}
                      >
                        {row.type === "add" ? "+" : row.type === "del" ? "−" : ""}
                      </span>
                      <pre className="flex-1 whitespace-pre pr-4 leading-6 text-ink">
                        {row.text || " "}
                      </pre>
                    </div>
                  ))
                : fix.fixedCode.split("\n").map((text, idx) => (
                    <div key={idx} className="flex">
                      <span className="w-10 shrink-0 select-none pr-3 text-right text-xs leading-6 text-inkmute">
                        {idx + 1}
                      </span>
                      <pre className="flex-1 whitespace-pre pr-4 leading-6 text-ink">
                        {text || " "}
                      </pre>
                    </div>
                  ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function ReviewDetailPage() {
  return (
    <RequireAuth>
      <DetailInner />
    </RequireAuth>
  );
}
