import { NextResponse } from "next/server";

import { generateText, getAiStatus } from "@/lib/ai/ai-provider";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { loadVehicleKnowledge } from "@/features/ai/knowledge-loader";

type GenerateCopyPayload = {
  clientId?: string;
  campaignId?: string;
  vehicle?: Record<string, unknown>;
  channel?: {
    id?: string;
    name?: string;
    category?: string;
    complianceNotes?: string[];
  };
  goal?: string;
  language?: string;
};

const defaultBrain = {
  toneEnglish: "friendly, direct, and helpful",
  toneSpanish: "respectful, clear, family-oriented, and natural for local Spanish-speaking buyers",
  approvedPhrases: [] as string[],
  bannedPhrases: ["guaranteed approval", "no credit check", "100% approved", "drive away free", "$0 down"],
  downPaymentRules: "Advertise approved down payment amounts only. If missing, use Low Down Payment or Down Payment Options Available.",
  financeDisclaimer: "WAC. Subject to approval of credit. Tax, title, license, and dealer fees may be additional.",
  spanishGuidance: "Prefer adaptation over literal translation.",
  targetAudienceNotes: "",
  objectionHandlingNotes: "",
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

async function resolveVehicleId(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  dealershipId: string | null,
  vehicle?: Record<string, unknown>,
) {
  const vin = typeof vehicle?.vin === "string" ? vehicle.vin.trim() : "";
  if (!dealershipId || !vin) return null;

  const { data, error } = await supabase
    .from("vehicles")
    .select("id")
    .eq("dealership_id", dealershipId)
    .eq("vin", vin)
    .maybeSingle();

  if (error) return null;
  return data?.id || null;
}

async function loadBrandBrain(clientId?: string | null) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return defaultBrain;

  const dealershipId = await resolveClientId(supabase, clientId);
  if (!dealershipId) return defaultBrain;

  const client = supabase as any;
  const { data, error } = await client
    .from("client_brand_brains")
    .select("*")
    .eq("dealership_id", dealershipId)
    .maybeSingle();

  if (error || !data) return defaultBrain;

  return {
    toneEnglish: data.tone_english || defaultBrain.toneEnglish,
    toneSpanish: data.tone_spanish || defaultBrain.toneSpanish,
    approvedPhrases: data.approved_phrases || [],
    bannedPhrases: data.banned_phrases || defaultBrain.bannedPhrases,
    downPaymentRules: data.down_payment_rules || defaultBrain.downPaymentRules,
    financeDisclaimer: data.finance_disclaimer || defaultBrain.financeDisclaimer,
    spanishGuidance: data.spanish_guidance || defaultBrain.spanishGuidance,
    targetAudienceNotes: data.target_audience_notes || "",
    objectionHandlingNotes: data.objection_handling_notes || "",
  };
}

function vehicleLabel(vehicle: Record<string, unknown>) {
  return [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(" ");
}

function parseAiOutput(text: string, fallback: ReturnType<typeof fallbackCopy>) {
  const headlineMatch = text.match(/headline(?:\s*\([^)]+\))?\s*:\s*(.+)/i);
  const bodyMatches = Array.from(text.matchAll(/body(?:\s*\([^)]+\))?\s*:\s*([\s\S]*?)(?=\n\s*headline(?:\s*\([^)]+\))?\s*:|$)/gi));
  const headline = headlineMatch?.[1]?.split("\n")[0]?.trim() || fallback.headline;
  const bodySource = bodyMatches.length
    ? bodyMatches.map(match => match[1]?.trim()).filter(Boolean).join("\n\n")
    : text;
  const body = bodySource
    .replace(/^headline(?:\s*\([^)]+\))?\s*:.+$/gim, "")
    .replace(/^body(?:\s*\([^)]+\))?\s*:/gim, "")
    .replace(/^copy(?:\s*\([^)]+\))?\s*:/gim, "")
    .trim();

  return {
    headline,
    body: body || fallback.body,
  };
}

function cleanComplianceRisk(text: string) {
  return text
    .replace(/\bdrive\s+((?:a|an|this|the|our|your)\s+[^.!?\n]{0,80}?)\s+today\b/gi, "ask about $1 today")
    .replace(/\bdrive\s+[^.!?\n]{0,80}?\s+home today\b/gi, "ask about availability today")
    .replace(/\bfinance your new (car|truck|vehicle) today!?/gi, "Ask about financing options on this $1 today.")
    .replace(/\bfinance your (car|truck|vehicle) today!?/gi, "Ask about financing options on this $1 today.")
    .replace(/\bnew truck\b/gi, "next truck")
    .replace(/\bnew car\b/gi, "next car")
    .replace(/\bnew vehicle\b/gi, "next vehicle")
    .replace(/\bstart driving your\b/gi, "ask about availability for this")
    .replace(/\bstart driving this\b/gi, "ask about availability for this")
    .replace(/\bstart making (?:weekly|monthly )?payments? today\b/gi, "ask about financing options today")
    .replace(/\bbegin making (?:weekly|monthly )?payments? today\b/gi, "ask about financing options today")
    .replace(/\btake it home today\b/gi, "ask about availability today")
    .replace(/\bdrive it home today\b/gi, "ask about availability today")
    .replace(/\bdescuento\b/gi, "enganche")
    .replace(/\bbajada de precio\b/gi, "enganche")
    .replace(/\bllev[aá]rtelo hoy\b/gi, "consulta disponibilidad hoy")
    .replace(/\bpuedes llevar[^.!?\n]{0,80}casa hoy(?: mismo)?\b/gi, "consulta disponibilidad hoy")
    .replace(/\bcomienza a hacer pagos hoy\b/gi, "consulta opciones de financiamiento")
    .replace(/\bempezar a conducir\b/gi, "consultar disponibilidad")
    .replace(/\bempieza a conducir\b/gi, "consulta disponibilidad")
    .trim();
}

function postProcessCopy(
  copy: { headline: string; body: string },
  fallback: ReturnType<typeof fallbackCopy>,
  financeDisclaimer = defaultBrain.financeDisclaimer,
) {
  const headline = cleanComplianceRisk(copy.headline) || fallback.headline;
  let body = cleanComplianceRisk(copy.body) || fallback.body;
  if (financeDisclaimer && !/subject to approval|wac/i.test(body)) {
    body = `${body} ${financeDisclaimer}`;
  }

  return {
    headline,
    body,
  };
}

async function saveGeneratedOutput(input: {
  clientId?: string;
  campaignId?: string;
  vehicle?: Record<string, unknown>;
  channel?: GenerateCopyPayload["channel"];
  goal?: string;
  language?: string;
  provider: string;
  model: string;
  copy: { headline: string; body: string };
  raw?: string;
  brandBrain: Awaited<ReturnType<typeof loadBrandBrain>>;
  offline?: boolean;
  warning?: string;
}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const dealershipId = await resolveClientId(supabase, input.clientId);
  if (!dealershipId) return null;
  const vehicleId = await resolveVehicleId(supabase, dealershipId, input.vehicle);
  const client = supabase as any;

  const { data, error } = await client
    .from("generated_outputs")
    .insert({
      dealership_id: dealershipId,
      vehicle_id: vehicleId,
      campaign_id: input.campaignId || null,
      target_type: "campaign_channel",
      target_id: input.channel?.id || null,
      task_type: "campaign_copy",
      provider: input.provider,
      model: input.model,
      language: input.language || "en",
      prompt_context: {
        vehicle: input.vehicle || {},
        channel: input.channel || {},
        goal: input.goal || null,
        brandBrain: input.brandBrain,
        offline: !!input.offline,
        warning: input.warning || null,
      },
      output: {
        headline: input.copy.headline,
        body: input.copy.body,
        raw: input.raw || null,
      },
      status: "draft",
      updated_at: new Date().toISOString(),
    })
    .select("id, provider, model, language, task_type, status, created_at")
    .single();

  if (error) return null;
  return data;
}

function fallbackCopy(payload: GenerateCopyPayload, brain = defaultBrain) {
  const vehicle = payload.vehicle || {};
  const down = Number(vehicle.down || 0);
  const downLabel = down > 0 ? `$${down.toLocaleString()} down` : "Down payment options available";
  const miles = Number(vehicle.mileage || 0);
  const mileageLabel = miles > 0 ? `${miles.toLocaleString()} miles` : "mileage available";
  const label = vehicleLabel(vehicle) || "this vehicle";
  const spanish = payload.language === "es";
  const both = payload.language === "both";

  const historyEng = "Free vehicle history report available upon request! ";
  const historyEsp = "¡Informe de historial de vehículo gratis disponible! ";

  if (spanish) {
    return {
      headline: `${label} - opciones de enganche`,
      body: `${label}. ${downLabel}. ${mileageLabel}. ${historyEsp}Hablamos Espanol. ${brain.financeDisclaimer}`,
    };
  }

  return {
    headline: both ? `${label} - English / Espanol` : `${label} - ${downLabel}`,
    body: `Take a look at ${label}. ${downLabel}. ${mileageLabel}. ${both ? historyEsp : historyEng}Message the lot to check availability. ${both ? "Hablamos Espanol. " : ""}${brain.financeDisclaimer}`,
  };
}

export async function POST(request: Request) {
  let payload: GenerateCopyPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON payload." }, { status: 400 });
  }

  const brain = await loadBrandBrain(payload.clientId);
  const fallback = fallbackCopy(payload, brain);
  const status = await getAiStatus();

  // Load brand-specific and compliance guides dynamically
  const make = typeof payload.vehicle?.make === "string" ? payload.vehicle.make : undefined;
  const knowledge = await loadVehicleKnowledge(make);

  if (!status.online) {
    const saved = await saveGeneratedOutput({
      ...payload,
      provider: "fallback",
      model: "rules",
      copy: fallback,
      brandBrain: brain,
      offline: true,
      warning: status.error || "Local AI is offline.",
    });

    return NextResponse.json({
      ok: true,
      provider: "fallback",
      model: "rules",
      offline: true,
      warning: status.error || "Local AI is offline.",
      copy: fallback,
      brandBrain: brain,
      generatedOutput: saved,
    });
  }

  const system = [
    "You write compliant used-car dealership marketing copy.",
    "Return only two fields:",
    "Headline: ...",
    "Body: ...",
    "Do not use banned phrases.",
    "Do not claim guaranteed approval.",
    "Do not invent monthly payments, weekly payments, APR, term length, approval terms, or payment schedules.",
    "Lead with approved down payment language when available.",
    "If down payment is missing or zero, use safe fallback language.",
    "Use financing options available language instead of saying buyers can start making payments today.",
    "Do not imply the buyer can drive away today; use availability or message-us language instead.",
    "For Spanish down payment language, use enganche. Do not translate down payment as descuento.",
    "If the vehicle includes a history report URL or history reports are noted as available, actively highlight 'Free vehicle history report available upon request!' or '¡Informe de historial de vehículo gratis disponible!' in the copywriting to build buyer trust.",
    "Leverage the provided BHPH framework, compliance guidelines, and brand-specific model knowledge to write highly accurate, compelling, and compliant copy.",
  ].join("\n");

  const prompt = [
    `Vehicle: ${JSON.stringify(payload.vehicle || {})}`,
    `Channel: ${payload.channel?.name || payload.channel?.id || "campaign"}`,
    `Goal: ${payload.goal || "finance"}`,
    `Language: ${payload.language || "en"}`,
    `English tone: ${brain.toneEnglish}`,
    `Spanish tone: ${brain.toneSpanish}`,
    `Spanish guidance: ${brain.spanishGuidance}`,
    `Approved phrases: ${brain.approvedPhrases.join(", ") || "none"}`,
    `Banned phrases: ${brain.bannedPhrases.join(", ")}`,
    `Down payment rules: ${brain.downPaymentRules}`,
    `Finance disclaimer: ${brain.financeDisclaimer}`,
    `Audience notes: ${brain.targetAudienceNotes || "none"}`,
    `Objection notes: ${brain.objectionHandlingNotes || "none"}`,
    `Channel compliance notes: ${(payload.channel?.complianceNotes || []).join(", ") || "none"}`,
    `BHPH Copy Framework:\n${knowledge.bhphFramework || "none"}`,
    `BHPH Compliance Guidelines:\n${knowledge.complianceGuide || "none"}`,
    `Brand-Specific Model Knowledge:\n${knowledge.brandKnowledge || "none"}`,
  ].join("\n");

  try {
    const task = payload.language === "es" || payload.language === "both" ? "spanish" : "copywriter";
    const result = await generateText({ system, prompt, task });
    const copy = postProcessCopy(parseAiOutput(result.text, fallback), fallback, brain.financeDisclaimer);
    const saved = await saveGeneratedOutput({
      ...payload,
      provider: result.provider,
      model: result.model,
      copy,
      raw: result.text,
      brandBrain: brain,
    });

    return NextResponse.json({
      ok: true,
      provider: result.provider,
      model: result.model,
      copy,
      raw: result.text,
      brandBrain: brain,
      generatedOutput: saved,
    });
  } catch (error) {
    const warning = error instanceof Error ? error.message : "AI generation failed.";
    const saved = await saveGeneratedOutput({
      ...payload,
      provider: "fallback",
      model: "rules",
      copy: fallback,
      brandBrain: brain,
      offline: true,
      warning,
    });

    return NextResponse.json({
      ok: true,
      provider: "fallback",
      model: "rules",
      offline: true,
      warning,
      copy: fallback,
      brandBrain: brain,
      generatedOutput: saved,
    });
  }
}
