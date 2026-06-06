import { NextResponse } from "next/server";
import { generateText, getAiStatus } from "@/lib/ai/ai-provider";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { resolveDealershipId } from "@/lib/dealerships";
import {
  cleanComplianceRisk,
  defaultBrandBrain,
  loadBrandBrain,
} from "@/features/ai/brand-brain";

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
    const finalDealershipId = supabase ? await resolveDealershipId(supabase, clientId) : null;
    const brain = supabase ? await loadBrandBrain(supabase, finalDealershipId) : defaultBrandBrain;

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
        task_type: "marketing_draft",
        language,
        prompt_context: { templateId, systemPrompt, userPrompt },
        output: copyResult,
        status: "draft",
        updated_at: new Date().toISOString(),
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
