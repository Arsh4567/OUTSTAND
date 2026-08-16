import type { VercelRequest, VercelResponse } from "@vercel/node";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

const env = (...names: string[]) => names.map((name) => process.env[name]).find((value) => typeof value === "string" && value.trim());

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) return res.status(401).json({ error: "Authentication required" });

  const supabaseUrl = env("SUPABASE_URL", "VITE_SUPABASE_URL");
  const publishableKey = env("SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY");
  const serviceRoleKey = env("SUPABASE_SERVICE_ROLE_KEY");
  const publicKey = env("VAPID_PUBLIC_KEY", "VITE_VAPID_PUBLIC_KEY");
  const privateKey = env("VAPID_PRIVATE_KEY");

  if (!supabaseUrl || !publishableKey || !serviceRoleKey || !publicKey || !privateKey) {
    return res.status(503).json({ error: "Push notification server configuration is incomplete" });
  }

  const token = authorization.slice("Bearer ".length);
  const authClient = createClient(supabaseUrl, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error: authError } = await authClient.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: "Authentication failed" });

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  webpush.setVapidDetails(env("VAPID_SUBJECT") || "mailto:notifications@outstand.app", publicKey, privateKey);

  const { data: subs, error } = await admin.from("push_subscriptions").select("endpoint,auth_key,p256dh_key").eq("user_id", user.id);
  if (error) return res.status(500).json({ error: "Could not load notification subscriptions" });
  if (!subs?.length) return res.status(404).json({ error: "No push subscription found for this account" });

  const payload = JSON.stringify({
    title: "OUTSTAND 🤖",
    body: "Your notifications are working. You're ready for smarter reminders! 🎉",
    icon: "/icon-192x192.png",
    badge: "/badge-72x72.png",
    url: "/",
    tag: "outstand-test",
  });

  let sent = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: { auth: sub.auth_key, p256dh: sub.p256dh_key } }, payload);
      sent += 1;
    } catch (error: any) {
      // Expired/unregistered browser subscriptions should be removed automatically.
      if (error?.statusCode === 404 || error?.statusCode === 410) {
        await admin.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      }
    }
  }

  return res.status(sent ? 200 : 502).json({ success: sent > 0, sent });
}
