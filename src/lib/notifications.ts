import { supabase } from "@/integrations/supabase/client";
import { disablePushNotifications, requestPushPermission } from "@/lib/notification-engine";

export async function requestNotificationPermission() { await requestPushPermission(); return true; }
export { disablePushNotifications };

export async function handleTestPush() {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) throw new Error("Please sign in before testing notifications.");
  const { data, error } = await supabase.functions.invoke("outstand-ai", { body: { action: "test_push" }, headers: { Authorization: `Bearer ${session.access_token}` } });
  if (error) throw new Error(error.message || "The test notification could not be checked.");
  if (data?.error) throw new Error(String(data.error));
  return true;
}
