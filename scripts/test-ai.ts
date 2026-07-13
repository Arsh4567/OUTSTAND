import { streamText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const key = process.env.LOVABLE_API_KEY;
console.log("hasKey", !!key);

const gateway = createLovableAiGatewayProvider(key!);
const model = gateway("openai/gpt-5.5");

const result = streamText({
  model,
  messages: [{ role: "user", content: "Say hello" }],
});

const response = result.toUIMessageStreamResponse();
const reader = response.body!.getReader();
let text = "";
while (true) {
  const chunk = await reader.read();
  if (chunk.done) break;
  const decoded = new TextDecoder().decode(chunk.value);
  text += decoded;
}
console.log("streamed", text.length, "chars");
