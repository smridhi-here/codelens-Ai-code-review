// All calls to the Spring Boot backend live here.
// Trailing slashes are removed so "https://host/" + "/api/..." never becomes "//api".
const BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080").replace(/\/+$/, "");
const TOKEN_KEY = "codelens_token";
const USER_KEY = "codelens_user";

function store() {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch (e) {
    return null;
  }
}

// ---- login session (token is kept in the browser's localStorage) ----
export function getToken() {
  const s = store();
  return s ? s.getItem(TOKEN_KEY) : null;
}

export function getStoredUser() {
  const s = store();
  if (!s) return null;
  try {
    const raw = s.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveSession(data) {
  const s = store();
  if (!s) return;
  s.setItem(TOKEN_KEY, data.token);
  s.setItem(USER_KEY, JSON.stringify({ name: data.name, email: data.email }));
}

export function clearSession() {
  const s = store();
  if (!s) return;
  s.removeItem(TOKEN_KEY);
  s.removeItem(USER_KEY);
}

// ---- generic request helper ----
async function request(path, options = {}, withAuth = true) {
  const token = withAuth ? getToken() : null;
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch (e) {
    throw new Error(
      "Cannot reach the backend. Is Spring Boot running on port 8080?"
    );
  }

  // Token missing, invalid or expired: send the user back to the login page.
  if (res.status === 401 && withAuth) {
    clearSession();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Your session expired. Please log in again.");
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body.message) message = body.message;
    } catch (e) {
      // response had no JSON body; keep the default message
    }
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}

// ---- auth ----
export async function signup(name, email, password) {
  const data = await request(
    "/api/auth/signup",
    { method: "POST", body: JSON.stringify({ name, email, password }) },
    false
  );
  saveSession(data);
  return data;
}

export async function login(email, password) {
  const data = await request(
    "/api/auth/login",
    { method: "POST", body: JSON.stringify({ email, password }) },
    false
  );
  saveSession(data);
  return data;
}

// ---- reviews (all need a logged-in user) ----
export function submitReview(language, code) {
  return request("/api/review", {
    method: "POST",
    body: JSON.stringify({ language, code }),
  });
}

export function fetchReviews() {
  return request("/api/reviews");
}

export function deleteReview(id) {
  return request(`/api/reviews/${id}`, { method: "DELETE" });
}

export function fetchReview(id) {
  return request(`/api/reviews/${id}`);
}

// Ask the AI for a corrected version of a saved review's code.
export function requestFix(id) {
  return request(`/api/reviews/${id}/fix`, { method: "POST" });
}

export function fetchStats() {
  return request("/api/stats");
}
