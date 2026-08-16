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

  try {
    payload = raw ? (JSON.parse(raw) as AiErrorPayload) : null;
  } catch {
    payload = null;
  }

  const message = payload?.error || raw || `${response.status} ${response.statusText}`;
  const details = [payload?.details, payload?.code].filter(Boolean).join(" · ");
  return details ? `${message} — ${details}` : message;
}

export async function checkAiHealth(accessToken?: string): Promise<AiHealth> {
  try {
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
    const response = await fetch("/api/chat", { method: "GET", headers, cache: "no-store" });

    if (response.ok) {
      const payload = await response.json().catch(() => null) as { ok?: boolean; service?: string; geminiConfigured?: boolean } | null;
      if (payload?.ok === false || payload?.geminiConfigured === false) {
        return { ok: false, status: response.status, message: "AI service is not configured." };
      }
      return { ok: true, status: response.status, message: "Outstand AI is online." };
    }

    return { ok: false, status: response.status, message: await readAiResponseError(response) };
  } catch (error) {
    return { ok: false, status: 0, message: error instanceof Error ? error.message : "Unable to reach the AI service." };
  }
}

export function formatAiError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message;
    if (/NOT_FOUND|bom1::/i.test(message)) return "AI endpoint could not be reached. Please retry while the service recovers.";
    if (/api key|apikey|configuration|configured/i.test(message)) return "AI service is not configured correctly on the server.";
    return message;
  }
  if (typeof error === "string") {
    if (/NOT_FOUND|bom1::/i.test(error)) return "AI endpoint could not be reached. Please retry while the service recovers.";
    return error;
  }
  return "An unexpected AI error occurred.";
}
