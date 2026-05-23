import { NextResponse } from "next/server";
import { generateText, getAiStatus } from "@/lib/ai/ai-provider";

type StoryboardScene = {
  shotNumber: number;
  durationSeconds: number;
  visualAction: string;     // Prompt for Google Omni text-to-video / lot photo pan
  overlayText?: string;     // Text card overlay
  audioScript: string;      // Dialogue
  cameraPacing: string;     // "panning", "slow zoom", "reveal", etc.
};

function fallbackStoryboard(vehicle: any, script: any, duration: number, language: string): StoryboardScene[] {
  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const isEs = language === "es";

  if (duration === 15) {
    return [
      {
        shotNumber: 1,
        durationSeconds: 4,
        visualAction: `Wide establishing cinematic sweep of the ${title} on a clean dealership lot, glistening in daylight`,
        overlayText: isEs ? "¡RECIÉN LLEGADO!" : "FRESH ARRIVAL!",
        audioScript: script.hook || "Check this out!",
        cameraPacing: "cinematic sweep",
      },
      {
        shotNumber: 2,
        durationSeconds: 7,
        visualAction: `Smooth interior tracking shot of the driver dashboard and console of the ${vehicle.make}`,
        overlayText: isEs ? "Financiamiento Flexible" : "Easy Lot Financing",
        audioScript: script.body || "Fully loaded and ready.",
        cameraPacing: "interior glide",
      },
      {
        shotNumber: 3,
        durationSeconds: 4,
        visualAction: `Rear angle shot of the ${title} panning to dealership contact banner, professional branding`,
        overlayText: script.disclaimer || "Subject to credit approval.",
        audioScript: isEs ? "¡Llama hoy!" : "Call us today!",
        cameraPacing: "slow zoom out",
      }
    ];
  }

  // Default to 30 seconds
  return [
    {
      shotNumber: 1,
      durationSeconds: 5,
      visualAction: `Hero shot of the front grille and headlight of the ${title}, sunlight glinting, panning slowly`,
      overlayText: isEs ? "¡APROBACIONES HOY!" : "READY TO ROLL!",
      audioScript: script.hook || "Looking for a clean ride?",
      cameraPacing: "slow reveal",
    },
    {
      shotNumber: 2,
      durationSeconds: 7,
      visualAction: `Cinematic side-profile pan showing the pristine exterior and alloy wheels of the ${vehicle.make}`,
      overlayText: vehicle.mileage ? `${vehicle.mileage.toLocaleString()} mi` : "Low Miles",
      audioScript: isEs ? "Excelente rendimiento y estado impecable." : "Clean, efficient, and beautifully maintained.",
      cameraPacing: "side glide",
    },
    {
      shotNumber: 3,
      durationSeconds: 6,
      visualAction: `Close up detail tracking shot of the clean interior seats, steering wheel, and multimedia screen`,
      overlayText: isEs ? "INTERIOR IMPECABLE" : "CLEAN INTERIOR",
      audioScript: isEs ? "Interior espacioso con todo el confort necesario." : "Step inside a spacious cabin with loaded modern convenience.",
      cameraPacing: "interior pan",
    },
    {
      shotNumber: 4,
      durationSeconds: 7,
      visualAction: `Smooth cinematic slow-motion tracking shot of the car driving on Murfreesboro street, twilight`,
      overlayText: isEs ? "Planes de Enganche Bajos" : "Low Down Payment",
      audioScript: script.body || "Find your finance plan today.",
      cameraPacing: "street track",
    },
    {
      shotNumber: 5,
      durationSeconds: 5,
      visualAction: `Dealership lot front with the ${title} parked, clear graphic card with phone and address overlay`,
      overlayText: script.disclaimer || "WAC. Subject to credit approval.",
      audioScript: isEs ? "¡Visítanos hoy mismo en NW Broad St!" : "Visit us today at 5223 NW Broad Street!",
      cameraPacing: "slow zoom out",
    }
  ];
}

export async function POST(request: Request) {
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { clientId, vehicle, script, goal = "finance", duration = 30, language = "en" } = body;

  if (!vehicle || !script) {
    return NextResponse.json({ error: "Missing required properties: vehicle or script." }, { status: 400 });
  }

  const status = await getAiStatus();
  const vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

  if (!status.online) {
    console.log("Local AI offline. Serving pre-configured storyboard mapping.");
    const storyboard = fallbackStoryboard(vehicle, script, duration, language);
    return NextResponse.json({
      ok: true,
      storyboard,
      provider: "system",
      model: "deterministic-fallback",
      offline: true,
    });
  }

  try {
    const systemInstruction = `You are an expert video director and storyboard designer.
Your task is to take a video commercial script and divide it into timed storyboard scenes.
Each scene represents a single continuous visual shot.

You must output your response as a valid JSON array of StoryboardScene objects.
Do not output any markdown formatting, thoughts, explanation, or code blocks — return ONLY the raw JSON array.

The StoryboardScene type is defined as:
{
  "shotNumber": number (1, 2, 3, etc.),
  "durationSeconds": number (duration in seconds),
  "visualAction": string (detailed visual camera prompt for Google Omni video generation),
  "overlayText": string (optional, text on graphic card, must respect Regulation Z compliance - no invented terms),
  "audioScript": string (the exact voiceover line spoken during this shot),
  "cameraPacing": string ("slow zoom", "panning", "cinematic sweep", "interior glide", "reveal")
}

Ensure the sum of "durationSeconds" across all scenes matches the target duration of exactly ${duration} seconds.
Limit the storyboard to exactly:
- 3 scenes for a 15-second spot.
- 5 scenes for a 30-second spot.
- 6-7 scenes for a 60-second spot.`;

    const prompt = `Convert this ${duration}-second used car script into a storyboard:
Vehicle: ${vehicleName}
Goal: ${goal}
Language: ${language}

SCRIPT DETAILS:
HOOK: ${script.hook}
BODY: ${script.body}
DISCLAIMER: ${script.disclaimer}

Create timed, engaging scenes that walk a buyer visually through the car while matching the spoken audio perfectly. All visual shot descriptions should be highly cinematic.`;

    console.log(`Generating visual storyboard via Local AI for ${vehicleName} (${duration}s)...`);
    const aiResult = await generateText({
      system: systemInstruction,
      prompt,
      task: "strategy",
    });

    let storyboard: StoryboardScene[];
    try {
      const cleanJson = aiResult.text.replace(/```json/g, "").replace(/```/g, "").trim();
      storyboard = JSON.parse(cleanJson);
      if (!Array.isArray(storyboard)) throw new Error("JSON is not an array");
    } catch (parseErr) {
      console.warn("AI did not return clean JSON array. Falling back to deterministic storyboard.", parseErr);
      storyboard = fallbackStoryboard(vehicle, script, duration, language);
    }

    // Force exact duration match
    let totalTime = storyboard.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
    if (totalTime !== duration) {
      // Adjust the last shot or normalize
      const last = storyboard[storyboard.length - 1];
      if (last) {
        last.durationSeconds = Math.max(2, last.durationSeconds + (duration - totalTime));
      }
    }

    return NextResponse.json({
      ok: true,
      storyboard,
      provider: aiResult.provider,
      model: aiResult.model,
      offline: false,
    });

  } catch (err) {
    console.error("Local AI storyboard generation failed:", err);
    const storyboard = fallbackStoryboard(vehicle, script, duration, language);
    return NextResponse.json({
      ok: true,
      storyboard,
      provider: "system",
      model: "error-fallback",
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
