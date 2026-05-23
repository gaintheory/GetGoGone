import { NextResponse } from "next/server";

import { getAiStatus } from "@/lib/ai/ai-provider";

export async function GET() {
  const status = await getAiStatus();
  return NextResponse.json({ ok: true, status });
}
