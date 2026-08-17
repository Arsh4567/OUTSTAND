const env = (...names: string[]) => names.map((name) => process.env[name]).find((value) => typeof value === "string" && value.trim().length > 0);

export type AIProviderName = "groq" | "gemini";

type ProviderResult = {
  name: AIProviderName;
  provider: any;
};

export async function getAIProvider(preferred?: AIProviderName): Promise<ProviderResult> {
  const groqKey = env("GROQ_API_KEY");
  const geminiKey = env("GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "GOOGLE_API_KEY");
  const order: AIProviderName[] = preferred
    ? [preferred, preferred === "groq" ? "gemini" : "groq"]
    : ["groq", "gemini"];

  for (const providerName of order) {
    if (providerName === "groq" && groqKey) {
      try {
        const { createGroq } = await import("@ai-sdk/groq");
        return { name: "groq", provider: createGroq({ apiKey: groqKey }) };
      } catch (error) {
        console.error("Groq provider initialization failed:", error);
        if (preferred === "groq") throw error;
      }
    }

    if (providerName === "gemini" && geminiKey) {
      try {
        const { createGoogleGenerativeAI } = await import("@ai-sdk/google");
        return { name: "gemini", provider: createGoogleGenerativeAI({ apiKey: geminiKey }) };
      } catch (error) {
        console.error("Gemini provider initialization failed:", error);
        if (preferred === "gemini") throw error;
      }
    }
  }

  const error = new Error("No AI provider is configured on the server.");
  Object.assign(error, { code: "AI_PROVIDER_CONFIG_MISSING", status: 503 });
  throw error;
}

export function modelFor(providerName: AIProviderName, provider: any, task: "chat" | "roadmap") {
  // Groq retired llama-3.1-8b-instant on August 16, 2026.
  // GPT-OSS 20B is the recommended replacement and is currently a production model.
  if (providerName === "groq") return provider(task === "chat" ? "openai/gpt-oss-20b" : "openai/gpt-oss-20b");
  return provider("gemini-2.5-flash-lite");
}

export function isRateLimitError(error: unknown) {
  const candidate = error as any;
  const message = String(candidate?.message || error || "");
  return candidate?.statusCode === 429 || candidate?.status === 429 || /429|quota|rate.?limit|resource.?exhausted|too many requests/i.test(message);
}
