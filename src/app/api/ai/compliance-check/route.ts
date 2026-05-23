import { NextResponse } from "next/server";

import { generateText, getAiStatus } from "@/lib/ai/ai-provider";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const defaultBrain = {
  bannedPhrases: ["guaranteed approval", "no credit check", "100% approved", "drive away free", "$0 down"],
  downPaymentRules: "Advertise approved down payment amounts only. If missing, use Low Down Payment or Down Payment Options Available.",
  financeDisclaimer: "WAC. Subject to approval of credit. Tax, title, license, and dealer fees may be additional.",
  spanishGuidance: "Prefer adaptation over literal translation.",
};

type CompliancePayload = {
  clientId?: string;
  outputId?: string;
  headline?: string;
  body?: string;
  language?: string;
  channel?: {
    id?: string;
    name?: string;
    complianceNotes?: string[];
  };
};

type ComplianceIssue = {
  severity: "blocker" | "warning" | "note";
  message: string;
  suggestion: string;
  matches?: ComplianceMatch[];
};

type ComplianceMatch = {
  text: string;
  source: "headline" | "body" | "combined";
  start: number;
  end: number;
};

async function resolveClientId(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  clientId?: string | null,
) {
  if (clientId && clientId !== "agency_overview") return clientId;

  const { data, error } = await supabase
    .from("dealerships")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.id || null;
}

async function loadBrandBrain(clientId?: string | null) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return defaultBrain;

  const dealershipId = await resolveClientId(supabase, clientId);
  if (!dealershipId) return defaultBrain;

  const { data, error } = await (supabase as any)
    .from("client_brand_brains")
    .select("banned_phrases, down_payment_rules, finance_disclaimer, spanish_guidance")
    .eq("dealership_id", dealershipId)
    .maybeSingle();

  if (error || !data) return defaultBrain;

  return {
    bannedPhrases: data.banned_phrases || defaultBrain.bannedPhrases,
    downPaymentRules: data.down_payment_rules || defaultBrain.downPaymentRules,
    financeDisclaimer: data.finance_disclaimer || defaultBrain.financeDisclaimer,
    spanishGuidance: data.spanish_guidance || defaultBrain.spanishGuidance,
  };
}

function deterministicIssues(headline: string, body: string, brain: Awaited<ReturnType<typeof loadBrandBrain>>) {
  const issues: ComplianceIssue[] = [];
  const bannedPhrases = brain.bannedPhrases || [];
  const text = [headline, body].filter(Boolean).join("\n\n");

  for (const phrase of bannedPhrases) {
    const matches = phrase ? findLiteralMatches(headline, body, String(phrase)) : [];
    if (matches.length) {
      issues.push({
        severity: "blocker",
        message: `Contains banned phrase: ${phrase}`,
        suggestion: "Remove the phrase or replace it with approval-safe financing language.",
        matches,
      });
    }
  }

  const checks: Array<[RegExp, Omit<ComplianceIssue, "matches">]> = [
    [/guaranteed approval|100% approved|everyone approved|no credit check/i, {
      severity: "blocker",
      message: "Approval language is too strong.",
      suggestion: "Use subject-to-approval or financing-options-available wording.",
    }],
    [/\$0\s*down|zero down/i, {
      severity: "blocker",
      message: "Zero-down claim detected.",
      suggestion: "Only advertise zero down when explicitly approved; otherwise use down payment options available.",
    }],
    [/monthly payment|weekly payment|\$\d+[^\n.]{0,16}\/(?:wk|mo)/i, {
      severity: "warning",
      message: "Payment amount or schedule detected.",
      suggestion: "Remove weekly/monthly payment claims unless exact approved terms are available.",
    }],
    [/drive (?:it|this|the|your|our).{0,80}home today|take (?:it|this|the|your|our).{0,80}home today/i, {
      severity: "warning",
      message: "Drive-away-today language detected.",
      suggestion: "Use message us, check availability, or apply online language.",
    }],
    [/descuento|bajada de precio/i, {
      severity: "warning",
      message: "Spanish down payment may be translated incorrectly.",
      suggestion: "Use enganche for down payment in Spanish copy.",
    }],
    [/aprobaci[oó]n garantizada|100% aprobado|todos aprobados|sin revisar cr[eé]dito|sin chequeo de cr[eé]dito/i, {
      severity: "blocker",
      message: "Spanish approval language is too strong.",
      suggestion: "Use sujeto a aprobación or opciones de financiamiento wording.",
    }],
    [/\$0\s*(?:de\s*)?enganche|cero\s*(?:de\s*)?enganche|sin enganche/i, {
      severity: "blocker",
      message: "Spanish zero-down claim detected.",
      suggestion: "Only advertise zero down when explicitly approved; otherwise use opciones de enganche disponibles.",
    }],
    [/maneja(?:lo|la)? hoy|ll[eé]vatelo hoy|sal manejando hoy/i, {
      severity: "warning",
      message: "Spanish drive-away-today language detected.",
      suggestion: "Use consulta disponibilidad or comunícate para más detalles.",
    }],
    [/finance your/i, {
      severity: "warning",
      message: "Banned phrase 'Finance Your' is used.",
      suggestion: "Replace with a more neutral term such as 'Explore Financing Options for'.",
    }],
    [/get started on your path to ownership today/i, {
      severity: "note",
      message: "The phrase 'get started on your path to ownership today' could be improved for clarity and conciseness.",
      suggestion: "Simplify to 'Take the next step toward ownership.'",
    }],
  ];

  for (const [pattern, issue] of checks) {
    const matches = findRegexMatches(headline, body, pattern);
    if (matches.length) issues.push({ ...issue, matches });
  }

  if (/financ|credit|approval|apply|enganche|down payment/i.test(text) && !/wac|subject to approval/i.test(text)) {
    issues.push({
      severity: "warning",
      message: "Finance copy is missing approval disclaimer language.",
      suggestion: brain.financeDisclaimer || defaultBrain.financeDisclaimer,
    });
  }

  return dedupeIssues(issues);
}

function findLiteralMatches(headline: string, body: string, phrase: string): ComplianceMatch[] {
  return [
    ...findInSource(headline, phrase, "headline"),
    ...findInSource(body, phrase, "body"),
  ];
}

function findRegexMatches(headline: string, body: string, pattern: RegExp): ComplianceMatch[] {
  return [
    ...findRegexInSource(headline, pattern, "headline"),
    ...findRegexInSource(body, pattern, "body"),
  ];
}

function findInSource(value: string, phrase: string, source: "headline" | "body") {
  const matches: ComplianceMatch[] = [];
  const haystack = value.toLowerCase();
  const needle = phrase.toLowerCase();
  let index = haystack.indexOf(needle);

  while (index >= 0) {
    matches.push({
      text: value.slice(index, index + phrase.length),
      source,
      start: index,
      end: index + phrase.length,
    });
    index = haystack.indexOf(needle, index + Math.max(needle.length, 1));
  }

  return matches;
}

function findRegexInSource(value: string, pattern: RegExp, source: "headline" | "body") {
  const matches: ComplianceMatch[] = [];
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  const regex = new RegExp(pattern.source, flags);
  let match: RegExpExecArray | null;

  while ((match = regex.exec(value)) !== null) {
    const text = match[0];
    matches.push({
      text,
      source,
      start: match.index,
      end: match.index + text.length,
    });
    if (text.length === 0) regex.lastIndex += 1;
  }

  return matches;
}

function dedupeIssues(issues: ComplianceIssue[]) {
  const seen = new Set<string>();
  return issues.filter(issue => {
    const key = `${issue.severity}:${issue.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function verdictFromIssues(issues: ComplianceIssue[]) {
  if (issues.some(issue => issue.severity === "blocker")) return "fail";
  if (issues.some(issue => issue.severity === "warning")) return "needs_review";
  return "pass";
}

function parseModelIssues(text: string) {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return [];

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed.issues)) return [];
    return parsed.issues
      .map((issue: any) => ({
        severity: ["blocker", "warning", "note"].includes(issue.severity) ? issue.severity : "note",
        message: String(issue.message || "").trim(),
        suggestion: String(issue.suggestion || "").trim(),
      }))
      .filter((issue: ComplianceIssue) => issue.message);
  } catch {
    return [];
  }
}

export async function POST(request: Request) {
  let payload: CompliancePayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON payload." }, { status: 400 });
  }

  const headline = String(payload.headline || "").trim();
  const body = String(payload.body || "").trim();
  const text = [headline, body].filter(Boolean).join("\n\n");

  if (!text) {
    return NextResponse.json({ ok: false, error: "Headline or body is required." }, { status: 400 });
  }

  const brain = await loadBrandBrain(payload.clientId);
  const ruleIssues = deterministicIssues(headline, body, brain);
  const status = await getAiStatus();
  let modelIssues: ComplianceIssue[] = [];
  let provider = "rules";
  let model = "deterministic";
  let raw: string | null = null;

  if (status.online) {
    const system = [
      "You are a conservative compliance reviewer for used-car dealership advertising.",
      "Return strict JSON only with this shape:",
      '{"issues":[{"severity":"blocker|warning|note","message":"...","suggestion":"..."}]}',
      "Do not approve guaranteed approval, zero-down, invented payment schedules, misleading Spanish finance language, or missing finance disclaimers.",
    ].join("\n");
    const prompt = [
      `Channel: ${payload.channel?.name || payload.channel?.id || "unknown"}`,
      `Language: ${payload.language || "unknown"}`,
      `Banned phrases: ${(brain.bannedPhrases || []).join(", ")}`,
      `Down payment rules: ${brain.downPaymentRules}`,
      `Finance disclaimer: ${brain.financeDisclaimer}`,
      `Spanish guidance: ${brain.spanishGuidance}`,
      `Channel rules: ${(payload.channel?.complianceNotes || []).join(", ") || "none"}`,
      "",
      "COPY TO REVIEW:",
      text,
    ].join("\n");

    try {
      const result = await generateText({ system, prompt, task: "compliance" });
      provider = result.provider;
      model = result.model;
      raw = result.text;
      modelIssues = parseModelIssues(result.text);
    } catch {
      provider = "rules";
      model = "deterministic";
    }
  }

  const issues = dedupeIssues([...ruleIssues, ...modelIssues]);
  const review = {
    verdict: verdictFromIssues(issues),
    issues,
    provider,
    model,
    checked_at: new Date().toISOString(),
    raw,
  };

  return NextResponse.json({ ok: true, review });
}
