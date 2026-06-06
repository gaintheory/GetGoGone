import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

type Supabase = SupabaseClient<Database>;

export type BrandBrain = {
  toneEnglish: string;
  toneSpanish: string;
  approvedPhrases: string[];
  bannedPhrases: string[];
  downPaymentRules: string;
  financeDisclaimer: string;
  spanishGuidance: string;
  targetAudienceNotes: string;
  objectionHandlingNotes: string;
};

export const defaultBrandBrain: BrandBrain = {
  toneEnglish: "friendly, direct, and helpful",
  toneSpanish: "respectful, clear, family-oriented, and natural for local Spanish-speaking buyers",
  approvedPhrases: [],
  bannedPhrases: ["guaranteed approval", "no credit check", "100% approved", "drive away free", "$0 down"],
  downPaymentRules: "Advertise approved down payment amounts only. If missing, use Low Down Payment or Down Payment Options Available.",
  financeDisclaimer: "WAC. Subject to approval of credit. Tax, title, license, and dealer fees may be additional.",
  spanishGuidance: "Prefer adaptation over literal translation.",
  targetAudienceNotes: "",
  objectionHandlingNotes: "",
};

/**
 * Load the per-dealership brand brain from `client_brand_brains`.
 * Falls back to `defaultBrandBrain` if the row is missing, supabase
 * isn't configured, or the table read errors out.
 */
export async function loadBrandBrain(
  supabase: Supabase | null,
  dealershipId: string | null,
): Promise<BrandBrain> {
  if (!supabase || !dealershipId) return defaultBrandBrain;

  const client = supabase as any;
  const { data, error } = await client
    .from("client_brand_brains")
    .select("*")
    .eq("dealership_id", dealershipId)
    .maybeSingle();

  if (error || !data) return defaultBrandBrain;

  return {
    toneEnglish: data.tone_english || defaultBrandBrain.toneEnglish,
    toneSpanish: data.tone_spanish || defaultBrandBrain.toneSpanish,
    approvedPhrases: data.approved_phrases || [],
    bannedPhrases: data.banned_phrases || defaultBrandBrain.bannedPhrases,
    downPaymentRules: data.down_payment_rules || defaultBrandBrain.downPaymentRules,
    financeDisclaimer: data.finance_disclaimer || defaultBrandBrain.financeDisclaimer,
    spanishGuidance: data.spanish_guidance || defaultBrandBrain.spanishGuidance,
    targetAudienceNotes: data.target_audience_notes || "",
    objectionHandlingNotes: data.objection_handling_notes || "",
  };
}

/**
 * Sanitize generated copy for known FTC / compliance risks. Replaces
 * "drive away today" / "take it home today" style phrases with availability-
 * oriented language. Same applies to Spanish equivalents.
 *
 * This is purely a regex pass — safe to apply to any text.
 */
export function cleanComplianceRisk(text: string): string {
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
