import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const key = process.env.LOVABLE_API_KEY;
console.log("hasKey", !!key);

const gateway = createLovableAiGatewayProvider(key!);
const model = gateway("openai/gpt-5.5");

const result = await generateText({
  model,
  messages: [{ role: "user", content: "Say hello" }],
});

console.log("result", result.text);
