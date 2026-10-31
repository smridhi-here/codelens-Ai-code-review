"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready, logout } = useAuth();

  const links = user
    ? [
        { href: "/", label: "Overview" },
        { href: "/dashboard", label: "Review code" },
        { href: "/history", label: "History" },
        { href: "/stats", label: "Stats" },
      ]
    : [{ href: "/", label: "Overview" }];

  function handleLogout() {
    logout();
    router.push("/");
  }

  function linkClass(active) {
    return `rounded-md px-3 py-2 text-sm transition-colors ${
      active
        ? "bg-slate-light text-slate-dark"
        : "text-inkmute hover:bg-slate-light hover:text-slate-dark"
    }`;
  }

  return (
    <header className="border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-slate font-mono text-sm text-paper">
            {"</>"}
          </span>
          <span className="text-lg font-semibold tracking-tight text-ink">
            Codelens
          </span>
        </Link>

        <nav className="flex flex-wrap items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={linkClass(pathname === link.href)}
            >
              {link.label}
            </Link>
          ))}

          {ready && user ? (
            <div className="ml-2 flex items-center gap-3 border-l border-line pl-3">
              <span className="text-sm text-inkmute">Hi, {user.name}</span>
              <button
                onClick={handleLogout}
                className="rounded-md border border-line px-3 py-1.5 text-sm text-ink hover:bg-slate-light"
              >
                Log out
              </button>
            </div>
          ) : null}

          {ready && !user ? (
            <div className="ml-2 flex items-center gap-2 border-l border-line pl-3">
              <Link href="/login" className={linkClass(pathname === "/login")}>
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-slate px-3 py-1.5 text-sm font-medium text-paper hover:bg-slate-dark"
              >
                Sign up
              </Link>
            </div>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
