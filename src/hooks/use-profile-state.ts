import { useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAppState } from "@/hooks/use-app-state";
import { useAuth, displayNameOf } from "@/hooks/use-auth";
import { useWeeklyLogs } from "@/hooks/use-dopamine";
import { lastNDays, levelFromXP, todayISO } from "@/lib/habits";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useProfileState() {
  const appState = useAppState();
  const habits = appState.habits || [];
  const sessions = appState.sessions || [];
  const outstand = appState.outstand || [];
  const xp = appState.xp || 0;
  const bestStreak = appState.bestStreak || 0;
  const streaks = appState.streaks || [];
  const { user, profile, updateProfile } = useAuth();
  const { logs = [] } = useWeeklyLogs(7) || {};
  const { logs: monthLogs = [] } = useWeeklyLogs(30) || {};
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftBio, setDraftBio] = useState("");
  const [draftUsername, setDraftUsername] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { level = 1, into = 0, need = 100 } = levelFromXP(xp) || {};
  const pct = need > 0 ? Math.min(100, Math.round((into / need) * 100)) : 0;
  const name = user ? displayNameOf(user, profile) : "Loading...";

  const stats = useMemo(() => {
    const today = todayISO(); const days = lastNDays(30);
    const dayStats = days.map((d) => { const done = habits.filter((habit) => habit?.history?.includes(d)).length; const total = habits.length; return { d, done, total, ratio: total ? done / total : 0 }; });
    const totalCompletions = habits.reduce((sum, habit) => sum + (habit?.history?.length || 0), 0);
    const completedSessions = sessions.filter((session) => session?.completed);
    const focusMinutes = completedSessions.reduce((sum, session) => sum + (session?.durationMin || 0), 0);
    const avg = logs.length ? Math.round(logs.reduce((sum, log) => sum + (log?.score || 0), 0) / logs.length) : 0;
    let current = 0; let longest = 0;
    for (const log of monthLogs) { if ((log?.score || 0) >= 70) { current += 1; longest = Math.max(longest, current); } else current = 0; }
    const habitPct = habits.length ? Math.round((habits.filter((habit) => habit?.history?.includes(today)).length / habits.length) * 100) : 0;
    const weekStart = Date.now() - 7 * 86400000;
    const focusHoursWeek = completedSessions.filter((session) => session?.startedAt && new Date(session.startedAt).getTime() >= weekStart).reduce((sum, session) => sum + (session?.durationMin || 0), 0) / 60;
    const productivity = Math.min(100, Math.round(habitPct * 0.4 + Math.min(100, focusHoursWeek * 10) * 0.6));
    return { dayStats, totalCompletions, focusCompleted: completedSessions.length, focusMinutes, avg, longest, habitPct, productivity };
  }, [habits, sessions, logs, monthLogs]);

  const beginEdit = () => { setDraftName(profile?.full_name || profile?.display_name || ""); setDraftBio(profile?.bio || ""); setDraftUsername(profile?.username || ""); setIsEditing(true); };
  const saveProfile = async () => {
    const cleanName = draftName.trim().slice(0, 80); const cleanBio = draftBio.trim().slice(0, 240); const cleanUsername = draftUsername.trim().replace(/^@+/, "").replace(/\s+/g, "_").slice(0, 24);
    if (!cleanName) return toast.error("Name cannot be empty.");
    if (cleanUsername && !/^[A-Za-z0-9_]{3,24}$/.test(cleanUsername)) return toast.error("Username must be 3–24 letters, numbers, or underscores.");
    const result = await updateProfile({ full_name: cleanName, bio: cleanBio || null, username: cleanUsername || null });
    if (result.error) { toast.error(result.error.message.includes("unique") ? "That username is already taken." : result.error.message); return; }
    setIsEditing(false); toast.success("Profile updated");
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file || !user?.id) return;
    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!allowedTypes.has(file.type)) return toast.error("Choose a JPG, PNG, or WebP image.");
    if (file.size > 4 * 1024 * 1024) return toast.error("Avatar must be under 4 MB.");
    setIsUploading(true);
    try {
      const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: false, cacheControl: "3600", contentType: file.type });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const result = await updateProfile({ avatar_url: data.publicUrl });
      if (result.error) throw result.error;
      toast.success("Avatar updated");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not update avatar."); }
    finally { setIsUploading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) { toast.error("Could not sign out. Please try again."); return; }
    toast("Signed out"); navigate({ to: "/auth", replace: true });
  };

  const handleCopyId = async () => {
    if (!user?.id) return;
    try { await navigator.clipboard.writeText(user.id); setCopiedId(true); toast.success("User ID copied"); window.setTimeout(() => setCopiedId(false), 1800); }
    catch { toast.error("Could not copy the user ID. Check browser permissions."); }
  };

  const getAuraColor = (prod: number) => prod >= 90 ? "from-violet-500 via-fuchsia-500 to-cyan-500" : prod >= 70 ? "from-emerald-400 via-cyan-500 to-blue-500" : prod >= 40 ? "from-amber-400 via-orange-500 to-rose-500" : "from-slate-500 via-slate-600 to-zinc-700";
  const getRankTitle = (lvl: number) => lvl >= 50 ? "Grandmaster" : lvl >= 30 ? "Ascended" : lvl >= 15 ? "Disciplined" : lvl >= 5 ? "Initiate" : "Novice";
  return { user, profile, name, level, into, need, pct, xp, bestStreak, habits, streaks, logs, outstand, stats, isEditing, setIsEditing, draftName, setDraftName, draftBio, setDraftBio, draftUsername, setDraftUsername, isUploading, copiedId, fileInputRef, beginEdit, saveProfile, handleAvatarUpload, signOut, handleCopyId, getAuraColor, getRankTitle };
}
