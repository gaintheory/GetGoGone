/**
 * Tiny signed-cookie helper for the site-wide password gate.
 *
 * Cookie value format: `<issued-at-ms>.<signature>`
 *  - issued-at-ms is a base-10 unix timestamp in milliseconds
 *  - signature is HMAC-SHA256 of the issued-at-ms string, keyed by
 *    process.env.SITE_AUTH_COOKIE_SECRET, hex-encoded
 *
 * Implemented against the Web Crypto API so the same module works in both
 * Node (API routes) and Edge (middleware).
 */

export const COOKIE_NAME = "ggg_auth";
export const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSecret(): string {
  const secret = process.env.SITE_AUTH_COOKIE_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SITE_AUTH_COOKIE_SECRET is missing or too short. Set it in .env.local."
    );
  }
  return secret;
}

const encoder = new TextEncoder();

function bytesToHex(bytes: ArrayBuffer): string {
  const view = new Uint8Array(bytes);
  let out = "";
  for (let i = 0; i < view.length; i++) {
    out += view[i].toString(16).padStart(2, "0");
  }
  return out;
}

function hexToBytes(hex: string): Uint8Array | null {
  if (hex.length % 2 !== 0) return null;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    const byte = parseInt(hex.slice(i, i + 2), 16);
    if (Number.isNaN(byte)) return null;
    out[i / 2] = byte;
  }
  return out;
}

async function importKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function sign(payload: string): Promise<string> {
  const key = await importKey();
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return bytesToHex(signature);
}

async function verifySignature(payload: string, providedHex: string): Promise<boolean> {
  const provided = hexToBytes(providedHex);
  if (!provided) return false;
  const key = await importKey();
  // Re-compute the expected signature and constant-time compare. Using verify()
  // directly tripped on TS Uint8Array typing nuances in some toolchain combos.
  const expected = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(payload)));
  if (expected.length !== provided.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected[i] ^ provided[i];
  return diff === 0;
}

export async function issueCookieValue(now: number = Date.now()): Promise<string> {
  const issuedAt = String(now);
  const signature = await sign(issuedAt);
  return `${issuedAt}.${signature}`;
}

export async function verifyCookieValue(value: string | undefined | null): Promise<boolean> {
  if (!value) return false;
  const dot = value.indexOf(".");
  if (dot <= 0 || dot === value.length - 1) return false;

  const issuedAt = value.slice(0, dot);
  const providedSignature = value.slice(dot + 1);

  if (!/^\d+$/.test(issuedAt)) return false;

  const ok = await verifySignature(issuedAt, providedSignature);
  if (!ok) return false;

  const issuedAtMs = Number(issuedAt);
  const ageSeconds = (Date.now() - issuedAtMs) / 1000;
  if (ageSeconds < 0) return false;
  if (ageSeconds > COOKIE_MAX_AGE_SECONDS) return false;

  return true;
}
