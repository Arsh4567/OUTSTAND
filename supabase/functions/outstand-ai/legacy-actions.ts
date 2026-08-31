import { createGoogleGenerativeAI } from "https://esm.sh/@ai-sdk/google@2";
import { createGroq } from "https://esm.sh/@ai-sdk/groq@2";
import { generateText } from "https://esm.sh/ai@5";

const env = (...names: string[]) => names.map((name) => Deno.env.get(name)).find((value) => value?.trim());
function getModel() {
  const groqKey = env("GROQ_API_KEY");
  const geminiKey = env("GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "GOOGLE_API_KEY");
  if (groqKey) return createGroq({ apiKey: groqKey })(env("GROQ_MODEL") || "openai/gpt-oss-20b");
  if (geminiKey) return createGoogleGenerativeAI({ apiKey: geminiKey })(env("GEMINI_MODEL") || "gemini-3.5-flash-lite");
  throw new Error("No AI provider is configured on the server.");
}

function extractJson(text: string) {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start < 0 || end < start) throw new Error("AI returned an invalid task plan.");
  return JSON.parse(cleaned.slice(start, end + 1));
}

export async function handleLegacyAction(client: any, userId: string, action: string, body: any) {
  if (action === "task_breakdown") {
    const milestone = String(body?.milestone || "").trim();
    const budget = Math.min(240, Math.max(15, Math.round(Number(body?.availableMinutes) || 120)));
    if (milestone.length < 5 || milestone.length > 2000) throw new Error("Enter a milestone between 5 and 2000 characters.");
    const result = await generateText({ model: getModel(), temperature: 0.2, system: "You are OUTSTAND Smart Breakdown. Return ONLY a JSON array. Each item must have title (string) and minutes (integer 5-45). Create 3-8 concrete independently finishable actions, ordered by dependency. Total minutes must be <= the budget. No motivational filler.", prompt: `Milestone:\n${milestone}\n\nAvailable time: ${budget} minutes.`, maxRetries: 0 });
    const raw = extractJson(result.text);
    if (!Array.isArray(raw)) throw new Error("The AI returned an invalid task plan.");
    let total = 0;
    const tasks = raw.slice(0, 8).filter((item: any) => {
      const title = String(item?.title || "").trim();
      const minutes = Math.round(Number(item?.minutes));
      if (!title || minutes < 5 || minutes > 45 || total + minutes > budget) return false;
      total += minutes;
      return true;
    }).map((item: any) => ({ id: crypto.randomUUID(), title: String(item.title).trim().slice(0, 160), minutes: Math.round(Number(item.minutes)) }));
    if (!tasks.length) throw new Error("The AI could not create a usable focus queue.");
    return { tasks, totalMinutes: total, milestone };
  }

  if (action === "dopamine_analysis") {
    const logs = Array.isArray(body?.logs) ? body.logs.slice(0, 14) : [];
    const average = logs.length ? Math.round(logs.reduce((sum: number, log: any) => sum + Number(log.score || 0), 0) / logs.length) : 50;
    const best = logs.length ? Math.max(...logs.map((log: any) => Number(log.score || 0))) : average;
    const worst = logs.length ? Math.min(...logs.map((log: any) => Number(log.score || 0))) : average;
    const prompt = `Analyze this user's OUTSTAND momentum data. Do not diagnose health conditions and do not claim to measure dopamine. Identify one likely execution pattern, one friction point, and one practical next action. Use only supplied data. Keep it under 140 words.\n\n7-day average score: ${average}/100\nBest day: ${best}/100\nLowest day: ${worst}/100\nDaily logs: ${JSON.stringify(logs)}\n\nFormat:\nPATTERN\n...\nFRICTION\n...\nNEXT MOVE\n...`;
    const result = await generateText({ model: getModel(), prompt, maxOutputTokens: 220, maxRetries: 0 });
    return { analysis: result.text.trim() };
  }

  if (action === "sync_productivity_state") {
    const habits = Array.isArray(body?.habits) ? body.habits.slice(0, 7) : [];
    const sessions = Array.isArray(body?.sessions) ? body.sessions.slice(0, 500) : [];
    const outstand = Array.isArray(body?.outstand) ? body.outstand.slice(0, 200) : [];
    const { error } = await client.rpc("upsert_user_productivity_state", { p_habits: habits, p_sessions: sessions, p_outstand: outstand });
    if (error) throw error;
    return { success: true, updatedAt: new Date().toISOString() };
  }

  if (action === "test_push") {
    // Push delivery is intentionally delegated to the existing notification system.
    // This action verifies that the signed-in user has an active subscription.
    const { data, error } = await client.from("push_subscriptions").select("id,endpoint").eq("user_id", userId).limit(1).maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("No active push subscription found. Enable notifications on this device first.");
    return { success: true, subscriptionReady: true, message: "Push subscription is registered and ready." };
  }

  throw new Error(`Unsupported backend action: ${action}`);
}
