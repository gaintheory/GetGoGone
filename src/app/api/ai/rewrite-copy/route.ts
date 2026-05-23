import { NextResponse } from "next/server";

import { generateText, getAiStatus } from "@/lib/ai/ai-provider";

type RewritePayload = {
  headline?: string;
  body?: string;
  language?: string;
  channel?: {
    id?: string;
    name?: string;
    complianceNotes?: string[];
  };
  issues?: Array<{
    severity?: string;
    message?: string;
    suggestion?: string;
  }>;
};

function parseRewrite(text: string, fallback: { headline: string; body: string }) {
  const headlineMatch = text.match(/headline(?:\s*\([^)]+\))?\s*:\s*(.+)/i);
  const bodyMatch = text.match(/body(?:\s*\([^)]+\))?\s*:\s*([\s\S]+)/i);
  const headline = headlineMatch?.[1]?.split("\n")[0]?.trim() || fallback.headline;
  const body = (bodyMatch?.[1] || text)
    .replace(/^headline(?:\s*\([^)]+\))?\s*:.+$/gim, "")
    .replace(/^body(?:\s*\([^)]+\))?\s*:/gim, "")
    .trim();

  return {
    headline,
    body: body || fallback.body,
  };
}

function deterministicRewrite(input: { headline: string; body: string }) {
  const clean = (text: string) => text
    .replace(/guaranteed approval|100% approved|everyone approved|no credit check/gi, "financing options available")
    .replace(/\$0\s*down|zero down/gi, "down payment options available")
    .replace(/\b(?:weekly|monthly) payments?\b/gi, "financing options")
    .replace(/\$\d+[^\n.]{0,16}\/(?:wk|mo)/gi, "financing options")
    .replace(/(?:weekly|monthly)?\s*payments?\s+starting at\s+\$?x+/gi, "financing options available")
    .replace(/financing options starting at\s+\$?x+/gi, "financing options available")
    .replace(/\$x+/gi, "approved terms")
    .replace(/\bdrive (?:it|this|the|your|our).{0,80}home today\b/gi, "message us to check availability")
    .replace(/\btake (?:it|this|the|your|our).{0,80}home today\b/gi, "message us to check availability")
    .replace(/\bget behind the wheel\b/gi, "check availability")
    .replace(/\$?\[price\]/gi, "call for price")
    .replace(/\bdescuento\b/gi, "enganche")
    .replace(/\bbajada de precio\b/gi, "enganche")
    .replace(/\bdep[oó]sito\b/gi, "enganche")
    .trim();

  let headline = clean(input.headline);
  let body = clean(input.body);

  if (!/wac|subject to approval/i.test(body)) {
    body = `${body} WAC. Subject to approval of credit. Tax, title, license, and dealer fees may be additional.`;
  }

  return { headline, body };
}

export async function POST(request: Request) {
  let payload: RewritePayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON payload." }, { status: 400 });
  }

  const fallback = deterministicRewrite({
    headline: String(payload.headline || ""),
    body: String(payload.body || ""),
  });

  const status = await getAiStatus();
  if (!status.online) {
    return NextResponse.json({
      ok: true,
      provider: "rules",
      model: "deterministic",
      copy: fallback,
    });
  }

  const system = [
    "You rewrite used-car dealership ad copy so it can pass conservative compliance review.",
    "Return only:",
    "Headline: ...",
    "Body: ...",
    "Do not invent price, APR, weekly/monthly payments, terms, or approval promises.",
    "Do not say guaranteed approval, no credit check, zero down, drive home today, or take it home today.",
    "If price or down payment is missing, use call for price or down payment options available.",
    "For Spanish down payment wording, use enganche.",
    "Include WAC or subject-to-approval language for finance-related copy.",
  ].join("\n");
  const prompt = [
    `Channel: ${payload.channel?.name || payload.channel?.id || "campaign"}`,
    `Language: ${payload.language || "en"}`,
    `Channel rules: ${(payload.channel?.complianceNotes || []).join(", ") || "none"}`,
    "Compliance issues to fix:",
    ...(payload.issues || []).map(issue => `- ${issue.severity || "issue"}: ${issue.message || ""} ${issue.suggestion || ""}`),
    "",
    "Original headline:",
    payload.headline || "",
    "",
    "Original body:",
    payload.body || "",
  ].join("\n");

  try {
    const result = await generateText({ system, prompt, task: "compliance" });
    return NextResponse.json({
      ok: true,
      provider: result.provider,
      model: result.model,
      copy: deterministicRewrite(parseRewrite(result.text, fallback)),
      raw: result.text,
    });
  } catch {
    return NextResponse.json({
      ok: true,
      provider: "rules",
      model: "deterministic",
      copy: fallback,
    });
  }
}
