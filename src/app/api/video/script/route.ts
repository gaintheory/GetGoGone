import { NextResponse } from "next/server";
import { generateText, getAiStatus } from "@/lib/ai/ai-provider";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { loadVehicleKnowledge } from "@/features/ai/knowledge-loader";

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

async function resolveClientId(supabase: any, clientId?: string | null) {
  if (clientId && clientId !== "agency_overview") return clientId;
  const { data, error } = await supabase
    .from("dealerships")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
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

function fallbackScript(vehicle: any, goal: string, duration: number, language: string) {
  const isEs = language === "es";
  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  
  if (isEs) {
    return {
      title: `Promo de ${title}`,
      hook: `¿Buscas un vehículo confiable y accesible? ¡Mira este excelente ${title}!`,
      body: `Con solo ${vehicle.mileage ? vehicle.mileage.toLocaleString() : "pocas"} millas, este ${vehicle.make} viene completamente equipado. Cuenta con un motor de alto rendimiento, interior sumamente cómodo y toda la durabilidad que necesitas para el día a día. Ideal para la familia o el trabajo diario. Consulta nuestras opciones de enganche flexible hoy mismo.`,
      disclaimer: "WAC. Sujeto a aprobación de crédito. Tarifas e impuestos pueden ser adicionales.",
    };
  }

  return {
    title: `${title} Commercial Spot`,
    hook: `Looking for a reliable, clean ride that fits your budget? Check out this ${title}!`,
    body: `With only ${vehicle.mileage ? vehicle.mileage.toLocaleString() : "low"} miles, this ${vehicle.make} is ready to roll. Features a powerful yet efficient engine, spacious premium cabin, and modern tech details. Perfect for daily commutes or weekend trips. Ask about our low down payment options and custom finance programs today!`,
    disclaimer: "WAC. Subject to credit approval. Tax, title, and dealer fees extra.",
  };
}

export async function POST(request: Request) {
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { clientId, vehicle, goal = "finance", duration = 30, language = "en" } = body;

  if (!vehicle) {
    return NextResponse.json({ error: "Missing required property: vehicle." }, { status: 400 });
  }

  const brandBrain = await loadBrandBrain(clientId);
  const status = await getAiStatus();
  const vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

  if (!status.online) {
    console.log("Local AI offline. Serving high-quality deterministic video script.");
    const script = fallbackScript(vehicle, goal, duration, language);
    return NextResponse.json({
      ok: true,
      script,
      provider: "system",
      model: "deterministic-fallback",
      offline: true,
    });
  }

  try {
    // Load local knowledge base markdown for this brand
    const knowledge = await loadVehicleKnowledge(vehicle.make);

    const systemInstruction = `You are a professional automotive advertising video writer.
You write highly engaging, high-converting video scripts for buy-here-pay-here (BHPH) used car dealerships.
Your scripts are timed precisely for a ${duration}-second commercial spot.

STRICT COMPLIANCE RULES:
1. NEVER use banned phrases: ${brandBrain.bannedPhrases.join(", ")}.
2. Do NOT promise guaranteed approval or claim "no credit check".
3. Use subject-to-approval phrasing for any finance options.
4. Down payment rules: ${brandBrain.downPaymentRules}
5. Finance disclaimer to append: "${brandBrain.financeDisclaimer}"
6. Tone to use: ${language === "es" ? brandBrain.toneSpanish : brandBrain.toneEnglish}

OUTPUT FORMAT:
Provide the script structured EXACTLY into three labeled lines:
HOOK: [A compelling 3-5 second opening hook to grab local buyers' attention]
BODY: [A smooth, descriptive walkaround and spec callout fitting the remaining time]
DISCLAIMER: [The required compliance disclaimer]`;

    const prompt = `Write a ${duration}-second video commercial script for the following vehicle:
Vehicle: ${vehicleName}
Trim: ${vehicle.trim || "Standard"}
Mileage: ${vehicle.mileage ? vehicle.mileage.toLocaleString() + " miles" : "Low miles"}
Drivetrain: ${vehicle.drivetrain || "FWD"}
Engine: ${vehicle.engine || "Standard"}
Specs/Overview: ${vehicle.description || ""}

Brand Brain Specifications:
- Tone: ${language === "es" ? brandBrain.toneSpanish : brandBrain.toneEnglish}
- Video Goal focus: ${goal} (e.g. promoting financing, fresh arrivals, calls/messages, Spanish community)
- Target Language: ${language === "es" ? "Spanish" : "English"}

${knowledge ? `Brand Knowledge Base Context:\n${knowledge}` : ""}

Ensure the script reads naturally and fits the ${duration} seconds limit perfectly when spoken aloud at a normal pace.`;

    console.log(`Generating video script via Local AI for ${vehicleName} (${duration}s, ${language})...`);
    const aiResult = await generateText({
      system: systemInstruction,
      prompt,
      task: language === "es" ? "spanish" : "copywriter",
    });

    const text = aiResult.text;
    const hookMatch = text.match(/HOOK\s*:\s*(.+)/i);
    const bodyMatch = text.match(/BODY\s*:\s*([\s\S]+?)(?=\n\s*DISCLAIMER\s*:|$)/i);
    const disclaimerMatch = text.match(/DISCLAIMER\s*:\s*(.+)/i);

    const hook = hookMatch?.[1]?.trim() || fallbackScript(vehicle, goal, duration, language).hook;
    const bodyText = bodyMatch?.[1]?.trim() || fallbackScript(vehicle, goal, duration, language).body;
    const disclaimer = disclaimerMatch?.[1]?.trim() || brandBrain.financeDisclaimer;

    return NextResponse.json({
      ok: true,
      script: {
        title: `${vehicleName} - ${duration}s Spot`,
        hook,
        body: bodyText,
        disclaimer,
      },
      provider: aiResult.provider,
      model: aiResult.model,
      offline: false,
    });

  } catch (err) {
    console.error("Local AI video script generation failed:", err);
    const script = fallbackScript(vehicle, goal, duration, language);
    return NextResponse.json({
      ok: true,
      script,
      provider: "system",
      model: "error-fallback",
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
