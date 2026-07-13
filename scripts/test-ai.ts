import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const key = process.env.LOVABLE_API_KEY;
console.log("hasKey", !!key);

const gateway = createLovableAiGatewayProvider(key!);
const model = gateway("openai/gpt-5.5");

const messages: UIMessage[] = [
  {
    id: "test",
    role: "user",
    content: "Hello",
    parts: [{ type: "text", text: "Hello" }],
  },
];

const modelMessages = await convertToModelMessages(messages);
console.log("modelMessages", modelMessages);

const result = streamText({
  model,
  messages: [{ role: "system", content: "You are a coach" }, ...modelMessages],
});

const response = result.toUIMessageStreamResponse({ originalMessages: messages });
const reader = response.body!.getReader();
let text = "";
while (true) {
  const chunk = await reader.read();
  if (chunk.done) break;
  const decoded = new TextDecoder().decode(chunk.value);
  text += decoded;
}
console.log("streamed", text.slice(0, 200));
