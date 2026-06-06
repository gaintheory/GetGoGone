import { NextRequest, NextResponse } from "next/server";

const COMFY_URL = process.env.COMFYUI_URL || "http://localhost:8188";

// Minimal FLUX.1-schnell workflow — 4-step fast generation
function buildWorkflow(prompt: string, width: number, height: number) {
  const seed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
  return {
    "1": {
      class_type: "CheckpointLoaderSimple",
      inputs: { ckpt_name: "flux1-schnell.safetensors" },
    },
    "2": {
      class_type: "CLIPTextEncode",
      inputs: { text: prompt, clip: ["1", 1] },
    },
    "3": {
      class_type: "CLIPTextEncode",
      inputs: { text: "", clip: ["1", 1] },
    },
    "4": {
      class_type: "EmptyLatentImage",
      inputs: { width, height, batch_size: 1 },
    },
    "5": {
      class_type: "KSampler",
      inputs: {
        model: ["1", 0],
        positive: ["2", 0],
        negative: ["3", 0],
        latent_image: ["4", 0],
        seed,
        steps: 4,
        cfg: 1,
        sampler_name: "euler",
        scheduler: "simple",
        denoise: 1.0,
      },
    },
    "6": {
      class_type: "VAEDecode",
      inputs: { samples: ["5", 0], vae: ["1", 2] },
    },
    "7": {
      class_type: "SaveImage",
      inputs: { images: ["6", 0], filename_prefix: "ggg_" },
    },
  };
}

// POST /api/ai/generate-image — queue a generation job
export async function POST(req: NextRequest) {
  try {
    const { prompt, width = 1080, height = 1080 } = await req.json();
    if (!prompt?.trim()) {
      return NextResponse.json({ error: "prompt required" }, { status: 400 });
    }

    const res = await fetch(`${COMFY_URL}/prompt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: buildWorkflow(String(prompt), Number(width), Number(height)) }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "ComfyUI rejected the request — check model name and workflow" },
        { status: 502 }
      );
    }

    const { prompt_id } = await res.json();
    return NextResponse.json({ ok: true, jobId: prompt_id });
  } catch {
    return NextResponse.json(
      { error: "ComfyUI not reachable — start it at localhost:8188" },
      { status: 503 }
    );
  }
}

// GET /api/ai/generate-image?jobId=xxx — poll for result
export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get("jobId");
  if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });

  try {
    const res = await fetch(`${COMFY_URL}/history/${encodeURIComponent(jobId)}`);
    if (!res.ok) return NextResponse.json({ status: "pending" });

    const history = await res.json();
    const job = history[jobId];
    if (!job) return NextResponse.json({ status: "pending" });

    const outputs: Record<string, { images?: Array<{ filename: string; subfolder: string; type: string }> }> =
      job.outputs || {};
    const images = Object.values(outputs).flatMap((o) => o.images || []);
    if (images.length === 0) return NextResponse.json({ status: "pending" });

    const img = images[0];
    // Return the ComfyUI-local URL — browser loads directly from localhost:8188
    const imageUrl = `${COMFY_URL}/view?filename=${encodeURIComponent(img.filename)}&subfolder=${encodeURIComponent(img.subfolder || "")}&type=${img.type || "output"}`;

    return NextResponse.json({ status: "done", imageUrl });
  } catch {
    return NextResponse.json({ status: "pending" });
  }
}
