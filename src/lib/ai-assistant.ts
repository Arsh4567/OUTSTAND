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
    const response = await fetch("/api/chat", { method: "GET", headers: { Authorization: `Bearer ${session.access_token}` }, credentials: "include" });
    if (!response.ok) return { ok: false, status: response.status, message: await readAiResponseError(response) };
    const payload = await response.json().catch(() => ({}));
    if (payload?.ok === false) return { ok: false, status: response.status, message: payload?.error || "AI service is not ready." };
    return { ok: true, status: response.status, message: "Outstand AI is online." };
  } catch (error) {
    return { ok: false, status: 0, message: error instanceof Error ? error.message : "Unable to reach the AI service." };
  }
}

export function formatAiError(error: unknown): string {
  const raw = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  if (/401|authentication|required|session expired/i.test(raw)) return "Your session expired. Please sign in again.";
  if (/429|quota|resource[_ -]?exhausted|rate[_ -]?limit|free[_ -]?tier/i.test(raw)) return "AI is temporarily rate-limited. Please try again after the quota window resets.";
  if (/NOT_FOUND|bom1::/i.test(raw)) return "AI endpoint could not be reached. Please retry while the service recovers.";
  if (/api key|apikey|configuration|configured|provider/i.test(raw)) return "AI service is not configured correctly on the server.";
  return raw || "An unexpected AI error occurred.";
}
