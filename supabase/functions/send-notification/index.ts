import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import webpush from "npm:web-push@3.6.7";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:notifications@outstand.app";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false, autoRefreshToken: false } });
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

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

  try {
    const { event_id } = await req.json();
    if (!event_id) return response({ error: "event_id is required" }, 400);

    const { data: event, error: eventError } = await admin
      .from("notification_events")
      .select("id,user_id,category,title,body,url,delivered_at")
      .eq("id", event_id)
      .maybeSingle();
    if (eventError || !event) return response({ error: "Notification event not found" }, 404);
    if (event.delivered_at) return response({ sent: true, already_delivered: true });

    const { data: prefs } = await admin.from("notification_preferences").select("*").eq("user_id", event.user_id).maybeSingle();
    const preferences = prefs ?? { push_enabled: false, quiet_hours_enabled: true, quiet_start: "22:00", quiet_end: "07:00", max_daily: 3, timezone: "UTC" };
    if (!preferences.push_enabled || withinQuietHours(new Date(), preferences)) return response({ sent: false, reason: "blocked" });

    const { count } = await admin
      .from("notification_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", event.user_id)
      .gte("created_at", new Date(new Date().setUTCHours(0, 0, 0, 0)).toISOString())
      .not("delivered_at", "is", null);
    if ((count ?? 0) >= Number(preferences.max_daily ?? 3)) return response({ sent: false, reason: "daily_limit" });

    const { data: subscriptions, error: subError } = await admin
      .from("push_subscriptions")
      .select("id,endpoint,auth_key,p256dh_key")
      .eq("user_id", event.user_id);
    if (subError) return response({ error: subError.message }, 500);
    if (!subscriptions?.length) return response({ sent: false, reason: "no_subscription" });

    const payload = JSON.stringify({ title: event.title, body: event.body, icon: "/outstand-logo.png", badge: "/outstand-logo.png", url: event.url, tag: event.id, renotify: true });
    let delivered = 0;

    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { auth: subscription.auth_key, p256dh: subscription.p256dh_key } }, payload);
        delivered += 1;
      } catch (error) {
        const statusCode = Number((error as any)?.statusCode || 0);
        if (statusCode === 404 || statusCode === 410) await admin.from("push_subscriptions").delete().eq("id", subscription.id);
      }
    }

    if (delivered > 0) {
      await admin.from("notification_events").update({ delivered_at: new Date().toISOString() }).eq("id", event.id);
    }

    return response({ sent: delivered > 0, devices: delivered });
  } catch (error) {
    console.error("[send-notification]", error);
    return response({ error: "Unexpected notification delivery error" }, 500);
  }
});
