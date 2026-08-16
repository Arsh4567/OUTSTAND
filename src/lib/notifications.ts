import { supabase } from "@/integrations/supabase/client";
import { disablePushNotifications, requestPushPermission } from "@/lib/notification-engine";

/** Backward-compatible entry point used by existing settings/UI. */
export async function requestNotificationPermission() {
  // Do not swallow the error here. The settings UI needs the real failure
  // so it cannot show "enabled" when no subscription was saved.
  await requestPushPermission();
  return true;
}

export { disablePushNotifications };

/** Send a development/manual push to the currently signed-in user. */
export async function handleTestPush() {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) throw new Error("Please sign in before testing notifications.");

  const response = await fetch("/api/send-test-push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "The test notification could not be sent.");
  return true;
}
