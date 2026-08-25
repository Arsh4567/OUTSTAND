import { Bell, Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { requestPushPermission } from "@/lib/notification-engine";
import { getNotificationPreferences } from "@/lib/notification-engine";
import { useAuth } from "@/hooks/use-auth";

const DISMISSED_PREFIX = "outstand-notification-banner-dismissed:";

export function NotificationPermissionBanner() {
  const { user } = useAuth();
  const userId = user?.id;
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!userId || typeof window === "undefined") {
      setVisible(false);
      return;
    }

    const key = `${DISMISSED_PREFIX}${userId}`;
    if (window.localStorage.getItem(key) === "1") {
      setVisible(false);
      return;
    }

    if (!("Notification" in window)) {
      setVisible(false);
      return;
    }

    if (Notification.permission === "granted") {
      void getNotificationPreferences().then((preferences) => {
        if (cancelled) return;
        setVisible(!preferences.push_enabled);
      }).catch(() => {
        if (!cancelled) setVisible(false);
      });
      return () => { cancelled = true; };
    }

    setVisible(Notification.permission !== "denied");
    return () => { cancelled = true; };
  }, [userId]);

  const dismiss = () => {
    if (userId) window.localStorage.setItem(`${DISMISSED_PREFIX}${userId}`, "1");
    setVisible(false);
  };

  const enable = async () => {
    setBusy(true);
    try {
      await requestPushPermission();
      toast.success("Notifications are on");
      dismiss();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not enable notifications.");
    } finally {
      setBusy(false);
    }
  };

  if (!visible || !userId) return null;

  return (
    <aside className="mx-auto w-full max-w-5xl px-4 pt-4 md:px-8" aria-label="Notification preferences">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground ring-1 ring-border">
              <Bell className="size-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-foreground">Want useful reminders?</h2>
              <p className="mt-1 max-w-2xl text-sm leading-5 text-muted-foreground">
                Get focus, habit and goal reminders from OUTSTAND. Nothing is enabled until you choose.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2 sm:pl-4">
            <Button size="sm" disabled={busy} onClick={() => void enable()}>
              <Check className="mr-1.5 size-4" />
              Turn on notifications
            </Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={dismiss} className="text-muted-foreground hover:text-foreground">
              <X className="mr-1.5 size-4" />
              Not now
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
