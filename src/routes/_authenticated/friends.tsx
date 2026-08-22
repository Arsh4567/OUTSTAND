import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Search, UserPlus, Users, X, Zap, Bell, Trophy, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/friends")({ component: FriendsPage });
type Profile = { id: string; display_name: string | null; full_name: string | null; username: string | null; avatar_url: string | null; total_xp: number | null; current_level: number | null };
type Request = { id: string; sender_id: string; receiver_id: string; status: string; created_at: string; sender?: Profile; receiver?: Profile };
type Friend = { user_id: string; friend_id: string; created_at: string; profile?: Profile };
const initials = (p?: Profile) => (p?.display_name || p?.full_name || p?.username || "U").slice(0, 1).toUpperCase();
const label = (p?: Profile) => p?.display_name || p?.full_name || (p?.username ? `@${p.username}` : "OUTSTAND user");
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function FriendsPage() {
  const [userId, setUserId] = useState<string>();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const incomingCount = requests.filter((request) => request.receiver_id === userId).length;

  const load = async (uid: string) => {
    setLoading(true);
    setLoadError(null);
    try {
      const [{ data: incoming, error: incomingError }, { data: outgoing, error: outgoingError }, { data: rows, error: friendsError }] = await Promise.all([
        supabase.from("friend_requests").select("*").eq("receiver_id", uid).eq("status", "pending").order("created_at", { ascending: false }),
        supabase.from("friend_requests").select("*").eq("sender_id", uid).eq("status", "pending").order("created_at", { ascending: false }),
        supabase.from("friendships").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
      ]);
      const firstError = incomingError || outgoingError || friendsError;
      if (firstError) throw firstError;
      const all = [...(incoming || []), ...(outgoing || [])] as Request[];
      const ids = [...new Set([...all.map((request) => request.sender_id), ...all.map((request) => request.receiver_id), ...(rows || []).map((row) => row.friend_id)].filter((id) => id !== uid))];
      let profiles: Profile[] = [];
      if (ids.length) {
        const { data, error } = await supabase.from("profiles").select("id,display_name,full_name,username,avatar_url,total_xp,current_level").in("id", ids);
        if (error) throw error;
        profiles = data || [];
      }
      const map = new Map(profiles.map((profile) => [profile.id, profile]));
      setRequests(all.map((request) => ({ ...request, sender: map.get(request.sender_id), receiver: map.get(request.receiver_id) })));
      setFriends((rows || []).map((row) => ({ ...row, profile: map.get(row.friend_id) })) as Friend[]);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not load your circle.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) { setUserId(data.user.id); void load(data.user.id); }
      else setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase.channel(`friend-requests:${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "friend_requests", filter: `receiver_id=eq.${userId}` }, (payload) => { const row = payload.new as Request; if (row.status === "pending") { toast("New friend request", { description: "Someone wants to connect with you." }); void load(userId); } })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "friend_requests", filter: `receiver_id=eq.${userId}` }, () => void load(userId))
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [userId]);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      const q = query.trim();
      if (!q || !userId) { setResults([]); return; }
      const clean = q.replace(/^@/, "");
      const request = uuidPattern.test(clean)
        ? supabase.from("profiles").select("id,display_name,full_name,username,avatar_url,total_xp,current_level").eq("id", clean).neq("id", userId).limit(8)
        : supabase.from("profiles").select("id,display_name,full_name,username,avatar_url,total_xp,current_level").or(`username.ilike.%${clean}%,display_name.ilike.%${clean}%,full_name.ilike.%${clean}%`).neq("id", userId).limit(8);
      const { data } = await request;
      setResults(data || []);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query, userId]);

  const pendingFor = useMemo(() => new Map(requests.map((request) => [request.sender_id === userId ? request.receiver_id : request.sender_id, request])), [requests, userId]);

  const sendRequest = async (target: Profile) => {
    if (!userId || busy) return;
    setBusy(target.id);
    const { error } = await supabase.rpc("send_friend_request", { target_user: target.id });
    if (error) toast.error(error.message?.includes("Already friends") ? "You're already friends." : "Could not send friend request.");
    else { toast.success(`Friend request sent to ${label(target)}`); await load(userId); }
    setBusy(null);
  };

  const respond = async (request: Request, accept: boolean) => {
    setBusy(request.id);
    if (accept) {
      const { error } = await supabase.rpc("accept_friend_request", { request_id: request.id });
      if (error) toast.error("Could not accept request."); else toast.success("You're friends now.");
    } else {
      const { error } = await supabase.from("friend_requests").update({ status: "declined", updated_at: new Date().toISOString() }).eq("id", request.id);
      if (error) toast.error("Could not decline request.");
    }
    await load(userId!);
    setBusy(null);
  };

  if (loadError) return <main className="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center px-4"><div className="w-full max-w-md rounded-3xl border border-red-400/15 bg-white/[0.03] p-7 text-center"><p className="text-xs font-black uppercase tracking-[0.2em] text-red-300">Couldn’t load your circle</p><p className="mt-3 text-sm leading-6 text-slate-400">{loadError}</p><button type="button" onClick={() => userId && void load(userId)} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-950"><RefreshCw className="h-4 w-4" /> Try again</button></div></main>;

  return <main className="mx-auto max-w-6xl space-y-6 px-4 pb-24 pt-5 sm:px-6 lg:px-8">
    <header className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[radial-gradient(circle_at_10%_10%,rgba(34,211,238,.14),transparent_30%),radial-gradient(circle_at_90%_90%,rgba(129,140,248,.12),transparent_35%),rgba(255,255,255,.025)] p-7 sm:p-10"><div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between"><div><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.28em] text-cyan-300"><Users className="h-4 w-4" /> Social layer</div><h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">Build your circle.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">Find people, send requests, and turn progress into something you can share.</p></div><div className="flex flex-wrap items-center gap-3"><Link to="/league" className="inline-flex items-center gap-2 rounded-2xl border border-yellow-300/15 bg-yellow-300/10 px-4 py-3 text-xs font-black text-yellow-100"><Trophy className="h-4 w-4" />Compete in League</Link><button type="button" onClick={() => document.getElementById("friend-requests")?.scrollIntoView({ behavior: "smooth" })} className="relative rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-left"><div className="flex items-center gap-2 text-xs font-black text-cyan-100"><Bell className="h-4 w-4" /> Friend requests {incomingCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-cyan-300 px-1.5 text-[10px] text-slate-950">{incomingCount}</span>}</div><div className="mt-1 text-[10px] text-slate-500">{incomingCount ? `${incomingCount} waiting for you` : "No pending requests"}</div></button><div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4"><div className="text-2xl font-black text-white">{friends.length}</div><div className="text-[10px] font-black uppercase tracking-[.2em] text-slate-600">Friends</div></div></div></div></header>
    <section className="rounded-[2rem] border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur-2xl sm:p-7"><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.24em] text-slate-500"><Search className="h-4 w-4" /> Find people</div><div className="relative mt-4"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, username, or ID…" className="w-full rounded-2xl border border-white/10 bg-black/20 py-4 pl-11 pr-4 text-sm font-semibold text-white outline-none placeholder:text-slate-700 focus:border-cyan-300/40" /></div>{results.length > 0 && <div className="mt-3 grid gap-2">{results.map((profile) => { const existing = pendingFor.get(profile.id); return <Person key={profile.id} profile={profile} action={existing ? <span className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-500">{existing.sender_id === userId ? "Pending" : "Incoming"}</span> : <button type="button" disabled={Boolean(busy)} onClick={() => void sendRequest(profile)} className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-950"><UserPlus className="h-3.5 w-3.5" />Add friend</button>} />; })}</div>}</section>
    <div className="grid gap-5 lg:grid-cols-2"><section id="friend-requests" className="scroll-mt-6 rounded-[2rem] border border-cyan-300/15 bg-cyan-300/[0.025] p-6 sm:p-7"><SectionTitle icon={<UserPlus className="text-cyan-300" />} title="Friend requests" count={incomingCount} />{loading ? <Empty text="Loading your circle…" /> : incomingCount === 0 ? <Empty text="No pending requests. Add someone and start building your circle." /> : <div className="mt-5 space-y-2">{requests.filter((request) => request.receiver_id === userId).map((request) => <Person key={request.id} profile={request.sender} action={<div className="flex gap-2"><button disabled={busy === request.id} onClick={() => void respond(request, true)} className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-400 text-slate-950"><Check className="h-4 w-4" /></button><button disabled={busy === request.id} onClick={() => void respond(request, false)} className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 text-slate-400"><X className="h-4 w-4" /></button></div>} />)}</div>}</section><section className="rounded-[2rem] border border-white/[0.08] bg-white/[0.035] p-6 sm:p-7"><SectionTitle icon={<Zap className="text-yellow-300" />} title="Your circle" count={friends.length} />{loading ? <Empty text="Loading…" /> : friends.length === 0 ? <Empty text="Add your first friend, then use the League to turn progress into friendly competition." /> : <div className="mt-5 space-y-2">{friends.map((friend) => <Person key={friend.id} profile={friend.profile} action={<span className="text-right"><span className="block text-xs font-black text-cyan-200">Lv {friend.profile?.current_level || 1}</span><span className="block text-[10px] text-slate-600">{(friend.profile?.total_xp || 0).toLocaleString()} XP</span></span>} />)}</div>}</section></div>
  </main>;
}

function SectionTitle({ icon, title, count }: { icon: React.ReactNode; title: string; count: number }) { return <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.22em] text-slate-500">{icon}{title}</div><span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-black text-slate-500">{count}</span></div>; }
function Person({ profile, action }: { profile?: Profile; action: React.ReactNode }) { return <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-black/10 p-3"><Link to="/user-profile" search={{ id: profile?.id || "" }} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left transition hover:bg-white/[0.03]"><div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-slate-950 text-sm font-black text-cyan-200">{profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : initials(profile)}</div><div className="min-w-0"><div className="truncate text-sm font-black text-white">{label(profile)}</div>{profile?.username && <div className="truncate text-xs text-slate-600">@{profile.username}</div>}</div></Link>{action}</div>; }
function Empty({ text }: { text: string }) { return <div className="mt-5 rounded-2xl border border-dashed border-white/10 p-6 text-sm leading-6 text-slate-600">{text}</div>; }
