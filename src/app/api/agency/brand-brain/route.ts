import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { ensureDealershipId } from "@/lib/dealerships";

type BrandBrainPayload = {
  clientId?: string;
  toneEnglish?: string;
  toneSpanish?: string;
  approvedPhrases?: string[];
  bannedPhrases?: string[];
  downPaymentRules?: string;
  financeDisclaimer?: string;
  spanishGuidance?: string;
  targetAudienceNotes?: string | null;
  objectionHandlingNotes?: string | null;
  platformRules?: Record<string, unknown>;
};

const defaultBrain = {
  tone_english: "friendly, direct, and helpful",
  tone_spanish: "respectful, clear, family-oriented, and natural for local Spanish-speaking buyers",
  approved_phrases: [],
  banned_phrases: ["guaranteed approval", "no credit check", "100% approved", "drive away free", "$0 down"],
  down_payment_rules: "Advertise approved down payment amounts only. If an amount is missing or unapproved, use safe language such as Low Down Payment or Down Payment Options Available.",
  finance_disclaimer: "WAC. Subject to approval of credit. Tax, title, license, and dealer fees may be additional.",
  spanish_guidance: "Prefer adaptation over literal translation. Keep wording clear, respectful, and easy to understand.",
  target_audience_notes: "",
  objection_handling_notes: "",
  platform_rules: {},
};

function toClientShape(row: Record<string, unknown>) {
  return {
    id: row.id,
    clientId: row.dealership_id,
    toneEnglish: row.tone_english,
    toneSpanish: row.tone_spanish,
    approvedPhrases: row.approved_phrases || [],
    bannedPhrases: row.banned_phrases || [],
    downPaymentRules: row.down_payment_rules,
    financeDisclaimer: row.finance_disclaimer,
    spanishGuidance: row.spanish_guidance,
    targetAudienceNotes: row.target_audience_notes || "",
    objectionHandlingNotes: row.objection_handling_notes || "",
    platformRules: row.platform_rules || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function ensureBrandBrain(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  dealershipId: string,
) {
  const client = supabase as any;
  const { data: existing, error: selectError } = await client
    .from("client_brand_brains")
    .select("*")
    .eq("dealership_id", dealershipId)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return existing;

  const { data: created, error: insertError } = await client
    .from("client_brand_brains")
    .insert({
      dealership_id: dealershipId,
      ...defaultBrain,
    })
    .select("*")
    .single();

  if (insertError) throw insertError;
  return created;
}

export async function GET(request: Request) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase environment variables are not configured." },
      { status: 500 },
    );
  }

  try {
    const clientId = new URL(request.url).searchParams.get("clientId");
    const dealershipId = await ensureDealershipId(supabase, clientId);
    const brain = await ensureBrandBrain(supabase, dealershipId);

    return NextResponse.json({ ok: true, brain: toClientShape(brain) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load Brand Brain.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase environment variables are not configured." },
      { status: 500 },
    );
  }

  let payload: BrandBrainPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON payload." }, { status: 400 });
  }

  try {
    const dealershipId = await ensureDealershipId(supabase, payload.clientId);
    await ensureBrandBrain(supabase, dealershipId);

    const client = supabase as any;
    const { data, error } = await client
      .from("client_brand_brains")
      .update({
        tone_english: payload.toneEnglish || defaultBrain.tone_english,
        tone_spanish: payload.toneSpanish || defaultBrain.tone_spanish,
        approved_phrases: payload.approvedPhrases || [],
        banned_phrases: payload.bannedPhrases || defaultBrain.banned_phrases,
        down_payment_rules: payload.downPaymentRules || defaultBrain.down_payment_rules,
        finance_disclaimer: payload.financeDisclaimer || defaultBrain.finance_disclaimer,
        spanish_guidance: payload.spanishGuidance || defaultBrain.spanish_guidance,
        target_audience_notes: payload.targetAudienceNotes || "",
        objection_handling_notes: payload.objectionHandlingNotes || "",
        platform_rules: payload.platformRules || {},
        updated_at: new Date().toISOString(),
      })
      .eq("dealership_id", dealershipId)
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, brain: toClientShape(data) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save Brand Brain.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
