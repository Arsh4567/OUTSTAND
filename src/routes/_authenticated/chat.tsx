import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, MessageCircle, Send, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/chat")({ component: ChatPage });

type Profile = { id: string; display_name: string | null; full_name: string | null; username: string | null; avatar_url: string | null; current_level: number | null };
type Friend = { id: string; profile: Profile };
type Message = { id: string; conversation_id: string; sender_id: string; content: string; created_at: string; read_at: string | null };

const nameOf = (p?: Profile) => p?.display_name || p?.full_name || (p?.username ? `@${p.username}` : "OUTSTAND user");
const initialOf = (p?: Profile) => nameOf(p).slice(0, 1).toUpperCase();

function ChatPage() {
  const [userId, setUserId] = useState<string>();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selected, setSelected] = useState<Profile>();
  const [conversationId, setConversationId] = useState<string>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const selectedId = selected?.id;

  const loadFriends = async (uid: string) => {
    const { data: rows, error } = await supabase.from("friendships").select("friend_id").eq("user_id", uid).order("created_at", { ascending: false });
    if (error) { toast.error("Could not load your friends."); return; }
    const ids = (rows || []).map(row => row.friend_id);
    if (!ids.length) { setFriends([]); return; }
    const { data: profiles } = await supabase.from("profiles").select("id,display_name,full_name,username,avatar_url,current_level").in("id", ids);
    const map = new Map((profiles || []).map(profile => [profile.id, profile as Profile]));
    setFriends((rows || []).map(row => ({ id: row.friend_id, profile: map.get(row.friend_id) })).filter((item): item is Friend => Boolean(item.profile)));
  };

  const loadConversation = async (friendId: string) => {
    setMessages([]);
    setConversationId(undefined);
    const { data, error } = await (supabase as any).rpc("get_or_create_direct_conversation", { target_user: friendId });
    if (error) { toast.error(error.message || "Could not open this chat."); return; }
    const id = data as string;
    setConversationId(id);
    const result = await (supabase as any).from("direct_messages").select("id,conversation_id,sender_id,content,created_at,read_at").eq("conversation_id", id).order("created_at", { ascending: true }).limit(200);
    if (result.error) toast.error("Could not load messages."); else setMessages(result.data || []);
    await (supabase as any).from("direct_messages").update({ read_at: new Date().toISOString() }).eq("conversation_id", id).neq("sender_id", userId || "").is("read_at", null);
  };

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { setLoading(false); return; }
      setUserId(data.user.id);
      await loadFriends(data.user.id);
      if (active) setLoading(false);
      const target = new URLSearchParams(window.location.search).get("friend");
      if (target && target !== data.user.id) {
        const { data: profile } = await supabase.from("profiles").select("id,display_name,full_name,username,avatar_url,current_level").eq("id", target).maybeSingle();
        if (active && profile) { setSelected(profile as Profile); await loadConversation(target); }
      }
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedId || !conversationId) return;
    const channel = supabase.channel(`direct-chat:${conversationId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages", filter: `conversation_id=eq.${conversationId}` }, payload => {
        const incoming = payload.new as Message;
        setMessages(current => current.some(message => message.id === incoming.id) ? current : [...current, incoming]);
        if (incoming.sender_id !== userId) void (supabase as any).from("direct_messages").update({ read_at: new Date().toISOString() }).eq("id", incoming.id);
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [conversationId, selectedId, userId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  const send = async () => {
    const content = draft.trim();
    if (!content || !conversationId || !userId || sending) return;
    setSending(true);
    const { data, error } = await (supabase as any).from("direct_messages").insert({ conversation_id: conversationId, sender_id: userId, content }).select("id,conversation_id,sender_id,content,created_at,read_at").single();
    if (error) toast.error("Message could not be sent.");
    else { setMessages(current => current.some(message => message.id === data.id) ? current : [...current, data as Message]); setDraft(""); }
    setSending(false);
  };

  const selectFriend = async (profile: Profile) => {
    setSelected(profile);
    window.history.replaceState({}, "", `/chat?friend=${profile.id}`);
    await loadConversation(profile.id);
  };

  const friendCount = friends.length;

  return <main className="mx-auto flex min-h-[calc(100vh-72px)] max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
    <div className="mb-5 flex items-center justify-between gap-4">
      <div><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.26em] text-cyan-300"><MessageCircle className="h-4 w-4" /> Direct messages</div><h1 className="mt-2 text-3xl font-black tracking-tight text-white">Your conversations.</h1><p className="mt-1 text-sm text-slate-500">Private chats with people you've added as friends.</p></div>
      <button onClick={() => window.location.assign("/friends")} className="hidden rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black text-slate-300 transition hover:border-cyan-300/20 hover:text-white sm:inline-flex"><Users className="mr-2 h-4 w-4" /> Friends</button>
    </div>

    <div className="grid min-h-[70vh] overflow-hidden rounded-[2rem] border border-white/[0.08] bg-white/[0.035] shadow-[0_30px_100px_-60px_rgba(34,211,238,.35)] backdrop-blur-2xl lg:grid-cols-[300px_1fr]">
      <aside className={`border-b border-white/[0.06] lg:border-b-0 lg:border-r ${selected ? "hidden lg:block" : "block"}`}>
        <div className="border-b border-white/[0.06] p-5"><div className="text-[10px] font-black uppercase tracking-[.22em] text-slate-600">Friends · {friendCount}</div></div>
        <div className="max-h-[60vh] overflow-y-auto p-3">
          {loading ? <div className="p-4 text-sm text-slate-600">Loading friends…</div> : friends.length === 0 ? <div className="p-5 text-sm leading-6 text-slate-600">Add a friend first, then you can message them here.</div> : friends.map(friend => <button key={friend.id} onClick={() => void selectFriend(friend.profile)} className={`mb-1 flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${selectedId === friend.id ? "bg-cyan-300/10 text-white" : "text-slate-400 hover:bg-white/[0.04] hover:text-white"}`}><Avatar profile={friend.profile} /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-black">{nameOf(friend.profile)}</span><span className="block truncate text-xs text-slate-600">@{friend.profile.username || "outstand"}</span></span></button>)}
        </div>
      </aside>

      <section className={`flex min-h-[70vh] flex-col ${selected ? "flex" : "hidden lg:flex"}`}>
        {selected ? <>
          <header className="flex items-center gap-3 border-b border-white/[0.06] p-4 sm:p-5"><button onClick={() => setSelected(undefined)} className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 text-slate-400 lg:hidden" aria-label="Back to friends"><ArrowLeft className="h-4 w-4" /></button><Avatar profile={selected} /><div className="min-w-0"><div className="truncate text-sm font-black text-white">{nameOf(selected)}</div><div className="text-xs text-slate-600">@{selected.username || "outstand"} · Level {selected.current_level || 1}</div></div></header>
          <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-6">
            {messages.length === 0 ? <div className="grid h-full min-h-64 place-items-center text-center"><div><MessageCircle className="mx-auto h-10 w-10 text-cyan-300/30" /><p className="mt-3 text-sm font-bold text-slate-500">No messages yet.</p><p className="mt-1 text-xs text-slate-700">Say hello and start the conversation.</p></div></div> : messages.map(message => <div key={message.id} className={`flex ${message.sender_id === userId ? "justify-end" : "justify-start"}`}><div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.sender_id === userId ? "rounded-br-md bg-cyan-300 text-slate-950" : "rounded-bl-md bg-white/[0.07] text-slate-200"}`}><div>{message.content}</div><div className={`mt-1 text-[9px] font-bold ${message.sender_id === userId ? "text-slate-800/60" : "text-slate-600"}`}>{new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div></div></div>)}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={e => { e.preventDefault(); void send(); }} className="border-t border-white/[0.06] p-3 sm:p-4"><div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-black/20 p-2 focus-within:border-cyan-300/30"><textarea value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }} maxLength={4000} rows={1} placeholder={`Message ${nameOf(selected)}…`} className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-slate-700" /><button type="submit" disabled={!draft.trim() || sending} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cyan-300 text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Send message"><Send className="h-4 w-4" /></button></div></form>
        </> : <div className="grid flex-1 place-items-center p-8 text-center"><div><MessageCircle className="mx-auto h-14 w-14 text-cyan-300/20" /><h2 className="mt-4 text-xl font-black text-white">Pick a friend</h2><p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">Choose someone from your circle to open a private conversation.</p></div></div>}
      </section>
    </div>
  </main>;
}

function Avatar({ profile }: { profile?: Profile }) { return <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-slate-950 text-sm font-black text-cyan-200">{profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : initialOf(profile)}</div>; }
