import { supabase } from "@/integrations/supabase/client";

export type AiHealth = {
  ok: boolean;
  status: number;
  message: string;
  details?: string;
};

export type AiErrorPayload = {
  error?: string;
  details?: string;
  code?: string;
};

export async function readAiResponseError(response: Response): Promise<string> {
  const raw = await response.text().catch(() => "");
  let payload: AiErrorPayload | null = null;
  try { payload = raw ? (JSON.parse(raw) as AiErrorPayload) : null; } catch { payload = null; }
  const message = payload?.error || raw || `${response.status} ${response.statusText}`;
  const details = [payload?.details, payload?.code].filter(Boolean).join(" · ");
  return details ? `${message} — ${details}` : message;
}

export async function checkAiHealth(): Promise<AiHealth> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { ok: false, status: 401, message: "Sign in to use OUTSTAND AI." };
    const { data, error } = await supabase.functions.invoke("outstand-ai", { body: { action: "health" } });
    if (error) return { ok: false, status: 503, message: error.message || "Unable to reach the AI service." };
    if (data?.ok === false) return { ok: false, status: 503, message: "AI service is not configured." };
    return { ok: true, status: 200, message: "Outstand AI is online." };
  } catch (error) {
    return { ok: false, status: 0, message: error instanceof Error ? error.message : "Unable to reach the AI service." };
  }
}

export function formatAiError(error: unknown): string {
  const raw = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  if (/429|quota|resource[_ -]?exhausted|rate[_ -]?limit|free[_ -]?tier/i.test(raw)) return "AI is temporarily rate-limited. Please try again after the quota window resets.";
  if (/NOT_FOUND|bom1::/i.test(raw)) return "AI endpoint could not be reached. Please retry while the service recovers.";
  if (/api key|apikey|configuration|configured/i.test(raw)) return "AI service is not configured correctly on the server.";
  return raw || "An unexpected AI error occurred.";
}
