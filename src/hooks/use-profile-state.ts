import { useMemo, useState, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAppState } from "@/hooks/use-app-state";
import { useAuth, displayNameOf } from "@/hooks/use-auth";
import { useWeeklyLogs } from "@/hooks/use-dopamine";
import { lastNDays, levelFromXP, todayISO } from "@/lib/habits";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useProfileState() {
  const appState = useAppState() || {};
  const habits = appState.habits || [];
  const sessions = appState.sessions || [];
  const outstand = appState.outstand || [];
  const xp = appState.xp || 0;
  const bestStreak = appState.bestStreak || 0;
  const streaks = appState.streaks || [];

  const authContext = useAuth() || {};
  const user = authContext.user || null;
  const profile = authContext.profile || null;
  
  const weeklyData = useWeeklyLogs(7) || {};
  const logs = weeklyData.logs || [];
  const monthlyData = useWeeklyLogs(30) || {};
  const monthLogs = monthlyData.logs || [];
  
  const navigate = useNavigate();

  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { level = 1, into = 0, need = 100 } = levelFromXP(xp) || {};
  const pct = need > 0 ? Math.min(100, Math.round((into / need) * 100)) : 0;
  // Cleaned up the display name extraction to ensure no stray characters
  const name = user ? displayNameOf(user, profile)?.replace(/[\[\]]/g, '') : "Loading...";

  const stats = useMemo(() => {
    const today = todayISO();
    const days = lastNDays(30);
    
    const dayStats = days.map((d) => {
      const done = habits.filter((h) => h?.history?.includes(d)).length;
      const total = habits.length;
      return { d, done, total, ratio: total ? done / total : 0 };
    });

    const totalCompletions = habits.reduce((s, h) => s + (h?.history?.length || 0), 0);
    const focusCompleted = sessions.filter((s) => s?.completed).length;
    const focusMinutes = sessions.filter((s) => s?.completed).reduce((s, x) => s + (x?.durationMin || 0), 0);

    const avg = logs.length ? Math.round(logs.reduce((a, b) => a + (b?.score || 0), 0) / logs.length) : 0;
    
    let currentStreak = 0;
    let longest = 0;
    for (const l of monthLogs) {
      if ((l?.score || 0) >= 70) {
        currentStreak++;
        longest = Math.max(longest, currentStreak);
      } else currentStreak = 0;
    }
      
    const habitPct = habits.length
      ? Math.round((habits.filter((h) => h?.history?.includes(today)).length / habits.length) * 100)
      : 0;
      
    const focusHoursWeek = sessions
      .filter((s) => s?.completed && s?.startedAt && new Date(s.startedAt) >= new Date(Date.now() - 7 * 86400000))
      .reduce((a, s) => a + (s?.durationMin || 0), 0) / 60;
        
    const productivity = Math.min(100, Math.round(habitPct * 0.4 + Math.min(100, focusHoursWeek * 10) * 0.6));

    return { dayStats, totalCompletions, focusCompleted, focusMinutes, avg, longest, habitPct, productivity };
  }, [habits, sessions, logs, monthLogs]);

  const getAuraColor = (prod: number) => {
    if (prod >= 90) return "from-violet-500 via-fuchsia-500 to-cyan-500";
    if (prod >= 70) return "from-emerald-400 via-cyan-500 to-blue-500";
    if (prod >= 40) return "from-amber-400 via-orange-500 to-rose-500";
    return "from-slate-500 via-slate-600 to-zinc-700";
  };

  const getRankTitle = (lvl: number) => {
    if (lvl >= 50) return "Grandmaster";
    if (lvl >= 30) return "Ascended";
    if (lvl >= 15) return "Disciplined";
    if (lvl >= 5) return "Initiate";
    return "Novice";
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast("Signed out");
    navigate({ to: "/auth", replace: true });
  };

  const handleCopyId = () => {
    if (!user?.id) return;
    navigator.clipboard.writeText(user.id);
    setCopiedId(true);
    toast.success("User ID copied to clipboard");
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSaveName = async () => {
    if (!newName.trim() || newName === name || !user?.id) {
      setIsEditingName(false);
      return;
    }
    try {
      const { error } = await supabase.from("profiles").update({ display_name: newName.trim() }).eq("id", user.id);
      if (error) throw error;
      toast.success("Name updated successfully!");
      setIsEditingName(false);
    } catch (err) {
      toast.error("Failed to update name");
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsUploading(true);
      if (!event.target.files || event.target.files.length === 0 || !user?.id) return;
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      if (updateError) throw updateError;

      toast.success('Profile picture updated!');
    } catch (error: any) {
      toast.error(error.message || "Error uploading image");
    } finally {
      setIsUploading(false);
    }
  };

  return {
    user, profile, name, level, into, need, pct, xp, bestStreak,
    habits, streaks, logs, outstand, stats,
    isEditingName, setIsEditingName, newName, setNewName,
    isUploading, copiedId, fileInputRef,
    getAuraColor, getRankTitle, signOut, handleCopyId, handleSaveName, handleAvatarUpload
  };
      }
    
