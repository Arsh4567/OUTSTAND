const env = (...names: string[]) => names.map((name) => process.env[name]).find((value) => typeof value === "string" && value.trim().length > 0);

export type AIProviderName = "groq" | "gemini";

type ProviderResult = { name: AIProviderName; provider: any };

export async function getAIProvider(preferred?: AIProviderName): Promise<ProviderResult> {
  const groqKey = env("GROQ_API_KEY");
  const geminiKey = env("GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "GOOGLE_API_KEY");
  const order: AIProviderName[] = preferred ? [preferred, preferred === "groq" ? "gemini" : "groq"] : ["groq", "gemini"];

  for (const providerName of order) {
    if (providerName === "groq" && groqKey) {
      try {
        const { createGroq } = await import("@ai-sdk/groq");
        const provider = createGroq({
          apiKey: groqKey,
          fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
            if (!init?.body || typeof init.body !== "string") return fetch(input, init);
            try {
              const body = JSON.parse(init.body);
              if (body.model === "openai/gpt-oss-20b") body.reasoning_effort = body.reasoning_effort || "low";
              return fetch(input, { ...init, body: JSON.stringify(body) });
            } catch {
              return fetch(input, init);
            }
          },
        });
        return { name: "groq", provider };
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
  if (providerName === "groq") return provider("openai/gpt-oss-20b");
  return provider("gemini-3.5-flash-lite");
}

export function isRateLimitError(error: unknown) {
  const candidate = error as any;
  const message = String(candidate?.message || error || "");
  return candidate?.statusCode === 429 || candidate?.status === 429 || /429|quota|rate.?limit|resource.?exhausted|too many requests/i.test(message);
}
