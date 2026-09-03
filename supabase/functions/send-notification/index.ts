import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import webpush from "npm:web-push@3.6.7";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const env = (...names: string[]) => names.map((name) => Deno.env.get(name)?.trim()).find(Boolean);
const SUPABASE_URL = env("SUPABASE_URL");
const SERVICE_ROLE = env("SUPABASE_SERVICE_ROLE_KEY");
const VAPID_PUBLIC = env("VITE_VAPID_PUBLIC_KEY", "VAPID_PUBLIC_KEY");
const VAPID_PRIVATE = env("VAPID_PRIVATE_KEY");
const VAPID_SUBJECT = env("VAPID_SUBJECT") || "mailto:notifications@outstand.app";

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function withinQuietHours(now: Date, preferences: any) {
  if (!preferences.quiet_hours_enabled) return false;
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: preferences.timezone || "UTC", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(now);
    const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
    const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
    const current = h * 60 + m;
    const [sh, sm] = String(preferences.quiet_start || "22:00").slice(0, 5).split(":").map(Number);
    const [eh, em] = String(preferences.quiet_end || "07:00").slice(0, 5).split(":").map(Number);
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    return start > end ? current >= start || current < end : current >= start && current < end;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return response({ error: "Method not allowed" }, 405);

  if (!SUPABASE_URL || !SERVICE_ROLE || !VAPID_PUBLIC || !VAPID_PRIVATE) {
    console.error("[send-notification] Missing notification configuration", {
      supabase_url: Boolean(SUPABASE_URL), service_role: Boolean(SERVICE_ROLE),
      vapid_public: Boolean(VAPID_PUBLIC), vapid_private: Boolean(VAPID_PRIVATE),
    });
    return response({ error: "Notification configuration incomplete." }, 503);
  }

  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

    const { event_id } = await req.json();
    if (!event_id) return response({ error: "event_id is required" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: event, error: eventError } = await admin.from("notification_events").select("id,user_id,category,title,body,url,delivered_at").eq("id", event_id).maybeSingle();
    if (eventError) return response({ error: eventError.message }, 500);
    if (!event) return response({ error: "Notification event not found" }, 404);
    if (event.delivered_at) return response({ sent: true, already_delivered: true });

    const { data: prefs, error: prefsError } = await admin.from("notification_preferences").select("*").eq("user_id", event.user_id).maybeSingle();
    if (prefsError) return response({ error: prefsError.message }, 500);
    const preferences = prefs ?? { push_enabled: false, quiet_hours_enabled: true, quiet_start: "22:00", quiet_end: "07:00", max_daily: 3, timezone: "UTC" };
    if (!preferences.push_enabled) return response({ sent: false, reason: "push_disabled" });

    const isTest = event.category === "system" && String(event.title || "").toLowerCase().includes("test notification");
    if (!isTest && withinQuietHours(new Date(), preferences)) return response({ sent: false, reason: "blocked_by_quiet_hours" });

    if (!isTest) {
      const dayStart = new Date();
      dayStart.setUTCHours(0, 0, 0, 0);
      const { count, error: countError } = await admin.from("notification_events").select("id", { count: "exact", head: true }).eq("user_id", event.user_id).gte("created_at", dayStart.toISOString()).not("delivered_at", "is", null);
      if (countError) return response({ error: countError.message }, 500);
      if ((count ?? 0) >= Number(preferences.max_daily ?? 3)) return response({ sent: false, reason: "daily_limit" });
    }

    // Test notifications are device diagnostics. Send only to the newest subscription,
    // which is the subscription created/refreshed by the device that just enabled push.
    // Scheduled notifications continue to fan out to every valid device.
    let subscriptionsQuery = admin.from("push_subscriptions").select("id,endpoint,auth_key,p256dh_key,created_at").eq("user_id", event.user_id);
    if (isTest) subscriptionsQuery = subscriptionsQuery.order("created_at", { ascending: false }).limit(1);
    const { data: subscriptions, error: subError } = await subscriptionsQuery;
    if (subError) return response({ error: subError.message }, 500);
    if (!subscriptions?.length) return response({ sent: false, reason: "no_subscription" });

    const payload = JSON.stringify({ title: event.title, body: event.body, icon: "/outstand-logo.png", badge: "/outstand-logo.png", url: event.url, tag: isTest ? "outstand-test" : event.id, renotify: false });
    let delivered = 0;
    const failures: Array<{ status?: number; message: string }> = [];

    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: subscription.endpoint, keys: { auth: subscription.auth_key, p256dh: subscription.p256dh_key } },
          payload,
        );
        delivered += 1;
      } catch (error) {
        const statusCode = Number((error as any)?.statusCode || 0) || undefined;
        const providerBody = typeof (error as any)?.body === "string" ? String((error as any).body).slice(0, 300) : "";
        const message = providerBody || ((error as any)?.message ? String((error as any).message).slice(0, 300) : "Push provider rejected the subscription.");
        failures.push({ status: statusCode, message });
        if (statusCode === 404 || statusCode === 410) {
          const { error: deleteError } = await admin.from("push_subscriptions").delete().eq("id", subscription.id);
          if (deleteError) console.error("[send-notification] Failed to remove expired subscription", deleteError.message);
        }
      }
    }

    if (delivered > 0) {
      const { error: deliveredError } = await admin.from("notification_events").update({ delivered_at: new Date().toISOString() }).eq("id", event.id).is("delivered_at", null);
      if (deliveredError) return response({ error: deliveredError.message }, 500);
      return response({ sent: true, devices: delivered, failed_devices: failures.length });
    }

    console.error("[send-notification] All push deliveries failed", { event_id: event.id, failures: failures.slice(0, 3) });
    return response({ sent: false, devices: 0, reason: "push_provider_rejected", error: failures[0]?.message || "Push provider rejected every subscription." }, 502);
  } catch (error) {
    console.error("[send-notification]", error);
    return response({ error: error instanceof Error ? error.message : "Unexpected notification delivery error" }, 500);
  }
});
