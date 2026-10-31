"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

// Wrap a page in this to make it visible only to logged-in users.
export default function RequireAuth({ children }) {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  if (!ready || !user) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-12 text-sm text-inkmute">
        Loading…
      </div>
    );
  }
  return children;
}
