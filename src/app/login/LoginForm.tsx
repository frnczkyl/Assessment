"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DEMO_ACCOUNTS = [
  { email: "alice@ajaia.dev", name: "Alice Rivera" },
  { email: "bob@ajaia.dev", name: "Bob Chen" },
  { email: "carol@ajaia.dev", name: "Carol Diaz" },
];
const DEMO_PASSWORD = "password123";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("alice@ajaia.dev");
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Login failed.");
        return;
      }
      // Full navigation so the server re-reads the new session cookie.
      router.push("/docs");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="brand" style={{ marginBottom: 20 }}>
          <span className="brand-mark">A</span> Ajaia Docs
        </div>

        <form onSubmit={submit}>
          <div className="field">
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && <div className="error-text">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", marginTop: 6 }}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : "Sign in"}
          </button>
        </form>

        <div className="demo-hint">
          <strong>Demo accounts</strong> — password <code>{DEMO_PASSWORD}</code>.
          Click one to fill it in, then sign in:
          {DEMO_ACCOUNTS.map((a) => (
            <button
              key={a.email}
              type="button"
              className="demo-user"
              onClick={() => {
                setEmail(a.email);
                setPassword(DEMO_PASSWORD);
              }}
            >
              {a.name} — {a.email}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
