"use client";

import { useEffect, useRef, useState } from "react";
import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Bot, CheckCircle2, Copy, LoaderCircle, PlusCircle, RefreshCw, Trash2, WifiOff, X } from "lucide-react";
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

export function OutstandChatPanel({
  initialMessages,
  context,
  onClose,
  onClear,
  historyLoading = false,
}: {
  initialMessages: UIMessage[];
  context: OutstandChatContext;
  onClose: () => void;
  onClear: () => void;
  historyLoading?: boolean;
}) {
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
      toast.error(sessionError?.message || "Your session expired. Please sign in again.");
      return;
    }

    setInput("");
    try {
      await sendMessage({ text }, {
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
          "Content-Type": "application/json",
        },
        body: { appContext: contextRef.current },
      });
    } catch (err) {
      setInput(text);
      toast.error(formatAiError(err));
    }
  };

  const clear = async () => {
    const { data, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !data.session?.access_token) {
      toast.error(sessionError?.message || "Please sign in again.");
      return;
    }

    try {
      const response = await fetch("/api/chat", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      if (!response.ok) throw new Error(await readAiResponseError(response));
      onClear();
      toast.success("AI memory cleared");
    } catch (err) {
      toast.error(formatAiError(err));
    }
  };

  return <div className="flex h-full flex-col bg-[#050812]">
    <DrawerHeader className="flex shrink-0 items-start justify-between border-b border-white/[0.06] bg-white/[0.02] pb-4">
      <div>
        <DrawerTitle className="flex items-center gap-2.5 text-base text-white">
          <span className="grid h-7 w-7 place-items-center rounded-xl border border-cyan-300/20 bg-gradient-to-br from-cyan-400/20 to-indigo-500/30">
            <Bot className="h-4 w-4 text-cyan-200" />
          </span>
          Outstand Intelligence
          <span className="rounded-full border border-emerald-400/15 bg-emerald-400/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-[.18em] text-emerald-200">Online</span>
        </DrawerTitle>
        <DrawerDescription className="mt-1 text-xs text-slate-500">Context-aware coaching built from your actual Outstand activity.</DrawerDescription>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" onClick={() => void clear()} aria-label="Clear assistant memory"><Trash2 className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close assistant"><X className="h-4 w-4" /></Button>
      </div>
    </DrawerHeader>

    <Conversation className="flex-1 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.07),transparent_32%)] px-4 py-5"><ConversationContent>
      {historyLoading && messages.length === 0 && <div className="flex items-center justify-center py-10 text-xs text-slate-500"><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Restoring your conversation...</div>}
      {!historyLoading && messages.length === 0 ? <ConversationEmptyState icon={<Bot className="h-10 w-10 text-cyan-300" />} title="Talk to your system" description={`Ask for a focus plan, a habit adjustment, or what to do next, ${context.name.split(" ")[0] || "friend"}.`} /> : messages.map((message) => (
        <Message key={message.id} from={message.role}>
          <MessageContent>
            {message.parts?.map((part, index) => part.type === "text" ? <div key={`${message.id}-${index}`} className="whitespace-pre-wrap leading-7">{part.text}</div> : null)}
            {message.role === "assistant" && message.parts?.some((part) => part.type === "tool-createHabit") && <div className="mt-4 rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.05] p-4">{message.parts.map((part, index) => {
              if (part.type !== "tool-createHabit") return null;
              const habit = part.input as { name?: string; emoji?: string; color?: string; reason?: string } | undefined;
              if (!habit?.name) return null;
              return <motion.div key={`${message.id}-${index}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <div className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-200/70">Suggested habit</div>
                <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-white/[0.04] text-xl">{habit.emoji || "✨"}</div><div><h4 className="font-bold text-white">{habit.name}</h4><p className="text-xs text-slate-500">{habit.reason || "A simple action worth repeating."}</p></div></div>
                <Button onClick={() => { addHabit({ name: habit.name!, emoji: habit.emoji || "✨", color: habit.color || "primary" }); toast.success(`${habit.name} added.`); }} className="w-full"><PlusCircle className="mr-2 h-4 w-4" />Add habit</Button>
              </motion.div>;
            })}</div>}
          </MessageContent>
          {message.role === "assistant" && <MessageToolbar><MessageActions><MessageAction tooltip="Copy response" label="Copy" onClick={() => { const value = message.parts?.filter((part) => part.type === "text").map((part) => part.text).join("") || ""; void navigator.clipboard.writeText(value); toast.success("Copied"); }}><Copy className="h-3.5 w-3.5" /></MessageAction></MessageActions></MessageToolbar>}
        </Message>
      ))}
      <AnimatePresence>{streaming && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><Message from="assistant"><MessageContent><Shimmer className="text-sm text-cyan-300">Thinking with your Outstand context...</Shimmer></MessageContent></Message></motion.div>}</AnimatePresence>
    </ConversationContent><ConversationScrollButton /></Conversation>

    <div className="shrink-0 border-t border-white/[0.06] bg-black/20 p-4">
      {healthy === false && <div className="mb-2 rounded-xl border border-amber-400/15 bg-amber-400/[0.06] p-3 text-amber-100"><div className="flex items-center justify-between"><div className="flex items-center gap-2 font-semibold"><WifiOff className="h-4 w-4" />AI connection issue</div><Button variant="ghost" size="icon-sm" onClick={() => void refresh()} aria-label="Retry"><RefreshCw className="h-4 w-4" /></Button></div><p className="mt-1 break-words text-xs text-amber-100/60">{healthMessage}</p></div>}
      {error && <div className="mb-2 rounded-xl border border-rose-400/15 bg-rose-400/[0.06] p-3 text-sm text-rose-200">{formatAiError(error)}</div>}
      <PromptInput onSubmit={send}>
        <PromptInputTextarea placeholder="Ask Outstand..." value={input} onChange={(event) => setInput(event.currentTarget.value)} disabled={streaming} aria-label="Message Outstand Intelligence" onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} />
        <PromptInputFooter className="justify-end"><PromptInputSubmit status={streaming ? "streaming" : "idle"} onStop={stop} disabled={(!input.trim() && !streaming)} /></PromptInputFooter>
      </PromptInput>
    </div>
  </div>;
}
