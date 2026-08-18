import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, Clock3, Search, UserPlus, Users, X, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/friends")({ component: FriendsPage });

type Profile = { id: string; display_name: string | null; full_name: string | null; username: string | null; avatar_url: string | null; total_xp: number | null; current_level: number | null };
type Request = { id: string; sender_id: string; receiver_id: string; status: string; created_at: string; sender?: Profile; receiver?: Profile };
type Friend = { user_id: string; friend_id: string; created_at: string; profile?: Profile };

const initials = (p?: Profile) => (p?.display_name || p?.full_name || p?.username || "U").slice(0, 1).toUpperCase();
const label = (p?: Profile) => p?.display_name || p?.full_name || (p?.username ? `@${p.username}` : "Outstand user");

function FriendsPage() {
  const [userId, setUserId] = useState<string>();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async (uid: string) => {
    setLoading(true);
    const [{ data: incoming }, { data: outgoing }, { data: rows }] = await Promise.all([
      supabase.from("friend_requests").select("*").eq("receiver_id", uid).eq("status", "pending").order("created_at", { ascending: false }),
      supabase.from("friend_requests").select("*").eq("sender_id", uid).eq("status", "pending").order("created_at", { ascending: false }),
      supabase.from("friendships").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
    ]);
    const allRequests = [...(incoming || []), ...(outgoing || [])] as Request[];
    const ids = [...new Set([...allRequests.map(r => r.sender_id), ...allRequests.map(r => r.receiver_id), ...(rows || []).map(r => r.friend_id)].filter(id => id !== uid))];
    let profiles: Profile[] = [];
    if (ids.length) { const { data } = await supabase.from("profiles").select("id,display_name,full_name,username,avatar_url,total_xp,current_level").in("id", ids); profiles = data || []; }
    const map = new Map(profiles.map(p => [p.id, p]));
    setRequests(allRequests.map(r => ({ ...r, sender: map.get(r.sender_id), receiver: map.get(r.receiver_id) })));
    setFriends((rows || []).map(r => ({ ...r, profile: map.get(r.friend_id) })) as Friend[]);
    setLoading(false);
  };

  useEffect(() => { supabase.auth.getUser().then(({ data }) => { if (data.user) { setUserId(data.user.id); void load(data.user.id); } else setLoading(false); }); }, []);

  useEffect(() => {
    const t = window.setTimeout(async () => {
      const q = query.trim();
      if (!q || !userId) { setResults([]); return; }
      const clean = q.replace(/^@/, "");
      const { data } = await supabase.from("profiles").select("id,display_name,full_name,username,avatar_url,total_xp,current_level").or(`username.ilike.%${clean}%,display_name.ilike.%${clean}%,full_name.ilike.%${clean}%`).neq("id", userId).limit(8);
      setResults(data || []);
    }, 250);
    return () => window.clearTimeout(t);
  }, [query, userId]);

  const pendingFor = useMemo(() => new Map(requests.map(r => [r.sender_id === userId ? r.receiver_id : r.sender_id, r])), [requests, userId]);

  const sendRequest = async (target: Profile) => {
    if (!userId) return;
    setBusy(target.id);
    const { error } = await supabase.from("friend_requests").insert({ sender_id: userId, receiver_id: target.id });
    if (error) toast.error(error.code === "23505" ? "A request already exists." : "Could not send request.");
    else { toast.success(`Request sent to ${label(target)}`); await load(userId); }
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
    await load(userId!); setBusy(null);
  };

  return <main className="mx-auto max-w-6xl space-y-6 px-4 pb-24 pt-5 sm:px-6 lg:px-8">
    <header className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[radial-gradient(circle_at_10%_10%,rgba(34,211,238,.14),transparent_30%),radial-gradient(circle_at_90%_90%,rgba(129,140,248,.12),transparent_35%),rgba(255,255,255,.025)] p-7 sm:p-10">
      <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between"><div><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.28em] text-cyan-300"><Users className="h-4 w-4" /> Social layer</div><h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">Build your circle.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">Find people, send a request, and grow alongside friends without turning productivity into a popularity contest.</p></div><div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4"><div className="text-2xl font-black text-white">{friends.length}</div><div className="text-[10px] font-black uppercase tracking-[.2em] text-slate-600">Friends</div></div></div>
    </header>

    <section className="rounded-[2rem] border border-white/[0.08] bg-white/[0.035] p-5 shadow-[0_24px_80px_rgba(0,0,0,.22)] backdrop-blur-2xl sm:p-7">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.24em] text-slate-500"><Search className="h-4 w-4" /> Find people</div>
      <div className="relative mt-4"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by username or name…" className="w-full rounded-2xl border border-white/10 bg-black/20 py-4 pl-11 pr-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-300/40" /></div>
      {results.length > 0 && <div className="mt-3 grid gap-2">{results.map(p => { const existing = pendingFor.get(p.id); return <Person key={p.id} profile={p} action={existing ? <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-500"><Clock3 className="h-3.5 w-3.5" />{existing.sender_id === userId ? "Pending" : "Incoming"}</span> : <button disabled={busy === p.id} onClick={() => void sendRequest(p)} className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-950 disabled:opacity-50"><UserPlus className="h-3.5 w-3.5" />Add friend</button>} />; })}</div>}
    </section>

    <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-[2rem] border border-white/[0.08] bg-white/[0.035] p-6 backdrop-blur-2xl sm:p-7"><SectionTitle icon={<UserPlus className="text-cyan-300" />} title="Friend requests" count={requests.filter(r => r.receiver_id === userId).length} />{loading ? <Empty text="Loading your circle…" /> : requests.filter(r => r.receiver_id === userId).length === 0 ? <Empty text="No pending requests. Your circle is ready when you are." /> : <div className="mt-5 space-y-2">{requests.filter(r => r.receiver_id === userId).map(r => <Person key={r.id} profile={r.sender} action={<div className="flex gap-2"><button disabled={busy === r.id} onClick={() => void respond(r, true)} aria-label="Accept friend request" className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-400 text-slate-950"><Check className="h-4 w-4" /></button><button disabled={busy === r.id} onClick={() => void respond(r, false)} aria-label="Decline friend request" className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 text-slate-400"><X className="h-4 w-4" /></button></div>} />)}</div>}</section>

      <section className="rounded-[2rem] border border-white/[0.08] bg-white/[0.035] p-6 backdrop-blur-2xl sm:p-7"><SectionTitle icon={<Zap className="text-yellow-300" />} title="Your circle" count={friends.length} />{loading ? <Empty text="Loading…" /> : friends.length === 0 ? <Empty text="Add your first friend to start building your circle." /> : <div className="mt-5 space-y-2">{friends.map(f => <Person key={f.id} profile={f.profile} action={<span className="text-xs font-black text-cyan-200">Lv {f.profile?.current_level || 1}</span>} />)}</div>}</section>
    </div>
  </main>;
}

function SectionTitle({ icon, title, count }: { icon: React.ReactNode; title: string; count: number }) { return <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.22em] text-slate-500">{icon}{title}</div><span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-black text-slate-500">{count}</span></div>; }
function Person({ profile, action }: { profile?: Profile; action: React.ReactNode }) { return <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-black/10 p-3"><div className="flex min-w-0 items-center gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-slate-950 text-sm font-black text-cyan-200">{profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : initials(profile)}</div><div className="min-w-0"><div className="truncate text-sm font-black text-white">{label(profile)}</div>{profile?.username && <div className="truncate text-xs text-slate-600">@{profile.username}</div>}</div></div>{action}</div>; }
function Empty({ text }: { text: string }) { return <div className="mt-5 rounded-2xl border border-dashed border-white/10 p-6 text-sm leading-6 text-slate-600">{text}</div>; }
