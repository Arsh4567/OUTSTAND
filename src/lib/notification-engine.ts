import { supabase } from "@/integrations/supabase/client";

export type NotificationCategory = "habit" | "goal" | "motivation" | "update" | "system";

export type NotificationPreferences = {
  push_enabled: boolean;
  habits_enabled: boolean;
  goals_enabled: boolean;
  motivational_enabled: boolean;
  updates_enabled: boolean;
  quiet_hours_enabled: boolean;
  quiet_start: string;
  quiet_end: string;
  max_daily: number;
  timezone: string;
};

const DEFAULTS: NotificationPreferences = {
  push_enabled: false,
  habits_enabled: true,
  goals_enabled: true,
  motivational_enabled: true,
  updates_enabled: true,
  quiet_hours_enabled: true,
  quiet_start: "22:00",
  quiet_end: "07:00",
  max_daily: 3,
  timezone: "UTC",
};

const QUOTES = [
  "Small wins compound. Just take the next step. 🔵",
  "You don't need a perfect day. You need one good decision.",
  "Momentum starts with something small enough to do right now. ⚡",
  "Progress is still progress when nobody else sees it.",
  "Make today a little better than yesterday. 🎯",
];

export function motivationalMessage(seed = Date.now()) {
  return QUOTES[Math.abs(seed) % QUOTES.length];
}

export function isWithinQuietHours(now = new Date(), preferences: NotificationPreferences = DEFAULTS) {
  if (!preferences.quiet_hours_enabled) return false;
  const [startH, startM] = preferences.quiet_start.split(":").map(Number);
  const [endH, endM] = preferences.quiet_end.split(":").map(Number);
  const current = now.getHours() * 60 + now.getMinutes();
  const start = startH * 60 + startM;
  const end = endH * 60 + endM;
  return start > end ? current >= start || current < end : current >= start && current < end;
}

export function canNotify(category: NotificationCategory, preferences: NotificationPreferences, now = new Date()) {
  if (!preferences.push_enabled || isWithinQuietHours(now, preferences)) return false;
  if (category === "habit" && !preferences.habits_enabled) return false;
  if (category === "goal" && !preferences.goals_enabled) return false;
  if (category === "motivation" && !preferences.motivational_enabled) return false;
  if (category === "update" && !preferences.updates_enabled) return false;
  return true;
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return DEFAULTS;
  const { data, error } = await supabase.from("notification_preferences").select("*").eq("user_id", user.id).maybeSingle();
  if (error || !data) return { ...DEFAULTS, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC" };
  return { ...DEFAULTS, ...data } as NotificationPreferences;
}

export async function saveNotificationPreferences(patch: Partial<NotificationPreferences>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in to change notification settings.");
  const current = await getNotificationPreferences();
  const next = { ...current, ...patch, user_id: user.id };
  const { error } = await supabase.from("notification_preferences").upsert(next, { onConflict: "user_id" });
  if (error) throw error;
  return next;
}

export async function getNotificationHistory(limit = 30) {
  const { data, error } = await supabase.from("notification_events").select("id,category,title,body,url,delivered_at,created_at").order("created_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function requestPushPermission() {
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("Push notifications aren't supported by this browser.");
  }
  const permission = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
  if (permission !== "granted") throw new Error("Notification permission was not granted.");
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Please sign in first.");
  await navigator.serviceWorker.register("/sw.js");
  const registration = await navigator.serviceWorker.ready;
  const vapid = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!vapid) throw new Error("Push notifications are not configured yet.");
  const key = Uint8Array.from(atob(vapid.replace(/-/g, "+").replace(/_/g, "/") + "=="), (char) => char.charCodeAt(0));
  const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.auth || !json.keys?.p256dh) throw new Error("The browser returned an invalid push subscription.");
  const { error } = await supabase.from("push_subscriptions").upsert({ user_id: session.user.id, endpoint: json.endpoint, auth_key: json.keys.auth, p256dh_key: json.keys.p256dh }, { onConflict: "user_id,endpoint" });
  if (error) throw error;
  await saveNotificationPreferences({ push_enabled: true });
  return subscription;
}

export async function disablePushNotifications() {
  const registration = await navigator.serviceWorker.getRegistration("/sw.js");
  const subscription = await registration?.pushManager.getSubscription();
  if (subscription) {
    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();
    await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  }
  await saveNotificationPreferences({ push_enabled: false });
}

export function notifyWhileAppIsOpen(title: string, body: string, url = "/") {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const notification = new Notification(title, { body, icon: "/icon-192x192.png", badge: "/badge-72x72.png" });
  notification.onclick = () => { window.location.assign(url); };
}
