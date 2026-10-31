"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RequireAuth from "../../components/RequireAuth";
import { fetchReviews, deleteReview } from "../../lib/api";

function scoreTone(score) {
  if (score >= 80) return "text-diff-add";
  if (score >= 55) return "text-diff-warn";
  return "text-diff-del";
}

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function HistoryInner() {
  const [reviews, setReviews] = useState(null); // null = still loading
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReviews()
      .then(setReviews)
      .catch((err) => setError(err.message));
  }, []);

  async function handleDelete(id) {
    try {
      await deleteReview(id);
      setReviews((current) => current.filter((r) => r.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        Review history
      </h1>
      <p className="mt-2 max-w-xl text-sm text-inkmute">
        Every review you run is stored in the SQL database and listed here.
      </p>

      {error ? (
        <p className="mt-6 rounded-md bg-diff-delBg p-3 text-sm text-diff-del">
          {error}
        </p>
      ) : null}

      {!reviews && !error ? (
        <p className="mt-8 text-sm text-inkmute">Loading…</p>
      ) : null}

      {reviews && reviews.length === 0 ? (
        <p className="mt-8 text-sm text-inkmute">
          No reviews yet. Run one from the Review code page.
        </p>
      ) : null}

      {reviews && reviews.length > 0 ? (
        <div className="mt-8 overflow-x-auto rounded-md border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-slate-light text-slate-dark">
              <tr>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Language</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Issues</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0">
                  <td className="max-w-xs truncate px-4 py-3 font-mono text-xs text-ink">
                    <Link href={`/history/${r.id}`} className="hover:underline">
                      {r.preview}
                    </Link>
                  </td>
                  <td className="px-4 py-3 capitalize text-inkmute">
                    {r.language}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-inkmute">
                    {formatDate(r.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-inkmute">{r.issueCount}</td>
                  <td className={`px-4 py-3 font-medium ${scoreTone(r.score)}`}>
                    {r.score}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/history/${r.id}`}
                      className="mr-3 text-xs font-medium text-slate underline underline-offset-2"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-xs text-inkmute underline underline-offset-2 hover:text-diff-del"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

export default function HistoryPage() {
  return (
    <RequireAuth>
      <HistoryInner />
    </RequireAuth>
  );
}
