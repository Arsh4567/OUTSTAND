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
    const response = await fetch("/api/chat", {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (response.ok) {
      return {
        ok: true,
        status: response.status,
        message: await response.text().catch(() => "Outstand AI is online."),
      };
    }

    return {
      ok: false,
      status: response.status,
      message: await readAiResponseError(response),
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      message: error instanceof Error ? error.message : "Unable to reach the AI service.",
    };
  }
}

export function formatAiError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "An unexpected AI error occurred.";
}
