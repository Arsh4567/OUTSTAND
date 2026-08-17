import type { VercelRequest, VercelResponse } from "@vercel/node";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

const env = (...names: string[]) => names.map((name) => process.env[name]).find((value) => typeof value === "string" && value.trim());

function send(res: VercelResponse, status: number, body: Record<string, unknown>) {
  return res.status(status).json(body);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });

  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) return send(res, 401, { error: "Authentication required" });

  // Prefer the VITE_* values used by the browser. This prevents a stale
  // server-only SUPABASE_URL from pointing this function at a different DB.
  const supabaseUrl = env("VITE_SUPABASE_URL", "SUPABASE_URL");
  const publishableKey = env("VITE_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_PUBLISHABLE_KEY");
  const serviceRoleKey = env("SUPABASE_SERVICE_ROLE_KEY");
  const publicKey = env("VITE_VAPID_PUBLIC_KEY", "VAPID_PUBLIC_KEY");
  const privateKey = env("VAPID_PRIVATE_KEY");

  if (!supabaseUrl || !publishableKey || !serviceRoleKey || !publicKey || !privateKey) {
    return send(res, 503, { error: "Push notification server configuration is incomplete" });
  }

  const token = authorization.slice("Bearer ".length).trim();
  if (!token) return send(res, 401, { error: "Authentication token is missing" });

  const authClient = createClient(supabaseUrl, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user) {
    console.error("[Push] Authentication failed", { code: authError?.code, message: authError?.message });
    return send(res, 401, { error: "Authentication failed" });
  }

  const userId = authData.user.id;
  console.log("[Push] authenticated user", userId, "supabase", new URL(supabaseUrl).hostname);

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: subs, error: subscriptionError } = await admin
    .from("push_subscriptions")
    .select("id,endpoint,auth_key,p256dh_key,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (subscriptionError) {
    console.error("[Push] Subscription query failed", { code: subscriptionError.code, message: subscriptionError.message });
    return send(res, 500, { error: "Could not load notification subscriptions", code: subscriptionError.code });
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};
  const candidate = body.subscription;
  const directSubscription = candidate && typeof candidate === "object"
    && typeof candidate.endpoint === "string"
    && candidate.keys
    && typeof candidate.keys.auth === "string"
    && typeof candidate.keys.p256dh === "string"
    ? { endpoint: candidate.endpoint, auth_key: candidate.keys.auth, p256dh_key: candidate.keys.p256dh }
    : null;

  console.log("[Push] subscription lookup", { userId, count: subs?.length ?? 0, hasDirectSubscription: Boolean(directSubscription) });

  // The browser is the source of truth for the device currently being tested.
  // If production's server-side DB is temporarily out of sync, send directly
  // to that active subscription instead of falsely reporting "none found".
  const deliverySubscriptions = subs?.length
    ? subs.map((sub) => ({ endpoint: sub.endpoint, auth_key: sub.auth_key, p256dh_key: sub.p256dh_key, id: sub.id }))
    : directSubscription
      ? [{ ...directSubscription, id: null }]
      : [];

  if (!deliverySubscriptions.length) {
    return send(res, 404, { error: "No active push subscription found. Enable notifications on this device first." });
  }

  webpush.setVapidDetails(env("VAPID_SUBJECT") || "mailto:notifications@outstand.app", publicKey, privateKey);

  const payload = JSON.stringify({
    title: "OUTSTAND 🤖",
    body: "Your notifications are working. You're ready for smarter reminders! 🎉",
    icon: "/icon-192x192.png",
    badge: "/badge-72x72.png",
    url: "/",
    tag: "outstand-test",
  });

  let sent = 0;
  const failures: Array<{ statusCode?: number; message?: string }> = [];

  for (const sub of deliverySubscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { auth: sub.auth_key, p256dh: sub.p256dh_key },
        },
        payload,
      );
      sent += 1;
    } catch (error: any) {
      const statusCode = typeof error?.statusCode === "number" ? error.statusCode : undefined;
      const message = typeof error?.message === "string" ? error.message : "Unknown push delivery error";
      console.error("[Push] Delivery failed", { statusCode, message });
      failures.push({ statusCode, message });

      if ((statusCode === 404 || statusCode === 410) && sub.id) {
        await admin.from("push_subscriptions").delete().eq("id", sub.id);
      }
    }
  }

  if (sent > 0) return send(res, 200, { success: true, sent, usedDirectSubscription: !subs?.length && Boolean(directSubscription) });
  return send(res, 502, { error: "All push deliveries failed", sent: 0, failures });
}
