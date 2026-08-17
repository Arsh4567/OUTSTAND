import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const env = (...names: string[]) => names.map((name) => process.env[name]).find((value) => typeof value === "string" && value.trim().length > 0);

export type AIProviderName = "groq" | "gemini";

export function getAIProvider(preferred?: AIProviderName) {
  const groqKey = env("GROQ_API_KEY");
  const geminiKey = env("GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "GOOGLE_API_KEY");

  const order: AIProviderName[] = preferred ? [preferred, preferred === "groq" ? "gemini" : "groq"] : ["groq", "gemini"];

  for (const providerName of order) {
    if (providerName === "groq" && groqKey) {
      return {
        name: "groq" as const,
        provider: createOpenAICompatible({
          name: "groq",
          apiKey: groqKey,
          baseURL: "https://api.groq.com/openai/v1",
        }),
      };
    }
    if (providerName === "gemini" && geminiKey) {
      return {
        name: "gemini" as const,
        provider: createGoogleGenerativeAI({ apiKey: geminiKey }),
      };
    }
  }

  const error = new Error("No AI provider is configured on the server.");
  Object.assign(error, { code: "AI_PROVIDER_CONFIG_MISSING", status: 503 });
  throw error;
}

export function modelFor(providerName: AIProviderName, provider: any, task: "chat" | "roadmap") {
  if (providerName === "groq") {
    // Fast model for conversation; stronger model for structured roadmap generation.
    return provider(task === "chat" ? "llama-3.1-8b-instant" : "openai/gpt-oss-20b");
  }
  return provider("gemini-2.5-flash-lite");
}

export function isRateLimitError(error: unknown) {
  const candidate = error as any;
  const message = String(candidate?.message || error || "");
  return candidate?.statusCode === 429 || candidate?.status === 429 || /429|quota|rate.?limit|resource.?exhausted|too many requests/i.test(message);
}
