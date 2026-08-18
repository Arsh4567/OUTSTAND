"use client";

import { useEffect, useRef, useState } from "react";
import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ArrowUpRight, Bot, CheckCircle2, Copy, LoaderCircle, PlusCircle, RefreshCw, Sparkles, Trash2, WifiOff, X, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAppState } from "@/hooks/use-app-state";
import { checkAiHealth, formatAiError, readAiResponseError } from "@/lib/ai-assistant";
import { Button } from "@/components/ui/button";
import { DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageAction, MessageActions, MessageContent, MessageToolbar } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea, type PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { OutstandRobotAvatar } from "@/components/ai/OutstandRobotAvatar";

export type OutstandChatContext = {
  name: string;
  habits: { id: string; name: string; emoji: string }[];
  completedToday: string[];
  sessions: unknown[];
  outstand: unknown[];
  xp: number;
  bestStreak: number;
  dopamineScore: number;
};

function cleanAssistantText(text: string) {
  return text.replaceAll("**", "");
}

const quickPrompts = ["What should I do next?", "Make me a focus plan", "How is my progress today?"];

export function OutstandChatPanel({ initialMessages, context, onClose, onClear, historyLoading = false }: { initialMessages: UIMessage[]; context: OutstandChatContext; onClose: () => void; onClear: () => void; historyLoading?: boolean }) {
  const { addHabit } = useAppState();
  const contextRef = useRef(context);
  const [input, setInput] = useState("");
  const [healthy, setHealthy] = useState<boolean | null>(null);
  const [healthMessage, setHealthMessage] = useState<string | null>(null);
  const [copyingId, setCopyingId] = useState<string | null>(null);

  useEffect(() => { contextRef.current = context; }, [context]);

  const refresh = async () => {
    const { data } = await supabase.auth.getSession();
    const result = await checkAiHealth(data.session?.access_token);
    setHealthy(result.ok);
    setHealthMessage(result.ok ? null : result.message);
    return result.ok;
  };

  useEffect(() => { void refresh(); }, []);

  const { messages, status, sendMessage, stop, error } = useChat({
    id: "outstand-assistant-production",
    initialMessages,
    transport: new DefaultChatTransport({ api: "/api/chat", credentials: "same-origin" }),
    onError: (err) => {
      const message = formatAiError(err);
      setHealthy(false);
      setHealthMessage(message);
      toast.error(message);
    },
  });

  const streaming = status === "submitted" || status === "streaming";

  const sendText = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || streaming) return;
    const { data, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !data.session?.access_token) {
      toast.error(sessionError?.message || "Your session expired. Please sign in again.");
      return;
    }
    setInput("");
    try {
      await sendMessage({ text }, { headers: { Authorization: `Bearer ${data.session.access_token}`, "Content-Type": "application/json" }, body: { appContext: contextRef.current } });
    } catch (err) {
      setInput(text);
      toast.error(formatAiError(err));
    }
  };

  const handleSubmit = async (message: PromptInputMessage, event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendText(message.text);
  };

  const clear = async () => {
    const { data, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !data.session?.access_token) {
      toast.error(sessionError?.message || "Please sign in again.");
      return;
    }
    try {
      const response = await fetch("/api/chat", { method: "DELETE", headers: { Authorization: `Bearer ${data.session.access_token}` } });
      if (!response.ok) throw new Error(await readAiResponseError(response));
      onClear();
      toast.success("AI memory cleared");
    } catch (err) {
      toast.error(formatAiError(err));
    }
  };

  const copyResponse = async (messageId: string, value: string) => {
    if (!value) return;
    setCopyingId(messageId);
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied");
    } catch {
      toast.error("Could not copy this response. Check clipboard permissions.");
    } finally {
      setCopyingId(null);
    }
  };

  const statusLabel = healthy === false ? "Offline" : healthy === true ? "Live" : "Checking";
  const statusClass = healthy === false ? "border-amber-400/15 bg-amber-400/10 text-amber-200" : healthy === true ? "border-emerald-400/15 bg-emerald-400/10 text-emerald-200" : "border-white/10 bg-white/[0.04] text-slate-400";
  const statusDot = healthy === false ? "bg-amber-400" : healthy === true ? "bg-emerald-400" : "bg-slate-500";

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#050812]">
      <DrawerHeader className="relative shrink-0 overflow-hidden border-b border-white/[0.07] bg-gradient-to-r from-cyan-400/[0.07] via-blue-500/[0.04] to-transparent px-4 pb-4 pt-4 sm:px-5">
        <div className="pointer-events-none absolute -right-20 -top-24 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.07] shadow-[0_0_35px_rgba(34,211,238,.12)]"><OutstandRobotAvatar size="sm" pulse /></div>
            <div className="min-w-0">
              <DrawerTitle className="flex items-center gap-2 truncate text-base font-black tracking-tight text-white">Outstand Intelligence <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-[.16em] ${statusClass}`}><span className={`h-1.5 w-1.5 rounded-full ${statusDot}`} />{statusLabel}</span></DrawerTitle>
              <DrawerDescription className="mt-1 truncate text-xs text-slate-500">Fast context-aware coaching for your next move.</DrawerDescription>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1"><Button variant="ghost" size="icon-sm" onClick={() => void clear()} aria-label="Clear assistant memory"><Trash2 className="h-4 w-4" /></Button><Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close assistant"><X className="h-4 w-4" /></Button></div>
        </div>
      </DrawerHeader>

      <Conversation className="min-h-0 flex-1 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.075),transparent_32%)] px-3 py-4 sm:px-5 sm:py-5">
        <ConversationContent>
          {historyLoading && messages.length === 0 && <div className="flex items-center justify-center py-10 text-xs text-slate-500"><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Restoring your conversation...</div>}
          {!historyLoading && messages.length === 0 ? <div className="mx-auto flex w-full max-w-2xl flex-col items-center py-8 text-center sm:py-14"><motion.div initial={{ scale: .9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative"><div className="absolute inset-0 rounded-[2rem] bg-cyan-400/10 blur-2xl" /><div className="relative grid h-24 w-24 place-items-center rounded-[2rem] border border-cyan-300/15 bg-gradient-to-br from-cyan-300/[0.1] to-blue-500/[0.06] shadow-[0_25px_70px_rgba(0,0,0,.35)]"><OutstandRobotAvatar size="xl" pulse /></div></motion.div><div className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.25em] text-cyan-200/60"><Sparkles className="h-3.5 w-3.5" /> Your intelligence layer</div><h2 className="mt-2 text-2xl font-black tracking-[-.035em] text-white sm:text-3xl">What are we solving today?</h2><p className="mt-2 max-w-md text-sm leading-6 text-slate-500">Ask anything about your habits, focus, momentum, or the next action that matters.</p><div className="mt-6 grid w-full gap-2 sm:grid-cols-3">{quickPrompts.map((prompt) => <button key={prompt} type="button" onClick={() => void sendText(prompt)} disabled={streaming} className="group rounded-2xl border border-white/[0.07] bg-white/[0.025] px-3 py-3 text-left text-xs font-semibold text-slate-300 transition hover:border-cyan-300/20 hover:bg-cyan-300/[0.05] disabled:cursor-not-allowed disabled:opacity-50"><span className="flex items-center justify-between gap-2"><span>{prompt}</span><ArrowUpRight className="h-3.5 w-3.5 text-slate-600 transition group-hover:text-cyan-300" /></span></button>)}</div></div> : messages.map((message) => <Message key={message.id} from={message.role}><MessageContent className={message.role === "user" ? "rounded-2xl border border-blue-300/10 bg-blue-500/[0.08] px-4 py-3 shadow-[0_10px_35px_rgba(0,0,0,.12)]" : "rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-3 shadow-[0_10px_35px_rgba(0,0,0,.12)]"}>{message.role === "assistant" && <div className="mb-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-[.18em] text-cyan-200/55"><Bot className="h-3.5 w-3.5" /> Outstand</div>}{message.parts?.map((part, index) => part.type === "text" ? <div key={`${message.id}-${index}`} className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-200">{message.role === "assistant" ? cleanAssistantText(part.text) : part.text}</div> : null)}{message.role === "assistant" && message.parts?.some((part) => part.type === "tool-createHabit") && <div className="mt-4 rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.05] p-4">{message.parts.map((part, index) => { if (part.type !== "tool-createHabit") return null; const habit = part.input as { name?: string; emoji?: string; color?: string; reason?: string } | undefined; if (!habit?.name) return null; return <motion.div key={`${message.id}-${index}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3"><div className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-200/70">Suggested habit</div><div className="flex items-start gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/[0.04] text-xl">{habit.emoji || "✨"}</div><div className="min-w-0"><h4 className="font-bold text-white">{habit.name}</h4><p className="mt-1 text-xs leading-5 text-slate-500">{cleanAssistantText(habit.reason || "A simple action worth repeating.")}</p><p className="mt-2 text-[9px] font-bold uppercase tracking-[.14em] text-slate-600">You can edit it later in your habits settings.</p></div></div><Button onClick={() => { addHabit({ name: habit.name!, emoji: habit.emoji || "✨", color: habit.color || "primary" }); toast.success(`${habit.name} is ready in your habits.`); }} className="w-full"><PlusCircle className="mr-2 h-4 w-4" />Add to habits</Button></motion.div>; })}</div>}{message.role === "assistant" && <MessageToolbar><MessageActions><MessageAction tooltip="Copy response" label="Copy" disabled={copyingId === message.id} onClick={() => { const value = message.parts?.filter((part) => part.type === "text").map((part) => cleanAssistantText(part.text)).join("") || ""; void copyResponse(message.id, value); }}>{copyingId === message.id ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}</MessageAction></MessageActions></MessageToolbar>}</MessageContent></Message>)}
          <AnimatePresence>{streaming && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><Message from="assistant"><MessageContent className="rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.025] px-4 py-3"><div className="mb-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-[.18em] text-cyan-200/55"><Zap className="h-3.5 w-3.5" /> Generating</div><Shimmer className="text-sm text-cyan-200">Thinking fast...</Shimmer></MessageContent></Message></motion.div>}</AnimatePresence>
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="shrink-0 border-t border-white/[0.07] bg-[#060a14]/95 p-3 backdrop-blur-xl sm:p-4">
        {healthy === false && <div className="mb-2 rounded-xl border border-amber-400/15 bg-amber-400/[0.06] p-3 text-amber-100"><div className="flex items-center justify-between"><div className="flex items-center gap-2 font-semibold"><WifiOff className="h-4 w-4" />AI connection issue</div><Button variant="ghost" size="icon-sm" onClick={() => void refresh()} aria-label="Retry AI connection"><RefreshCw className="h-4 w-4" /></Button></div><p className="mt-1 break-words text-xs text-amber-100/60">{healthMessage}</p></div>}
        {error && <div className="mb-2 rounded-xl border border-rose-400/15 bg-rose-400/[0.06] p-3 text-sm text-rose-200">{formatAiError(error)}</div>}
        <PromptInput onSubmit={handleSubmit} className="rounded-2xl border border-white/[0.09] bg-white/[0.035] shadow-[0_12px_45px_rgba(0,0,0,.25)] focus-within:border-cyan-300/20 focus-within:shadow-[0_0_45px_rgba(34,211,238,.06)]"><PromptInputTextarea placeholder="Ask Outstand anything..." value={input} onChange={(event) => setInput(event.currentTarget.value)} disabled={streaming} aria-label="Message Outstand Intelligence" className="min-h-[52px] text-sm" /><PromptInputFooter className="justify-between px-2 pb-2"><div className="hidden items-center gap-1.5 pl-1 text-[9px] font-bold uppercase tracking-[.16em] text-slate-600 sm:flex"><CheckCircle2 className="h-3 w-3 text-emerald-400/60" /> Context synced</div><PromptInputSubmit type="button" status={streaming ? "streaming" : "ready"} onClick={() => { if (!streaming) void sendText(input); }} onStop={stop} disabled={!input.trim() && !streaming} aria-label={streaming ? "Stop generating" : "Send message"} className="h-9 w-9 rounded-xl bg-cyan-400 text-slate-950 shadow-[0_0_25px_rgba(34,211,238,.18)] hover:bg-cyan-300" /></PromptInputFooter></PromptInput>
      </div>
    </div>
  );
}
