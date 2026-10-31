"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RequireAuth from "../../components/RequireAuth";
import { fetchStats } from "../../lib/api";

const SEVERITIES = [
  { key: "error", label: "Bugs", bar: "bg-diff-del" },
  { key: "warning", label: "Style", bar: "bg-diff-warn" },
  { key: "info", label: "Suggestions", bar: "bg-slate" },
];

function Card({ label, value }) {
  return (
    <div className="rounded-md border border-line bg-white p-4">
      <p className="text-xs text-inkmute">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function TrendChart({ points }) {
  const W = 600;
  const H = 200;
  const left = 36;
  const right = 12;
  const top = 12;
  const bottom = 24;
  const x = (i) =>
    points.length === 1
      ? (left + W - right) / 2
      : left + (i * (W - left - right)) / (points.length - 1);
  const y = (score) => top + ((100 - score) * (H - top - bottom)) / 100;
  const path = points.map((p, i) => `${x(i)},${y(p.score)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Score over time">
      {[0, 50, 100].map((v) => (
        <g key={v}>
          <line x1={left} x2={W - right} y1={y(v)} y2={y(v)} stroke="#DEDDD6" strokeWidth="1" />
          <text x={left - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#5B6266">
            {v}
          </text>
        </g>
      ))}
      {points.length > 1 ? (
        <polyline points={path} fill="none" stroke="#20535C" strokeWidth="2" />
      ) : null}
      {points.map((p, i) => (
        <circle key={p.id} cx={x(i)} cy={y(p.score)} r="4" fill="#20535C">
          <title>{`Review #${p.id}: ${p.score}`}</title>
        </circle>
      ))}
      <text x={left} y={H - 6} fontSize="11" fill="#5B6266">
        oldest
      </text>
      <text x={W - right} y={H - 6} textAnchor="end" fontSize="11" fill="#5B6266">
        latest
      </text>
    </svg>
  );
}

function StatsInner() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Your stats</h1>
      <p className="mt-2 max-w-xl text-sm text-inkmute">
        Calculated from the reviews saved in your account.
      </p>

      {error ? (
        <p className="mt-6 rounded-md bg-diff-delBg p-3 text-sm text-diff-del">{error}</p>
      ) : null}
      {!stats && !error ? <p className="mt-8 text-sm text-inkmute">Loading…</p> : null}

      {stats && stats.totalReviews === 0 ? (
        <p className="mt-8 text-sm text-inkmute">
          No reviews yet.{" "}
          <Link href="/dashboard" className="text-slate underline underline-offset-2">
            Run your first review
          </Link>
          .
        </p>
      ) : null}

      {stats && stats.totalReviews > 0 ? (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card label="Reviews" value={stats.totalReviews} />
            <Card label="Average score" value={stats.averageScore} />
            <Card label="Best score" value={stats.bestScore} />
            <Card label="Issues found" value={stats.totalIssues} />
          </div>

          <div className="mt-8 rounded-md border border-line bg-white p-5">
            <h2 className="text-sm font-medium text-ink">
              Score over time (last {stats.scoreTrend.length})
            </h2>
            <div className="mt-3">
              <TrendChart points={stats.scoreTrend} />
            </div>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-md border border-line bg-white p-5">
              <h2 className="text-sm font-medium text-ink">Most common issues</h2>
              {stats.issuesByRule.length === 0 ? (
                <p className="mt-3 text-sm text-inkmute">No issues found yet.</p>
              ) : (
                <div className="mt-4 flex flex-col gap-3">
                  {stats.issuesByRule.map((r) => (
                    <div key={r.rule}>
                      <div className="flex justify-between text-xs">
                        <span className="font-mono text-ink">{r.rule}</span>
                        <span className="text-inkmute">{r.count}</span>
                      </div>
                      <div className="mt-1 h-2 rounded bg-line">
                        <div
                          className="h-2 rounded bg-slate"
                          style={{
                            width: `${(r.count / stats.issuesByRule[0].count) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-md border border-line bg-white p-5">
              <h2 className="text-sm font-medium text-ink">Issues by type</h2>
              <div className="mt-4 flex flex-col gap-3">
                {SEVERITIES.map((s) => {
                  const count = stats.issuesBySeverity[s.key] || 0;
                  const pct = stats.totalIssues ? (count / stats.totalIssues) * 100 : 0;
                  return (
                    <div key={s.key}>
                      <div className="flex justify-between text-xs">
                        <span className="text-ink">{s.label}</span>
                        <span className="text-inkmute">{count}</span>
                      </div>
                      <div className="mt-1 h-2 rounded bg-line">
                        <div className={`h-2 rounded ${s.bar}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <h2 className="mt-6 text-sm font-medium text-ink">Reviews by language</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {Object.entries(stats.reviewsByLanguage).map(([lang, count]) => (
                  <span
                    key={lang}
                    className="rounded bg-slate-light px-2 py-1 text-xs capitalize text-slate-dark"
                  >
                    {lang}: {count}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

export default function StatsPage() {
  return (
    <RequireAuth>
      <StatsInner />
    </RequireAuth>
  );
}
