import type { VercelRequest, VercelResponse } from "@vercel/node";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

const env = (...names: string[]) => names.map((name) => process.env[name]).find((value) => typeof value === "string" && value.trim());
const categories = new Set(["habit", "goal", "motivation", "update", "system"]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) return res.status(401).json({ error: "Authentication required" });

  // Keep server-side notification delivery on the exact Supabase project used
  // by the browser. A stale SUPABASE_URL can otherwise create a split-brain
  // setup where Auth succeeds but push_subscriptions appears empty.
  const url = env("VITE_SUPABASE_URL", "SUPABASE_URL");
  const publishable = env("VITE_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_PUBLISHABLE_KEY");
  const serviceRole = env("SUPABASE_SERVICE_ROLE_KEY");
  const vapidPublic = env("VITE_VAPID_PUBLIC_KEY", "VAPID_PUBLIC_KEY");
  const vapidPrivate = env("VAPID_PRIVATE_KEY");
  if (!url || !publishable || !serviceRole || !vapidPublic || !vapidPrivate) return res.status(503).json({ error: "Notification server configuration is incomplete" });

  const token = authorization.slice("Bearer ".length).trim();
  const authClient = createClient(url, publishable, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: { user }, error: authError } = await authClient.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: "Authentication failed" });

  const body = req.body && typeof req.body === "object" ? req.body : {};
  const category = String(body.category || "system");
  const title = String(body.title || "OUTSTAND").slice(0, 100);
  const message = String(body.body || "You have an update from OUTSTAND.").slice(0, 280);
  const targetUrl = typeof body.url === "string" && body.url.startsWith("/") ? body.url : "/";
  const dedupeKey = typeof body.dedupeKey === "string" ? body.dedupeKey.slice(0, 160) : null;
  if (!categories.has(category)) return res.status(400).json({ error: "Invalid notification category" });

  const admin = createClient(url, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: preferences } = await admin.from("notification_preferences").select("*").eq("user_id", user.id).maybeSingle();
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
  const { count } = await admin.from("notification_events").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", since.toISOString());
  if ((count ?? 0) >= Number(prefs.max_daily ?? 3)) return res.status(200).json({ sent: false, reason: "daily_limit" });

  if (dedupeKey) {
    const { data: duplicate } = await admin.from("notification_events").select("id").eq("user_id", user.id).eq("dedupe_key", dedupeKey).maybeSingle();
    if (duplicate) return res.status(200).json({ sent: false, reason: "duplicate" });
  }

  const { data: subs, error: subError } = await admin.from("push_subscriptions").select("id,endpoint,auth_key,p256dh_key").eq("user_id", user.id);
  if (subError) return res.status(500).json({ error: "Could not load push subscriptions", code: subError.code });
  if (!subs?.length) return res.status(404).json({ error: "No active push subscription found" });

  webpush.setVapidDetails(env("VAPID_SUBJECT") || "mailto:notifications@outstand.app", vapidPublic, vapidPrivate);
  const payload = JSON.stringify({ title, body: message, icon: "/icon-192x192.png", badge: "/badge-72x72.png", url: targetUrl, tag: dedupeKey || `outstand-${category}` });
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

  if (sent) await admin.from("notification_events").insert({ user_id: user.id, category, title, body: message, url: targetUrl, dedupe_key: dedupeKey, delivered_at: new Date().toISOString() });
  return res.status(sent ? 200 : 502).json({ sent: sent > 0, devices: sent });
}
