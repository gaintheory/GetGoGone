import type { Json } from "@/lib/database.types";

/**
 * Narrow arbitrary parsed-JSON input to the `Json` type Supabase columns expect.
 *
 * Request bodies arrive as `unknown` / `Record<string, unknown>`, which TypeScript
 * will not assign to a `jsonb` column's `Json` type. The tempting fix is
 * `supabase as any`, which silences that one complaint by discarding type checking
 * for every column in the statement — including the ones you did get wrong.
 *
 * This does the narrowing honestly: it walks the value, keeps only JSON-representable
 * data, and drops anything else (functions, symbols, undefined, circular refs).
 * The result is safe to hand to a jsonb column with no cast at the call site.
 */
export function toJson(value: unknown): Json {
  return coerce(value, new WeakSet());
}

/** Same, but returns an empty object for anything that is not a JSON object. */
export function toJsonObject(value: unknown): Json {
  const coerced = coerce(value, new WeakSet());
  if (coerced === null || typeof coerced !== "object" || Array.isArray(coerced)) {
    return {};
  }
  return coerced;
}

function coerce(value: unknown, seen: WeakSet<object>): Json {
  if (value === null) return null;

  switch (typeof value) {
    case "string":
    case "boolean":
      return value;
    case "number":
      // NaN and ±Infinity are not valid JSON; JSON.stringify emits null for them.
      return Number.isFinite(value) ? value : null;
    case "object":
      break;
    default:
      // undefined, function, symbol, bigint
      return null;
  }

  const asObject = value as object;
  if (seen.has(asObject)) return null; // circular reference
  seen.add(asObject);

  try {
    if (Array.isArray(value)) {
      return value.map((entry) => coerce(entry, seen));
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    const out: { [key: string]: Json } = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      // Mirror JSON.stringify: keys whose values are undefined are omitted entirely.
      if (entry === undefined) continue;
      out[key] = coerce(entry, seen);
    }
    return out;
  } finally {
    seen.delete(asObject);
  }
}
