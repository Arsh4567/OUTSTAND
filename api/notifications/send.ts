import type { VercelRequest, VercelResponse } from "@vercel/node";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const env = (...names: string[]) => names.map((name) => process.env[name]).find((value) => typeof value === "string" && value.trim());
const categories = new Set(["habit", "goal", "motivation", "update", "system"]);
const NotificationSchema = z.object({
  category: z.preprocess((value) => String(value || "system"), z.string()),
  title: z.preprocess((value) => String(value || "OUTSTAND").slice(0, 100), z.string().min(1).max(100)),
  body: z.preprocess((value) => String(value || "You have an update from OUTSTAND.").slice(0, 280), z.string().min(1).max(280)),
  url: z.preprocess((value) => typeof value === "string" && value.startsWith("/") ? value : "/", z.string()),
  dedupeKey: z.preprocess((value) => typeof value === "string" ? value.slice(0, 160) : null, z.string().max(160).nullable()),
});

const sendError = (res: VercelResponse, status: number, error: string, code: string) =>
  res.status(status).setHeader("Cache-Control", "no-store").json({ error, code });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") return sendError(res, 405, "Method not allowed.", "METHOD_NOT_ALLOWED");
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) return sendError(res, 401, "Authentication required.", "UNAUTHORIZED");

    const url = env("VITE_SUPABASE_URL", "SUPABASE_URL");
    const publishable = env("VITE_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_PUBLISHABLE_KEY");
    const serviceRole = env("SUPABASE_SERVICE_ROLE_KEY");
    const vapidPublic = env("VITE_VAPID_PUBLIC_KEY", "VAPID_PUBLIC_KEY");
    const vapidPrivate = env("VAPID_PRIVATE_KEY");
    if (!url || !publishable || !serviceRole || !vapidPublic || !vapidPrivate) return sendError(res, 503, "Notification server configuration is incomplete.", "SERVER_CONFIG_MISSING");

    const token = authorization.slice("Bearer ".length).trim();
    if (!token || token.length > 4096) return sendError(res, 401, "Authentication required.", "UNAUTHORIZED");
    const authClient = createClient(url, publishable, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) return sendError(res, 401, "Authentication failed.", "UNAUTHORIZED");

    const parsed = NotificationSchema.safeParse(req.body ?? {});
    if (!parsed.success || !categories.has(parsed.data?.category ?? "")) return sendError(res, 400, "Invalid notification payload.", "INVALID_PAYLOAD");
    const { category, title, body: message, url: targetUrl, dedupeKey = null } = parsed.data;

    const admin = createClient(url, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: preferences, error: preferencesError } = await admin.from("notification_preferences").select("*").eq("user_id", user.id).maybeSingle();
    if (preferencesError) {
      console.error("Notification preferences lookup failed", { code: preferencesError.code, message: preferencesError.message });
      return sendError(res, 500, "Could not load notification preferences.", preferencesError.code ?? "PREFERENCES_FAILED");
    }
    const prefs = preferences || { push_enabled: true, habits_enabled: true, goals_enabled: true, motivational_enabled: true, updates_enabled: true, quiet_hours_enabled: true, quiet_start: "22:00", quiet_end: "07:00", max_daily: 3 };
    if (!prefs.push_enabled) return res.status(200).json({ sent: false, reason: "disabled" });
    if (category === "habit" && !prefs.habits_enabled) return res.status(200).json({ sent: false, reason: "category_disabled" });
    if (category === "goal" && !prefs.goals_enabled) return res.status(200).json({ sent: false, reason: "category_disabled" });
    if (category === "motivation" && !prefs.motivational_enabled) return res.status(200).json({ sent: false, reason: "category_disabled" });
    if (category === "update" && !prefs.updates_enabled) return res.status(200).json({ sent: false, reason: "category_disabled" });

    const now = new Date();
    const [sh, sm] = String(prefs.quiet_start || "22:00").split(":").map(Number);
    const [eh, em] = String(prefs.quiet_end || "07:00").split(":").map(Number);
    const current = now.getHours() * 60 + now.getMinutes();
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    const quiet = Boolean(prefs.quiet_hours_enabled) && (start > end ? current >= start || current < end : current >= start && current < end);
    if (quiet) return res.status(200).json({ sent: false, reason: "quiet_hours" });

    const since = new Date(now);
    since.setHours(0, 0, 0, 0);
    const { count, error: countError } = await admin.from("notification_events").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", since.toISOString());
    if (countError) {
      console.error("Notification daily-limit lookup failed", { code: countError.code, message: countError.message });
      return sendError(res, 500, "Could not verify notification limits.", countError.code ?? "LIMIT_CHECK_FAILED");
    }
    if ((count ?? 0) >= Number(prefs.max_daily ?? 3)) return res.status(200).json({ sent: false, reason: "daily_limit" });

    if (dedupeKey) {
      const { data: duplicate, error: duplicateError } = await admin.from("notification_events").select("id").eq("user_id", user.id).eq("dedupe_key", dedupeKey).maybeSingle();
      if (duplicateError) {
        console.error("Notification dedupe lookup failed", { code: duplicateError.code, message: duplicateError.message });
        return sendError(res, 500, "Could not verify notification deduplication.", duplicateError.code ?? "DEDUPE_CHECK_FAILED");
      }
      if (duplicate) return res.status(200).json({ sent: false, reason: "duplicate" });
    }

    const { data: subs, error: subError } = await admin.from("push_subscriptions").select("id,endpoint,auth_key,p256dh_key").eq("user_id", user.id);
    if (subError) return sendError(res, 500, "Could not load push subscriptions.", subError.code ?? "SUBSCRIPTIONS_FAILED");
    if (!subs?.length) return sendError(res, 404, "No active push subscription found.", "NO_SUBSCRIPTION");

    webpush.setVapidDetails(env("VAPID_SUBJECT") || "mailto:notifications@outstand.app", vapidPublic, vapidPrivate);
    const payload = JSON.stringify({ title, body: message, icon: "/outstand-logo.png", badge: "/outstand-logo.png", url: targetUrl, tag: dedupeKey || `outstand-${category}`, renotify: true });
    let sent = 0;
    for (const sub of subs) {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { auth: sub.auth_key, p256dh: sub.p256dh_key } }, payload);
        sent += 1;
      } catch (error: any) {
        console.error("[Push] Delivery failed", { statusCode: error?.statusCode, message: error?.message });
        if (error?.statusCode === 404 || error?.statusCode === 410) await admin.from("push_subscriptions").delete().eq("id", sub.id);
      }
    }

    if (sent) {
      const { error: eventError } = await admin.from("notification_events").insert({ user_id: user.id, category, title, body: message, url: targetUrl, dedupe_key: dedupeKey, delivered_at: new Date().toISOString() });
      if (eventError) console.error("Notification event logging failed", { code: eventError.code, message: eventError.message });
    }
    return res.status(sent ? 200 : 502).json({ sent: sent > 0, devices: sent, ...(sent ? {} : { error: "Push delivery failed.", code: "DELIVERY_FAILED" }) });
  } catch (error) {
    console.error("Notification request failed", error);
    return sendError(res, 500, "Unexpected server error.", "INTERNAL_SERVER_ERROR");
  }
}
