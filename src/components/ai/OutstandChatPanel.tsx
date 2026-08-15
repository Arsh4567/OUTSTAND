"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Bot, CheckCircle2, PlusCircle, RefreshCw, Trash2, WifiOff, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAppState } from "@/hooks/use-app-state";
import { checkAiHealth, formatAiError, readAiResponseError } from "@/lib/ai-assistant";
import { Button } from "@/components/ui/button";
import { DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageAction, MessageActions, MessageContent, MessageToolbar } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { cn } from "@/lib/utils";

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

const safeId = () => typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

export function OutstandChatPanel({ initialMessages, context, onClose, onClear }: { initialMessages: UIMessage[]; context: OutstandChatContext; onClose: () => void; onClear: () => void }) {
  const { addHabit } = useAppState();
  const contextRef = useRef(context);
  const [input, setInput] = useState("");
  const [healthy, setHealthy] = useState<boolean | null>(null);
  const [healthMessage, setHealthMessage] = useState<string | null>(null);

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
    generateId: safeId,
    transport: new DefaultChatTransport({ api: "/api/chat", credentials: "same-origin" }),
    onError: (err) => {
      const message = formatAiError(err);
      setHealthy(false);
      setHealthMessage(message);
      toast.error(message);
    },
  });

  const streaming = status === "submitted" || status === "streaming";

  const send = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const text = input.trim();
    if (!text || streaming) return;

    const { data, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !data.session?.access_token) {
      toast.error(sessionError?.message || "Please sign in again.");
      return;
    }

    if (healthy !== true && !(await refresh())) return;

    setInput("");
    try {
      await sendMessage({ text }, {
        headers: { Authorization: `Bearer ${data.session.access_token}`, "Content-Type": "application/json" },
        body: { appContext: contextRef.current },
      });
    } catch (err) {
      setInput(text);
      const message = formatAiError(err);
      setHealthy(false);
      setHealthMessage(message);
      toast.error(message);
    }
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
      toast.success("Memory wiped. Fresh start.");
    } catch (err) {
      toast.error(formatAiError(err));
    }
  };

  return <div className="flex h-full flex-col">
    <DrawerHeader className="flex shrink-0 items-start justify-between border-b border-white/5 bg-slate-950/80 pb-4">
      <div>
        <DrawerTitle className="flex items-center gap-2 text-base text-white"><span className="grid h-6 w-6 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600"><Bot className="h-3.5 w-3.5 text-white" /></span>Outstand Intelligence</DrawerTitle>
        <DrawerDescription className="mt-1 text-xs text-slate-400">Real-time focus coaching and habit optimization.</DrawerDescription>
      </div>
      <div className="flex items-center gap-1"><Button variant="ghost" size="icon-sm" onClick={() => void clear()} aria-label="Clear assistant memory"><Trash2 className="h-4 w-4" /></Button><Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close assistant"><X className="h-4 w-4" /></Button></div>
    </DrawerHeader>

    <Conversation className="flex-1 bg-slate-950/50 px-4 py-6"><ConversationContent>
      {messages.length === 0 ? <ConversationEmptyState icon={<Bot className="h-10 w-10 text-indigo-400" />} title="Systems Online" description="Ask for a habit idea, a focus plan, or help recovering from a productivity slump." /> : messages.map((message) => (
        <Message key={message.id} from={message.role}>
          <MessageContent>
            {message.parts?.map((part, index) => part.type === "text" ? <div key={`${message.id}-${index}`} className={cn("whitespace-pre-wrap leading-relaxed", message.role === "assistant" ? "text-slate-200" : "text-white")}>{part.text}</div> : null)}
            {message.role === "assistant" && message.parts?.some((part) => part.type === "tool-createHabit") && <div className="mt-4 rounded-2xl border border-indigo-500/30 bg-indigo-900/20 p-4"><div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-indigo-300">Recommended habit</div>{message.parts.map((part, index) => { if (part.type !== "tool-createHabit") return null; const input = part.input as { name?: string; emoji?: string; color?: string; reason?: string } | undefined; if (!input?.name) return null; return <motion.div key={`${message.id}-${index}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-500/15 text-xl">{input.emoji || "✨"}</div><div><h4 className="font-bold text-white">{input.name}</h4><p className="text-xs text-slate-400">{input.reason || "A simple habit to strengthen consistency."}</p></div></div><Button onClick={() => { addHabit({ name: input.name!, emoji: input.emoji || "✨", color: input.color || "primary" }); toast.success(`${input.name} added to your habits.`, { icon: <CheckCircle2 className="h-4 w-4" /> }); }} className="w-full"><PlusCircle className="mr-2 h-4 w-4" />Add habit</Button></motion.div>; })}</div>}
          </MessageContent>
          {message.role === "assistant" && <MessageToolbar><MessageActions><MessageAction tooltip="Copy response" label="Copy" onClick={() => { const value = message.parts?.filter((part) => part.type === "text").map((part) => part.text).join("") || ""; void navigator.clipboard.writeText(value); toast.success("Copied"); }}><span className="text-xs">Copy</span></MessageAction></MessageActions></MessageToolbar>}
        </Message>
      ))}
      <AnimatePresence>{streaming && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Message from="assistant"><MessageContent><Shimmer className="text-sm text-indigo-400">Synthesizing response...</Shimmer></MessageContent></Message></motion.div>}</AnimatePresence>
    </ConversationContent><ConversationScrollButton /></Conversation>

    <div className="shrink-0 border-t border-white/5 bg-slate-950 p-4">
      {healthy === false && <div className="mb-2 rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-amber-200"><div className="flex items-center justify-between"><div className="flex items-center gap-2 font-semibold"><WifiOff className="h-4 w-4" />AI service unavailable</div><Button variant="ghost" size="icon-sm" onClick={() => void refresh()} aria-label="Retry"><RefreshCw className="h-4 w-4" /></Button></div><p className="mt-1 break-words text-xs opacity-80">{healthMessage}</p></div>}
      {error && <div className="mb-2 rounded-lg border border-rose-500/50 bg-rose-500/10 p-3 text-sm text-rose-300"><strong>Connection failed:</strong> {formatAiError(error)}</div>}
      <PromptInput onSubmit={send}><PromptInputTextarea placeholder="Ask Outstand anything..." value={input} onChange={(event) => setInput(event.currentTarget.value)} disabled={streaming || healthy === false} aria-label="Message Outstand Intelligence" onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} /><PromptInputFooter className="justify-end"><PromptInputSubmit status={streaming ? "streaming" : "idle"} onStop={stop} disabled={(!input.trim() && !streaming) || healthy === false} /></PromptInputFooter></PromptInput>
    </div>
  </div>;
}
