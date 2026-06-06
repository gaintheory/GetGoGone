"use client";

import React from "react";

export default function LoginPage() {
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.ok) {
        setError(result?.error || "Wrong password.");
        setSubmitting(false);
        return;
      }
      // Hard redirect so middleware re-evaluates with the new cookie
      const params = new URLSearchParams(window.location.search);
      const next = params.get("next") || "/";
      window.location.href = next.startsWith("/") ? next : "/";
    } catch {
      setError("Could not reach the server.");
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#0f172a",
        color: "#e2e8f0",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <form
        onSubmit={onSubmit}
        style={{
          width: 360,
          padding: 28,
          background: "#111827",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "#1f2937",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              fontWeight: 800,
              fontSize: 14,
              letterSpacing: 0.5,
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            G<span style={{ color: "#38bdf8" }}>•</span>G
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>
              Get ↓ Go ↑ Gone →
            </div>
            <div style={{ fontSize: 11.5, color: "#94a3b8" }}>
              Agency Command
            </div>
          </div>
        </div>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "#94a3b8",
            }}
          >
            ACCESS PASSWORD
          </span>
          <input
            type="password"
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "#0f172a",
              color: "#fff",
              fontSize: 13,
              outline: "none",
            }}
          />
        </label>

        {error && (
          <div
            style={{
              padding: "8px 10px",
              borderRadius: 8,
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.35)",
              color: "#fca5a5",
              fontSize: 12.5,
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !password}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "none",
            background:
              submitting || !password
                ? "rgba(59,130,246,0.4)"
                : "#3b82f6",
            color: "#fff",
            fontWeight: 600,
            fontSize: 13,
            cursor: submitting || !password ? "default" : "pointer",
          }}
        >
          {submitting ? "Checking…" : "Sign in"}
        </button>

        <div
          style={{
            fontSize: 11,
            color: "#64748b",
            textAlign: "center",
            paddingTop: 4,
          }}
        >
          Restricted access. Authorized operators only.
        </div>
      </form>
    </div>
  );
}
