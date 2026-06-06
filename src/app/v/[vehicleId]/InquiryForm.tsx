"use client";

import React from "react";

type Props = {
  vehicleId: string;
  vehicleTitle: string;
  sourceChannel: string | null;
  campaignId: string | null;
  campaignChannelId: string | null;
  utm: Record<string, string | null>;
};

export default function InquiryForm({
  vehicleId,
  vehicleTitle,
  sourceChannel,
  campaignId,
  campaignChannelId,
  utm,
}: Props) {
  const [fullName, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [message, setMessage] = React.useState(`I'm interested in the ${vehicleTitle}.`);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!fullName.trim()) { setError("Please enter your name."); return; }
    if (!phone.trim() && !email.trim()) { setError("Please enter a phone or email."); return; }

    setSubmitting(true);
    try {
      const response = await fetch("/api/leads/inbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId,
          fullName,
          phone,
          email,
          message,
          sourceChannel,
          campaignId,
          campaignChannelId,
          utm,
          inboundUrl: typeof window !== "undefined" ? window.location.href : null,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.ok) {
        setError(result?.error || "Could not submit. Please try again.");
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ padding: "12px 14px", borderRadius: 8, background: "#dcfce7", border: "1px solid #86efac", color: "#166534" }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>Thanks — got it.</div>
        <div style={{ fontSize: 12.5 }}>We&apos;ll be in touch shortly about the {vehicleTitle}.</div>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    fontSize: 13,
    outline: "none",
    background: "#fff",
    color: "#0f172a",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 5,
  };

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <label style={labelStyle}>Name</label>
        <input style={inputStyle} value={fullName} onChange={e => setFullName(e.target.value)} autoComplete="name" required/>
      </div>
      <div>
        <label style={labelStyle}>Phone</label>
        <input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} type="tel" autoComplete="tel" inputMode="tel"/>
      </div>
      <div>
        <label style={labelStyle}>Email</label>
        <input style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} type="email" autoComplete="email"/>
      </div>
      <div>
        <label style={labelStyle}>Message (optional)</label>
        <textarea
          style={{ ...inputStyle, minHeight: 80, fontFamily: "inherit", resize: "vertical" }}
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={3}
        />
      </div>

      {error && (
        <div style={{ padding: "8px 10px", borderRadius: 8, background: "#fee2e2", border: "1px solid #fecaca", color: "#991b1b", fontSize: 12.5 }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        style={{
          padding: "11px 14px",
          borderRadius: 8,
          border: "none",
          background: submitting ? "#93c5fd" : "#2563eb",
          color: "#fff",
          fontWeight: 600,
          fontSize: 13,
          cursor: submitting ? "default" : "pointer",
        }}
      >
        {submitting ? "Sending…" : "Check availability"}
      </button>

      <div style={{ fontSize: 11, color: "#94a3b8", textAlign: "center" }}>
        We&apos;ll never share your contact info.
      </div>
    </form>
  );
}
