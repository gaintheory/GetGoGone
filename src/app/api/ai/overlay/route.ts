import { NextResponse } from "next/server";
import { generateText, getAiStatus } from "@/lib/ai/ai-provider";

// Helper to parse colors from free-form prompt
function extractColor(prompt: string, defaultColor: string): string {
  const p = prompt.toLowerCase();
  if (p.includes("gold") || p.includes("yellow")) return "#D97706";
  if (p.includes("neon blue") || p.includes("electric blue")) return "#00E5FF";
  if (p.includes("blue")) return "#2563EB";
  if (p.includes("orange")) return "#EA580C";
  if (p.includes("red")) return "#DC2626";
  if (p.includes("green")) return "#16A34A";
  if (p.includes("purple")) return "#7C3AED";
  if (p.includes("black")) return "#111827";
  if (p.includes("white")) return "#FFFFFF";
  return defaultColor;
}

// Smart programmatic generator as a solid fallback
function generateFallbackOverlay(promptText: string): any[] {
  const p = promptText.toLowerCase();
  
  // 1. Spanish Theme
  if (p.includes("spanish") || p.includes("espanol") || p.includes("bilingue") || p.includes("hablamos")) {
    return [
      { type: "shape", x: 0, y: 74, w: 100, h: 26, color: "#991B1B", opacity: 0.95 },
      { type: "shape", x: 0, y: 74, w: 100, h: 2, color: "#D97706" },
      { type: "text", text: "FINANCIAMIENTO DISPONIBLE", x: 5, y: 77, w: 90, h: 7, size: 4.8, weight: 800, color: "#FFFFFF", align: "center" },
      { type: "text", text: "Aprobación rápida con tu identificación", x: 5, y: 86, w: 90, h: 4, size: 2.1, weight: 600, color: "#FEF08A", align: "center" },
      { type: "cta", text: "Llama ahora: {{phone}}", x: 25, y: 92, w: 50, h: 5.5, bg: "#D97706", color: "#FFFFFF" }
    ];
  }

  // 2. Craigslist / High-Impact Theme
  if (p.includes("craigslist") || p.includes("high-impact") || p.includes("bold")) {
    const mainColor = extractColor(promptText, "#EA580C");
    return [
      { type: "shape", x: 0, y: 0, w: 100, h: 6, color: mainColor },
      { type: "shape", x: 0, y: 84, w: 100, h: 16, color: mainColor },
      { type: "text", text: "{{year}} {{make}} {{model}}", x: 4, y: 1.2, w: 92, h: 4.5, size: 3.8, weight: 900, color: "#FFFFFF", align: "center", role: "headline" },
      { type: "text", text: "ONLY {{down_payment}} DOWN & LOW WEEKLY PAYMENTS!", x: 4, y: 86, w: 92, h: 5, size: 3.5, weight: 900, color: "#FFFFFF", align: "center" },
      { type: "text", text: "APPLY DIRECTLY ON {{website}} OR CALL {{phone}}", x: 4, y: 92, w: 92, h: 4, size: 2.2, weight: 800, color: "#FEF08A", align: "center" }
    ];
  }

  // 3. History QR Report Badge
  if (p.includes("qr") || p.includes("history") || p.includes("scan")) {
    return [
      { type: "shape", x: 68, y: 4, w: 28, h: 32, color: "#FFFFFF", opacity: 0.95, border: true },
      { type: "text", text: "FREE HISTORY REPORT", x: 69, y: 6, w: 26, h: 4, size: 1.6, weight: 800, color: "#0F172A", align: "center" },
      { type: "shape", x: 74, y: 11, w: 16, h: 16, color: "#000000" },
      { type: "shape", x: 75.5, y: 12.5, w: 13, h: 13, color: "#FFFFFF" },
      { type: "text", text: "SCAN ME", x: 74, y: 28.5, w: 16, h: 3, size: 1.2, weight: 700, color: "#0F172A", align: "center" }
    ];
  }

  // 4. Default / Dynamic Theme Synthesis based on custom prompt colors
  const primaryBg = extractColor(promptText, "#111827");
  const secondaryAccent = primaryBg === "#111827" ? "#D97706" : "#FFFFFF";
  const isDark = primaryBg !== "#FFFFFF";
  const textColor = isDark ? "#FFFFFF" : "#111827";
  const subtitleColor = isDark ? "#FEF08A" : "#D97706";

  // Check if user wanted a top header, split, or footer
  const isHeader = p.includes("top") || p.includes("header");
  const isBorderOnly = p.includes("border") || p.includes("frame");

  if (isBorderOnly) {
    const borderColor = extractColor(promptText, "#00E5FF");
    return [
      // Framing border lines
      { type: "shape", x: 0, y: 0, w: 100, h: 2.5, color: borderColor },
      { type: "shape", x: 0, y: 97.5, w: 100, h: 2.5, color: borderColor },
      { type: "shape", x: 0, y: 0, w: 2, h: 100, color: borderColor },
      { type: "shape", x: 98, y: 0, w: 2, h: 100, color: borderColor },
      // Minimal header label
      { type: "shape", x: 4, y: 4, w: 42, h: 7, color: "#0F172A", opacity: 0.9 },
      { type: "text", text: "{{year}} {{make}} {{model}}", x: 6, y: 5.5, w: 38, h: 4, size: 2.8, weight: 800, color: "#FFFFFF", align: "left", role: "headline" },
      // Footer callout
      { type: "shape", x: 4, y: 88, w: 92, h: 8, color: "#0F172A", opacity: 0.9 },
      { type: "text", text: "FINANCING OPTIONS STARTING AT {{down_payment}} DOWN · CALL {{phone}}", x: 6, y: 90.5, w: 88, h: 4, size: 2.2, weight: 800, color: "#FFFFFF", align: "center" }
    ];
  }

  if (isHeader) {
    return [
      { type: "shape", x: 0, y: 0, w: 100, h: 22, color: primaryBg, opacity: 0.95 },
      { type: "shape", x: 0, y: 22, w: 100, h: 2, color: secondaryAccent },
      { type: "text", text: "{{year}} {{make}} {{model}}", x: 5, y: 3, w: 90, h: 7, size: 4.8, weight: 800, color: textColor, align: "center", role: "headline" },
      { type: "text", text: "APPLY DIRECTLY AND DRIVE HOME TODAY · {{website}}", x: 5, y: 12, w: 90, h: 4, size: 2.2, weight: 600, color: subtitleColor, align: "center" }
    ];
  }

  // Default elegant footer-based layout
  return [
    { type: "shape", x: 0, y: 76, w: 100, h: 24, color: primaryBg, opacity: 0.95 },
    { type: "shape", x: 0, y: 76, w: 100, h: 2, color: secondaryAccent },
    { type: "text", text: "{{year}} {{make}} {{model}}", x: 5, y: 79, w: 60, h: 6, size: 4.2, weight: 800, color: textColor, align: "left", role: "headline" },
    { type: "text", text: "{{trim}} · {{mileage}} mi · LOT-READY CERTIFIED", x: 5, y: 87, w: 60, h: 4, size: 2.0, weight: 600, color: subtitleColor, align: "left" },
    { type: "text", text: "FINANCING AVAILABLE", x: 5, y: 92, w: 60, h: 3, size: 1.6, weight: 700, color: textColor, align: "left" },
    // Right hand pricing block
    { type: "shape", x: 68, y: 79, w: 27, h: 18, color: secondaryAccent === "#FFFFFF" ? "rgba(255,255,255,0.1)" : secondaryAccent, border: false },
    { type: "text", text: "{{down_payment}}", x: 69, y: 81, w: 25, h: 7, size: 4.5, weight: 900, color: secondaryAccent === "#FFFFFF" ? primaryBg : "#FFFFFF", align: "center" },
    { type: "text", text: "DOWN PAYMENT", x: 69, y: 90, w: 25, h: 3, size: 1.4, weight: 800, color: secondaryAccent === "#FFFFFF" ? primaryBg : "#FFFFFF", align: "center" }
  ];
}

export async function POST(req: Request) {
  try {
    const { prompt, clientId } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { success: false, error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Try calling LLM model if online and configured
    let layers: any[] | null = null;
    const aiStatus = await getAiStatus();

    if (aiStatus.configured && aiStatus.online) {
      try {
        const systemPrompt = `You are a professional graphic designer and advertising copywriter for a premium car dealership SaaS called GetGoGone.
Your task is to translate an operator's visual style description prompt into an array of canvas layers.
The output MUST be a valid JSON array of layer objects ONLY. Do not include markdown code block syntax, do not include any conversational filler, explanation or extra spacing. 

Each layer object must match one of the following schemas:

1. Shape Layer:
{ "type": "shape", "x": <number 0-100>, "y": <number 0-100>, "w": <number 0-100>, "h": <number 0-100>, "color": "<hex or rgba color>", "opacity": <optional number 0-1>, "border": <optional boolean> }

2. Text Layer (supporting template tags like {{year}}, {{make}}, {{model}}, {{trim}}, {{price}}, {{down_payment}}, {{weekly_payment}}, {{monthly_payment}}, {{mileage}}, {{phone}}, {{website}}, {{disclosure}}):
{ "type": "text", "text": "<string>", "x": <number 0-100>, "y": <number 0-100>, "w": <number 0-100>, "h": <number 0-100>, "size": <number 1.5-8>, "weight": <number 300-900>, "color": "<hex color>", "align": "left" | "center" | "right", "role": "headline" | "subhead" | "disclosure" | null }

3. CTA Button Layer:
{ "type": "cta", "text": "<string>", "x": <number 0-100>, "y": <number 0-100>, "w": <number 0-100>, "h": <number 0-100>, "bg": "<hex color>", "color": "<hex color>" }

4. Stat Row Badge Layer:
{ "type": "stat-row", "x": <number>, "y": <number>, "w": <number>, "h": <number>, "color": "<hex>", "bg": "<hex>", "items": [ { "label": "<string>", "value": "<string>", "highlight": <optional boolean> } ] }

5. Ribbon Decal Layer:
{ "type": "ribbon", "text": "<string>", "x": <number>, "y": <number>, "w": <number>, "h": <number>, "color": "<hex>", "textColor": "<hex>" }

6. QR Code Block Layer:
{ "type": "qr", "x": <number>, "y": <number>, "w": <number>, "h": <number> }

Design Rules:
- Canvas is an absolute 100x100 percent space (x: 0-100, y: 0-100, w: 0-100, h: 0-100). Keep elements inside these bounds!
- Create a beautiful, premium visual hierarchy. Typically include a banner shape in the footer (e.g. y: 74, h: 26) or header (y: 0, h: 20) to contrast text against the vehicle photo beneath it.
- Ensure high color contrast (white/yellow text on dark background, or dark text on light background).
- Avoid overlapping text elements. Put titles, accents, and CTA buttons in non-overlapping bounding boxes.
- Always prefer template tags (e.g., {{year}} {{make}} {{model}}, {{down_payment}} DOWN, Call {{phone}}) to make templates reusable across different vehicle lot details.

Response format MUST be a strict raw JSON array, e.g.:
[
  { "type": "shape", "x": 0, "y": 75, "w": 100, "h": 25, "color": "#111827" },
  { "type": "text", "text": "{{year}} {{make}} {{model}}", "x": 5, "y": 77, "w": 90, "h": 6, "size": 4.5, "weight": 800, "color": "#FFFFFF", "align": "center" }
]`;

        const llmResult = await generateText({
          system: systemPrompt,
          prompt: `Operator prompt: "${prompt}". Generate a high-fidelity creative overlay layer set.`,
          task: "copywriter"
        });

        // Parse and validate the JSON response
        const cleanText = llmResult.text
          .replace(/```json/i, "")
          .replace(/```/, "")
          .trim();
        
        const parsed = JSON.parse(cleanText);
        if (Array.isArray(parsed) && parsed.length > 0) {
          layers = parsed;
        }
      } catch (err) {
        console.warn("AI generation failed or timed out, running programmatic fallback:", err);
      }
    }

    // Fallback if LLM is offline or output is invalid
    if (!layers) {
      layers = generateFallbackOverlay(prompt);
    }

    return NextResponse.json({
      success: true,
      layers,
      provider: aiStatus.online ? "ollama" : "programmatic-fallback"
    });
  } catch (error) {
    console.error("AI Overlay Endpoint Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
