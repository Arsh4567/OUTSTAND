import { Bell, Check, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { requestPushPermission } from "@/lib/notification-engine";

const DISMISSED_PREFIX = "outstand-notification-banner-dismissed:";

export function NotificationPermissionBanner({ userId }: { userId?: string }) {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!userId || typeof window === "undefined") return;
    setVisible(window.localStorage.getItem(`${DISMISSED_PREFIX}${userId}`) !== "1");
  }, [userId]);

  const dismiss = () => {
    if (userId) window.localStorage.setItem(`${DISMISSED_PREFIX}${userId}`, "1");
    setVisible(false);
  };

  const enable = async () => {
    setBusy(true);
    try {
      await requestPushPermission();
      toast.success("Notifications are on 🔔");
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
      <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-500/[0.09] via-primary/[0.06] to-violet-500/[0.08] p-4 shadow-sm md:p-5">
        <div className="absolute -right-10 -top-10 size-28 rounded-full bg-blue-500/10 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
              <Bell className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-foreground">Want useful reminders?</h2>
                <Sparkles className="hidden size-3.5 text-primary sm:block" />
              </div>
              <p className="mt-1 max-w-2xl text-sm leading-5 text-muted-foreground">
                Get focus, habit and goal nudges from OUTSTAND. You stay in control — nothing is enabled until you choose.
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
