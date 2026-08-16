import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, ChevronRight, Edit3, LogOut, Moon, Send, Settings, Smartphone, Sparkles, Sun, Trash2, X, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { requestPushPermission, disablePushNotifications, getNotificationPreferences, saveNotificationPreferences, type NotificationPreferences } from "@/lib/notification-engine";

interface AppSettingsSheetProps {
  isOpen?: boolean;
  onClose?: () => void;
  theme?: "dark" | "light";
  onThemeChange?: (theme: "dark" | "light") => void;
  haptics?: boolean;
  onHapticsChange?: (haptics: boolean) => void;
  isNotificationsGranted?: boolean;
  onNotificationToggle?: () => void;
  isTestingPush?: boolean;
  onTestPush?: () => void;
  onNavigateProfile?: () => void;
  onClearData?: () => void;
  onSignOut?: () => void;
}

export function AppSettingsSheet(props: AppSettingsSheetProps) {
  const controlled = typeof props.isOpen === "boolean";
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlled ? props.isOpen : internalOpen;
  const close = () => { props.onClose?.(); setInternalOpen(false); };
  const [theme, setTheme] = useState<"dark" | "light">(props.theme ?? "dark");
  const [haptics, setHaptics] = useState(props.haptics ?? true);
  const [notificationsGranted, setNotificationsGranted] = useState(props.isNotificationsGranted ?? false);
  const [testing, setTesting] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [feedback, setFeedback] = useState("");
  const [sendingFeedback, setSendingFeedback] = useState(false);

  useEffect(() => {
    if (props.theme) setTheme(props.theme);
    if (typeof props.haptics === "boolean") setHaptics(props.haptics);
    if (typeof props.isNotificationsGranted === "boolean") setNotificationsGranted(props.isNotificationsGranted);
  }, [props.theme, props.haptics, props.isNotificationsGranted]);

  useEffect(() => {
    if (!isOpen) return;
    void getNotificationPreferences().then(setPreferences).catch(() => undefined);
    if (typeof window !== "undefined" && "Notification" in window) setNotificationsGranted(Notification.permission === "granted");
  }, [isOpen]);

  const changeTheme = (next: "dark" | "light") => {
    setTheme(next); props.onThemeChange?.(next); localStorage.setItem("outstand-theme", next);
  };

  const changeHaptics = (next: boolean) => {
    setHaptics(next); props.onHapticsChange?.(next); localStorage.setItem("outstand-haptics", String(next));
  };

  const enableNotifications = async () => {
    try {
      if (props.onNotificationToggle) {
        await props.onNotificationToggle();
      } else {
        await requestPushPermission();
      }
      setNotificationsGranted(true);
      setPreferences(await getNotificationPreferences());
      toast.success("Notifications enabled 🔔");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not enable notifications.");
    }
  };

  const disableNotifications = async () => {
    try {
      await disablePushNotifications();
      setNotificationsGranted(false);
      setPreferences(await getNotificationPreferences());
      toast.success("Notifications paused.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not disable notifications.");
    }
  };

  const testPush = async () => {
    setTesting(true);
    try {
      if (props.onTestPush) {
        await props.onTestPush();
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Please sign in first.");
      const response = await fetch("/api/send-test-push", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Test notification failed.");
      toast.success("Test notification sent! 🚀");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send test notification.");
    } finally {
      setTesting(false);
    }
  };

  const updatePreference = async (patch: Partial<NotificationPreferences>) => {
    try { setPreferences(await saveNotificationPreferences(patch)); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not save notification settings."); }
  };

  const sendFeedback = async () => {
    const message = feedback.trim();
    if (!message) return toast.error("Write some feedback first.");
    setSendingFeedback(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in first.");
      const { error } = await supabase.from("user_feedback").insert({ user_id: user.id, message });
      if (error) throw error;
      setFeedback("");
      toast.success("Thanks! Your feedback was sent 💙");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not send feedback."); }
    finally { setSendingFeedback(false); }
  };

  const clearData = props.onClearData ?? (() => { localStorage.clear(); window.location.reload(); });
  const signOut = props.onSignOut ?? (async () => { await supabase.auth.signOut(); window.location.assign("/auth"); });

  return (
    <>
      {!controlled && (
        <button type="button" onClick={() => setInternalOpen(true)} className="group flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.025] p-3 text-left transition hover:border-cyan-300/20 hover:bg-white/[0.06]">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-400/10 text-cyan-200"><Settings className="h-[18px] w-[18px] transition-transform group-hover:rotate-45" /></div>
          <div className="min-w-0 flex-1"><div className="text-sm font-bold text-white">Settings</div><div className="mt-0.5 text-[10px] text-slate-500">Notifications, preferences & feedback</div></div>
          <ChevronRight className="h-4 w-4 text-slate-700 group-hover:text-slate-400" />
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-md" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="fixed bottom-0 left-0 right-0 z-[80] mx-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[2.5rem] border border-white/10 bg-[#07101f] p-5 shadow-2xl md:bottom-auto md:top-[5%] md:rounded-[2.5rem] md:p-7">
              <div className="mb-6 flex items-start justify-between">
                <div><div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-200"><Settings className="h-3 w-3" /> Control Center</div><h2 className="text-2xl font-black text-white">Settings</h2><p className="mt-1 text-sm text-slate-400">Control how OUTSTAND communicates with you.</p></div>
                <button onClick={close} className="grid h-10 w-10 place-items-center rounded-full bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button>
              </div>

              <div className="space-y-5 pb-4">
                <section className="rounded-3xl border border-cyan-300/10 bg-cyan-400/[0.035] p-4">
                  <div className="mb-4 flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-200"><Bell className="h-5 w-5" /></div><div><h3 className="font-bold text-white">Notifications</h3><p className="text-xs text-slate-500">Permission is requested only when you enable them.</p></div></div>
                  <div className="flex items-center justify-between rounded-2xl bg-black/20 p-4"><div><p className="font-semibold text-slate-200">Allow push notifications</p><p className="text-xs text-slate-500">Habits, goals, motivation and OUTSTAND updates.</p></div><button onClick={() => void (notificationsGranted ? disableNotifications() : enableNotifications())} className={cn("h-7 w-12 rounded-full p-1 transition", notificationsGranted ? "bg-cyan-500" : "bg-slate-700")}><motion.div layout className="h-5 w-5 rounded-full bg-white" animate={{ x: notificationsGranted ? 20 : 0 }} /></button></div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <button disabled={!notificationsGranted || testing} onClick={() => void testPush()} className="flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/15 bg-cyan-400/10 px-4 py-3 text-sm font-bold text-cyan-100 disabled:cursor-not-allowed disabled:opacity-40"><Send className="h-4 w-4" />{testing ? "Sending…" : "Send test notification"}</button>
                    <button onClick={() => { close(); window.location.assign("/notifications"); }} className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-slate-200"><Sparkles className="h-4 w-4" />Open notification center</button>
                  </div>
                </section>

                {preferences && <section className="rounded-3xl border border-white/8 bg-white/[0.025] p-4"><div className="mb-4 flex items-center gap-2"><Sparkles className="h-4 w-4 text-cyan-300" /><h3 className="font-bold text-white">Set notifications</h3></div><div className="space-y-2">
                  {[['habits_enabled','Habit reminders'],['goals_enabled','Goal reminders'],['motivational_enabled','Motivation'],['updates_enabled','OUTSTAND updates']].map(([key,label]) => <div key={key} className="flex items-center justify-between rounded-2xl bg-white/[0.025] p-3"><span className="text-sm text-slate-200">{label}</span><button disabled={!notificationsGranted} onClick={() => void updatePreference({ [key]: !preferences[key as keyof NotificationPreferences] })} className={cn("h-6 w-10 rounded-full p-1", preferences[key as keyof NotificationPreferences] ? "bg-cyan-500" : "bg-slate-700", !notificationsGranted && "opacity-40")}><motion.div layout className="h-4 w-4 rounded-full bg-white" animate={{ x: preferences[key as keyof NotificationPreferences] ? 16 : 0 }} /></button></div>)}
                  <div className="flex items-center justify-between rounded-2xl bg-white/[0.025] p-3"><span className="text-sm text-slate-200">Quiet hours</span><button onClick={() => void updatePreference({ quiet_hours_enabled: !preferences.quiet_hours_enabled })} className={cn("h-6 w-10 rounded-full p-1", preferences.quiet_hours_enabled ? "bg-cyan-500" : "bg-slate-700")}><motion.div layout className="h-4 w-4 rounded-full bg-white" animate={{ x: preferences.quiet_hours_enabled ? 16 : 0 }} /></button></div>
                </div></section>}

                <section className="rounded-3xl border border-white/8 bg-white/[0.025] p-4"><div className="mb-3 flex items-center gap-2"><MessageSquare className="h-4 w-4 text-cyan-300" /><h3 className="font-bold text-white">Feedback</h3></div><textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} maxLength={2000} rows={4} placeholder="Tell us what you like, what is broken, or what you want next…" className="w-full resize-none rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/30" /><div className="mt-2 flex items-center justify-between"><span className="text-[10px] text-slate-600">{feedback.length}/2000</span><button disabled={sendingFeedback} onClick={() => void sendFeedback()} className="rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 disabled:opacity-50">{sendingFeedback ? "Sending…" : "Send feedback"}</button></div></section>

                <section className="rounded-3xl border border-white/8 bg-white/[0.025] p-4"><h3 className="mb-3 font-bold text-white">Preferences</h3><div className="space-y-2"><div className="flex items-center justify-between rounded-2xl bg-white/[0.025] p-3"><div className="flex items-center gap-3"><Smartphone className="h-4 w-4 text-indigo-300" /><span className="text-sm text-slate-200">Haptic feedback</span></div><button onClick={() => changeHaptics(!haptics)} className={cn("h-6 w-10 rounded-full p-1", haptics ? "bg-indigo-500" : "bg-slate-700")}><motion.div layout className="h-4 w-4 rounded-full bg-white" animate={{ x: haptics ? 16 : 0 }} /></button></div><div className="flex items-center justify-between rounded-2xl bg-white/[0.025] p-3"><div className="flex items-center gap-3">{theme === "dark" ? <Moon className="h-4 w-4 text-amber-300" /> : <Sun className="h-4 w-4 text-amber-300" />}<span className="text-sm text-slate-200">Theme</span></div><div className="flex gap-1 rounded-xl bg-black/20 p-1"><button onClick={() => changeTheme("dark")} className={cn("rounded-lg px-3 py-1 text-xs font-bold", theme === "dark" ? "bg-white/10 text-white" : "text-slate-500")}>Dark</button><button onClick={() => changeTheme("light")} className={cn("rounded-lg px-3 py-1 text-xs font-bold", theme === "light" ? "bg-white/10 text-white" : "text-slate-500")}>Light</button></div></div></div></section>

                <section className="rounded-3xl border border-white/8 bg-white/[0.025] p-4"><button onClick={() => { close(); props.onNavigateProfile?.(); }} className="flex w-full items-center gap-3 rounded-2xl p-3 text-left hover:bg-white/[0.04]"><Edit3 className="h-4 w-4 text-blue-300" /><span className="text-sm font-semibold text-slate-200">Edit profile</span></button><button onClick={clearData} className="mt-1 flex w-full items-center gap-3 rounded-2xl p-3 text-left text-red-300 hover:bg-red-500/5"><Trash2 className="h-4 w-4" /><span className="text-sm font-semibold">Clear local data</span></button><button onClick={() => { close(); void signOut(); }} className="mt-1 flex w-full items-center gap-3 rounded-2xl p-3 text-left text-red-300 hover:bg-red-500/5"><LogOut className="h-4 w-4" /><span className="text-sm font-semibold">Sign out</span></button></section>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
