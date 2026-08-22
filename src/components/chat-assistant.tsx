"use client";

import { useEffect, useMemo, useState } from "react";
import type { UIMessage } from "@ai-sdk/react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, displayNameOf } from "@/hooks/use-auth";
import { useAppState } from "@/hooks/use-app-state";
import { useDailyLog } from "@/hooks/use-dopamine";
import { todayISO } from "@/lib/habits";
import { OutstandChatPanel, type OutstandChatContext } from "@/components/ai/OutstandChatPanel";

const safeId = () => typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export type ChatAssistantProps = { openSignal?: boolean; onOpenSignalHandled?: () => void };

type RoadmapContext = {
  id: string; title: string; goal: string; category: string; durationDays: number; startDate: string; todayDay: number;
  milestones: Array<{ title: string; outcome: string | null; dayStart: number; dayEnd: number }>;
  todayTasks: Array<{ id: string; title: string; instructions: string; estimatedMinutes: number | null; startTime: string | null; endTime: string | null; successCriteria: string | null; progress: string; isRequired: boolean }>;
};

async function loadRoadmapContext(userId: string): Promise<RoadmapContext | null> {
  const { data: roadmap, error } = await supabase.from("roadmaps").select("id,title,goal,category,duration_days,start_date").eq("user_id", userId).in("status", ["active", "paused"]).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error || !roadmap) return null;
  const start = new Date(`${roadmap.start_date}T00:00:00`); const today = new Date(); const todayDay = Math.max(1, Math.floor((today.getTime() - start.getTime()) / 86400000) + 1);
  const [{ data: milestones }, { data: tasks }] = await Promise.all([
    supabase.from("roadmap_milestones").select("title,outcome,day_start,day_end").eq("roadmap_id", roadmap.id).eq("user_id", userId).order("milestone_order").limit(12),
    supabase.from("roadmap_tasks").select("id,title,instructions,estimated_minutes,start_time,end_time,success_criteria,is_required,roadmap_task_progress(status)").eq("roadmap_id", roadmap.id).eq("user_id", userId).eq("day_number", todayDay).order("start_time").order("task_order").limit(12),
  ]);
  const todayTasks = (tasks ?? []).map((task: any) => { const relation = Array.isArray(task.roadmap_task_progress) ? task.roadmap_task_progress[0] : task.roadmap_task_progress; return { id: String(task.id), title: String(task.title || "Untitled task"), instructions: String(task.instructions || task.title || "Complete the task."), estimatedMinutes: typeof task.estimated_minutes === "number" ? task.estimated_minutes : null, startTime: task.start_time ? String(task.start_time) : null, endTime: task.end_time ? String(task.end_time) : null, successCriteria: task.success_criteria ? String(task.success_criteria) : null, progress: String(relation?.status || "pending"), isRequired: task.is_required !== false }; });
  return { id: roadmap.id, title: String(roadmap.title || "Untitled roadmap"), goal: String(roadmap.goal || ""), category: String(roadmap.category || ""), durationDays: Number(roadmap.duration_days) || 1, startDate: String(roadmap.start_date), todayDay, milestones: (milestones ?? []).map((milestone: any) => ({ title: String(milestone.title || "Milestone"), outcome: milestone.outcome ? String(milestone.outcome) : null, dayStart: Number(milestone.day_start) || 1, dayEnd: Number(milestone.day_end) || 1 })), todayTasks };
}

export function ChatAssistant({ openSignal = false, onOpenSignalHandled }: ChatAssistantProps) {
  const { user, profile } = useAuth(); const { habits, sessions, outstand, xp, bestStreak } = useAppState(); const { log } = useDailyLog(); const today = todayISO();
  const [open, setOpen] = useState(false); const [messages, setMessages] = useState<UIMessage[]>([]); const [historyLoading, setHistoryLoading] = useState(false); const [historyKey, setHistoryKey] = useState(0); const [roadmapContext, setRoadmapContext] = useState<RoadmapContext | null>(null);
  const context = useMemo<OutstandChatContext>(() => ({ name: displayNameOf(user, profile), habits: habits.map((habit) => ({ id: habit.id, name: habit.name, emoji: habit.emoji })), completedToday: habits.filter((habit) => habit.history.includes(today)).map((habit) => habit.id), sessions, outstand, xp, bestStreak, dopamineScore: log?.score ?? 50, ...(roadmapContext ? { roadmap: roadmapContext } : {}) } as OutstandChatContext), [user, profile, habits, sessions, outstand, xp, bestStreak, log, today, roadmapContext]);
  useEffect(() => { if (!user) { setRoadmapContext(null); return; } let cancelled = false; void loadRoadmapContext(user.id).then((value) => { if (!cancelled) setRoadmapContext(value); }).catch((error) => console.error("AI roadmap context load failed", error)); return () => { cancelled = true; }; }, [user, historyKey]);
  useEffect(() => { if (!openSignal) return; setOpen(true); onOpenSignalHandled?.(); }, [openSignal, onOpenSignalHandled]);
  useEffect(() => { if (!open || !user) return; let cancelled = false; const loadHistory = async () => { setHistoryLoading(true); try { const { data: conversation, error: conversationError } = await supabase.from("chat_conversations").select("id").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1).maybeSingle(); if (conversationError) throw conversationError; if (!conversation?.id) { if (!cancelled) setMessages([]); return; } const { data, error } = await supabase.from("chat_messages").select("id, role, content, created_at").eq("conversation_id", conversation.id).eq("user_id", user.id).in("role", ["user", "assistant"]).order("created_at", { ascending: true }).limit(100); if (error) throw error; const loaded: UIMessage[] = (data ?? []).map((message) => ({ id: message.id || safeId(), role: message.role as "user" | "assistant", parts: [{ type: "text", text: message.content }] })); if (!cancelled) setMessages(loaded); } catch (error) { console.error("AI history load failed", error); if (!cancelled) setMessages([]); } finally { if (!cancelled) setHistoryLoading(false); } }; void loadHistory(); return () => { cancelled = true; }; }, [open, user, historyKey]);
  if (!user) return null;
  const clearLocalHistory = () => { setMessages([]); setHistoryKey((value) => value + 1); };
  return <><button type="button" onClick={() => setOpen(true)} aria-label="Open Outstand Intelligence" className="fixed bottom-5 right-5 z-[80] hidden h-12 w-12 place-items-center rounded-2xl border border-cyan-300/20 bg-[#050812]/95 text-cyan-200 shadow-[0_0_30px_rgba(34,211,238,.16)] backdrop-blur-xl transition hover:scale-105 hover:border-cyan-300/35 hover:bg-cyan-300/10 md:grid"><span className="relative grid place-items-center"><span className="absolute h-3 w-3 animate-ping rounded-full bg-cyan-300/30" /><span className="relative h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,.9)]" /></span></button><Drawer open={open} onOpenChange={setOpen}><DrawerContent className="z-[90] h-[92vh] max-h-[920px] border-white/10 bg-[#050812]/98 p-0 text-white shadow-[0_-30px_100px_rgba(0,0,0,.55)] backdrop-blur-2xl"><div className="h-full min-h-0"><OutstandChatPanel initialMessages={messages} context={context} onClose={() => setOpen(false)} onClear={clearLocalHistory} historyLoading={historyLoading} /></div></DrawerContent></Drawer></>;
}
