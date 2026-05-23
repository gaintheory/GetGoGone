type GenerateTextInput = {
  system: string;
  prompt: string;
  task?: "copywriter" | "spanish" | "compliance" | "strategy" | "fast";
};

export type AiProviderStatus = {
  provider: string;
  configured: boolean;
  online: boolean;
  model: string;
  models?: string[];
  taskModels?: Record<string, string>;
  endpoint?: string;
  error?: string;
};

const OLLAMA_URL = process.env.LOCAL_OLLAMA_URL || "http://localhost:11434";
const LOCAL_TEXT_MODEL = process.env.LOCAL_TEXT_MODEL || "llama3.1:8b";
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 20000);

type OllamaModel = {
  name?: string;
  model?: string;
  size?: number;
  modified_at?: string;
};

const taskPreferences: Record<NonNullable<GenerateTextInput["task"]>, string[]> = {
  copywriter: ["qwen2.5:7b", "qwen", "llama", "gemma", "mistral", "phi"],
  spanish: ["qwen2.5:7b", "qwen", "llama", "gemma", "mistral"],
  compliance: ["qwen2.5:7b", "qwen", "llama", "gemma", "mistral", "phi"],
  strategy: ["qwen2.5:7b", "qwen", "llama", "gemma", "mistral"],
  fast: ["phi", "gemma:2b", "gemma2:2b", "qwen", "gemma", "llama"],
};

async function listOllamaModels() {
  const response = await fetch(`${OLLAMA_URL}/api/tags`, {
    signal: AbortSignal.timeout(2500),
  });

  if (!response.ok) {
    throw new Error(`Ollama responded with ${response.status}`);
  }

  const payload = await response.json();
  return Array.isArray(payload.models) ? payload.models as OllamaModel[] : [];
}

function modelName(model: OllamaModel) {
  return model.name || model.model || "";
}

function pickModel(models: OllamaModel[], task: NonNullable<GenerateTextInput["task"]> = "copywriter") {
  const names = models.map(modelName).filter(Boolean);
  if (names.length === 0) return LOCAL_TEXT_MODEL;

  const preferences =
    task === "copywriter" || task === "spanish"
      ? [LOCAL_TEXT_MODEL, ...(taskPreferences[task] || taskPreferences.copywriter)]
      : taskPreferences[task] || taskPreferences.copywriter;
  for (const preferred of preferences) {
    const exact = names.find(name => name.toLowerCase() === preferred.toLowerCase());
    if (exact) return exact;
    const partial = names.find(name => name.toLowerCase().includes(preferred.toLowerCase()));
    if (partial) return partial;
  }

  return names[0];
}

function buildTaskModels(models: OllamaModel[]) {
  return {
    copywriter: pickModel(models, "copywriter"),
    spanish: pickModel(models, "spanish"),
    compliance: pickModel(models, "compliance"),
    strategy: pickModel(models, "strategy"),
    fast: pickModel(models, "fast"),
  };
}

export async function getAiStatus(): Promise<AiProviderStatus> {
  const provider = process.env.LLM_PROVIDER || "local";

  if (provider !== "local") {
    return {
      provider,
      configured: true,
      online: true,
      model: process.env.CLOUD_TEXT_MODEL || "cloud-default",
    };
  }

  try {
    const models = await listOllamaModels();
    const names = models.map(modelName).filter(Boolean);
    const taskModels = buildTaskModels(models);
    const selectedModel = taskModels.copywriter || LOCAL_TEXT_MODEL;

    return {
      provider: "local",
      configured: true,
      online: true,
      model: selectedModel,
      models: names,
      taskModels,
      endpoint: OLLAMA_URL,
      error: names.length ? undefined : "Ollama is online, but no models are installed.",
    };
  } catch (error) {
    return {
      provider: "local",
      configured: true,
      online: false,
      model: LOCAL_TEXT_MODEL,
      endpoint: OLLAMA_URL,
      error: error instanceof Error ? error.message : "Ollama is not reachable.",
    };
  }
}

export async function generateText(input: GenerateTextInput) {
  const provider = process.env.LLM_PROVIDER || "local";

  if (provider !== "local") {
    throw new Error(`Provider ${provider} is not implemented yet.`);
  }

  const models = await listOllamaModels();
  const selectedModel = pickModel(models, input.task || "copywriter");

  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(AI_TIMEOUT_MS),
    body: JSON.stringify({
      model: selectedModel,
      stream: false,
      system: input.system,
      prompt: input.prompt,
      options: {
        temperature: 0.7,
        top_p: 0.9,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama generation failed with ${response.status}`);
  }

  const payload = await response.json();
  return {
    provider: "local",
    model: selectedModel,
    text: String(payload.response || "").trim(),
  };
}
