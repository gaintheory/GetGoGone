import { NextResponse } from "next/server";
import { generateText, getAiStatus } from "@/lib/ai/ai-provider";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const defaultBrain = {
  toneEnglish: "friendly, direct, and helpful",
  toneSpanish: "respectful, clear, family-oriented, and natural for local Spanish-speaking buyers",
  approvedPhrases: [] as string[],
  bannedPhrases: ["guaranteed approval", "no credit check", "100% approved", "drive away free", "$0 down"],
  downPaymentRules: "Advertise approved down payment amounts only. If missing, use Low Down Payment or Down Payment Options Available.",
  financeDisclaimer: "WAC. Subject to approval of credit. Tax, title, license, and dealer fees may be additional.",
  spanishGuidance: "Prefer adaptation over literal translation.",
  targetAudienceNotes: "",
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

async function loadBrandBrain(supabase: any, dealershipId: string | null) {
  if (!dealershipId) return defaultBrain;
  const { data, error } = await supabase
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

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin();
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { clientId, vehicle, channel, templateId, timing, targetLanguage } = body;
  const isSms = channel === "sms";
  const language = targetLanguage || "en";

  const vYear = vehicle?.year || "2016";
  const vMake = vehicle?.make || "Chevrolet";
  const vModel = vehicle?.model || "Malibu";
  const vName = `${vYear} ${vMake} ${vModel}`;
  const vPrice = vehicle?.price ? `$${vehicle.price.toLocaleString()}` : "$11,995";
  const vDown = vehicle?.down ? `$${vehicle.down.toLocaleString()}` : "$1,500";
  const vTime = "Tue 5:30pm";

  try {
    const finalDealershipId = supabase ? await resolveClientId(supabase, clientId) : null;
    const brain = supabase ? await loadBrandBrain(supabase, finalDealershipId) : defaultBrain;

    // Setup fallback copies in case Ollama is offline or experiences errors
    const fallbackCopy = isSms
      ? (language === "es"
          ? `Hola {first_name}, acabamos de recibir un ${vName} en el lote. Con un enganche de solo ${vDown}! Consultar disponibilidad: ${vPrice}. — Wabash Auto`
          : `Hi {first_name}, we just got a ${vName} on the lot. Down payment of only ${vDown}! Ask about availability: ${vPrice}. — Wabash Auto`)
      : (language === "es"
          ? {
              subject: `¡Recién Llegado!: ${vName} en Wabash Auto`,
              body: `Hola {first_name},\n\nAcabamos de recibir un excelente ${vName} con un enganche bajo de solo ${vDown}. El precio completo es ${vPrice}.\n\nFinanciamiento disponible. Consulta disponibilidad hoy.\n\n— Wabash Auto`,
            }
          : {
              subject: `Fresh Arrival: ${vName} at Wabash Auto`,
              body: `Hi {first_name},\n\nWe just received a clean ${vName} with a low down payment option of only ${vDown}. The full price is ${vPrice}.\n\nFinancing available. Ask about availability today.\n\n— Wabash Auto`,
            });

    const activeStatus = await getAiStatus();
    if (!activeStatus.online) {
      // Offline fallback
      return NextResponse.json({
        ok: true,
        copy: fallbackCopy,
        provider: "deterministic_fallback",
        model: "fallback_rules",
      });
    }

    const tone = language === "es" ? brain.toneSpanish : brain.toneEnglish;
    const bannedStr = brain.bannedPhrases.join(", ");
    const approvedStr = brain.approvedPhrases.join(", ");

    const systemPrompt = `You are a compliance-first automotive advertising copywriter.
You are writing a short ${isSms ? "SMS text message" : "Email campaign"} to warm leads about a vehicle: ${vName}.
Goal/Style: ${templateId || "fresh"}
Dealership: Wabash Auto
Target Tone: ${tone}
Banned Phrases (NEVER use these): ${bannedStr}
Approved Phrases: ${approvedStr}
Down Payment Rules: ${brain.downPaymentRules}
Bilingual guidelines: Write exclusively in the requested language: ${language === "es" ? "Spanish" : "English"}.

Rules:
${isSms 
  ? `1. Write ONE short text message.
2. Keep it under 140 characters.
3. PERSONALIZATION: Use the literal placeholder {first_name} exactly.
4. Do NOT use any banned words. Use generic down payment terms.
5. Format your output EXACTLY as:
message: [Your text message here]`
  : `1. Write a subject line and a structured email body.
2. PERSONALIZATION: Use {first_name} exactly.
3. Make sure to end with the disclaimer: "${brain.financeDisclaimer}".
4. Format your output EXACTLY as:
subject: [Subject Line]
body: [Email Body]`
}`;

    const userPrompt = `Write the copy for promoting this vehicle:
Vehicle Name: ${vName}
Price: ${vPrice}
Down Payment: ${vDown}
Appointment Time: ${vTime}
Tone: ${tone}`;

    const aiResult = await generateText({
      system: systemPrompt,
      prompt: userPrompt,
      task: language === "es" ? "spanish" : "copywriter",
    });
    const text = aiResult.text;

    let copyResult: any = fallbackCopy;

    if (isSms) {
      const match = text.match(/message\s*:\s*([\s\S]+)/i);
      const rawMsg = match?.[1]?.trim() || text.replace(/^message\s*:/i, "").trim();
      copyResult = cleanComplianceRisk(rawMsg) || fallbackCopy;
    } else {
      const subMatch = text.match(/subject\s*:\s*(.+)/i);
      const bodyMatch = text.match(/body\s*:\s*([\s\S]+)/i);
      const subject = cleanComplianceRisk(subMatch?.[1]?.trim() || "") || (fallbackCopy as any).subject;
      let emailBody = cleanComplianceRisk(bodyMatch?.[1]?.trim() || text.replace(/^subject:.+\n/i, "").replace(/^body\s*:/i, "")) || (fallbackCopy as any).body;
      
      if (brain.financeDisclaimer && !/subject to approval|wac/i.test(emailBody)) {
        emailBody = `${emailBody}\n\n${brain.financeDisclaimer}`;
      }
      copyResult = { subject, body: emailBody };
    }

    // Persist generated output in database if Supabase is connected
    if (supabase && finalDealershipId) {
      const client = supabase as any;
      await client.from("generated_outputs").insert({
        dealership_id: finalDealershipId,
        provider: "ollama",
        model: activeStatus.model || "llama3",
        target_type: "vehicle",
        target_id: vehicle?.id || null,
        language,
        prompt_context: { templateId, systemPrompt, userPrompt },
        copy_output: copyResult,
        status: "draft",
      });
    }

    return NextResponse.json({
      ok: true,
      copy: copyResult,
      provider: "ollama",
      model: activeStatus.model || "llama3",
    });

  } catch (error) {
    console.error("[Messaging AI Generator] Error:", error);
    return NextResponse.json({
      ok: true, // Graceful fallback
      copy: isSms
        ? (language === "es"
            ? `Hola {first_name}, acabamos de recibir un ${vName} en el lote. Con un enganche de solo ${vDown}! Consultar: ${vPrice}. — Wabash Auto`
            : `Hi {first_name}, we just got a ${vName} on the lot. Down payment of only ${vDown}! Ask: ${vPrice}. — Wabash Auto`)
        : (language === "es"
            ? {
                subject: `¡Recién Llegado!: ${vName} en Wabash Auto`,
                body: `Hola {first_name},\n\nAcabamos de recibir un excelente ${vName} con un enganche bajo de solo ${vDown}. El precio completo es ${vPrice}.\n\nConsulta opciones de financiamiento hoy.\n\n— Wabash Auto`,
              }
            : {
                subject: `Fresh Arrival: ${vName} at Wabash Auto`,
                body: `Hi {first_name},\n\nWe just received a clean ${vName} with a low down payment option of only ${vDown}. The full price is ${vPrice}.\n\nAsk about options today.\n\n— Wabash Auto`,
              }),
      provider: "offline_fallback",
      model: "exception",
    });
  }
}
