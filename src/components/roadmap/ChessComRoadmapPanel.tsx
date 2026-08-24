import { useEffect, useState } from "react";
import { ChessKnight, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type ChessData = { profile: { username: string; avatar: string | null; title: string | null }; ratings: { rapid: number | null; blitz: number | null; bullet: number | null; tactics: number | null } };
type SavedChessData = ChessData & { generatedRoadmap?: unknown; savedAt?: string };
type Props = { value?: ChessData | null; onLoaded?: (data: ChessData) => void };

const ratingLabel = (value: number | null) => value == null ? "—" : String(value);

async function saveChessData(data: ChessData, generatedRoadmap?: unknown) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const payload = {
    user_id: user.id,
    chess_com_username: data.profile.username,
    chess_com_avatar: data.profile.avatar,
    chess_com_title: data.profile.title,
    rapid_rating: data.ratings.rapid,
    blitz_rating: data.ratings.blitz,
    bullet_rating: data.ratings.bullet,
    tactics_rating: data.ratings.tactics,
    ratings: data.ratings,
    ...(generatedRoadmap !== undefined ? { generated_roadmap: generatedRoadmap, roadmap_generated_at: new Date().toISOString() } : {}),
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("chess_roadmap_profiles").upsert(payload, { onConflict: "user_id" });
  if (error) throw error;
}

export async function loadSavedChessRoadmap(): Promise<SavedChessData | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from("chess_roadmap_profiles").select("chess_com_username,chess_com_avatar,chess_com_title,rapid_rating,blitz_rating,bullet_rating,tactics_rating,generated_roadmap,roadmap_generated_at").eq("user_id", user.id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    profile: { username: data.chess_com_username, avatar: data.chess_com_avatar, title: data.chess_com_title },
    ratings: { rapid: data.rapid_rating, blitz: data.blitz_rating, bullet: data.bullet_rating, tactics: data.tactics_rating },
    generatedRoadmap: data.generated_roadmap,
    savedAt: data.roadmap_generated_at,
  };
}

export async function saveGeneratedChessRoadmap(data: ChessData, generatedRoadmap: unknown) {
  await saveChessData(data, generatedRoadmap);
}

export function ChessComRoadmapPanel({ value, onLoaded }: Props) {
  const [username, setUsername] = useState(value?.profile.username || "");
  const [data, setData] = useState<ChessData | null>(value || null);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void loadSavedChessRoadmap().then((saved) => {
      if (cancelled || !saved) return;
      setUsername(saved.profile.username);
      setData({ profile: saved.profile, ratings: saved.ratings });
      onLoaded?.({ profile: saved.profile, ratings: saved.ratings });
    }).catch(() => {
      if (!cancelled) setError("Could not restore your saved Chess.com profile.");
    }).finally(() => {
      if (!cancelled) setRestoring(false);
    });
    return () => { cancelled = true; };
  }, [onLoaded]);

  const connect = async () => {
    const value = username.trim().replace(/^@/, "");
    if (!value) return;
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/chesscom?username=${encodeURIComponent(value)}`, { headers: { Accept: "application/json" } });
      const result = await response.json();
      if (!response.ok) throw new Error(response.status === 404 ? "Chess.com username not found." : response.status === 429 ? "Chess.com is rate-limiting requests. Try again shortly." : result.error || "Could not load Chess.com data.");
      const nextData = result as ChessData;
      setData(nextData);
      onLoaded?.(nextData);
      await saveChessData(nextData);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not load Chess.com data."); }
    finally { setLoading(false); }
  };

  return <section className="rounded-[2rem] border border-orange-300/10 bg-white/[0.025] p-5 sm:p-7">
    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
      <div><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.2em] text-orange-200/75"><ChessKnight className="h-4 w-4" />Chess.com profile</div><h2 className="mt-2 text-2xl font-black tracking-tight text-white">Build the chess roadmap from your actual ratings.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Connect a public Chess.com profile. OUTSTAND uses rapid, blitz, bullet and tactics ratings to choose the highest-value training priorities.</p></div>
      {(data || restoring) && <button type="button" onClick={connect} disabled={loading || restoring} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-black text-slate-200 disabled:opacity-50"><RefreshCw className="h-4 w-4" />{restoring ? "Restoring…" : "Refresh"}</button>}
    </div>
    <div className="mt-5 flex flex-col gap-2 sm:flex-row"><input value={username} onChange={(e) => setUsername(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void connect(); }} placeholder="Chess.com username" autoComplete="off" className="min-w-0 flex-1 rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-slate-600 focus:border-orange-200/30" /><button type="button" onClick={() => void connect()} disabled={loading || restoring || !username.trim()} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-200 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50">{loading ? <><Loader2 className="h-4 w-4 animate-spin" />Loading Chess.com…</> : "Connect"}</button></div>
    {error && <div role="alert" className="mt-3 rounded-2xl border border-red-300/15 bg-red-300/[0.05] px-4 py-3 text-sm font-semibold text-red-200">{error}</div>}
    {data && <div className="mt-5 rounded-[1.5rem] border border-white/[0.07] bg-black/10 p-4 sm:p-5"><div className="flex items-center gap-3"><div className="h-12 w-12 overflow-hidden rounded-full border border-white/10 bg-white/5">{data.profile.avatar ? <img src={data.profile.avatar} alt={`${data.profile.username} avatar`} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-xs font-black text-slate-600">C</div>}</div><div><div className="flex items-center gap-2"><span className="text-base font-black text-white">{data.profile.username}</span>{data.profile.title && <span className="rounded-md border border-orange-200/15 bg-orange-200/[0.06] px-1.5 py-0.5 text-[9px] font-black text-orange-100">{data.profile.title}</span>}</div><div className="mt-1 text-[10px] font-bold uppercase tracking-[.14em] text-slate-600">Saved public profile data</div></div></div><div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">{([["Rapid", data.ratings.rapid], ["Blitz", data.ratings.blitz], ["Bullet", data.ratings.bullet], ["Tactics", data.ratings.tactics]] as const).map(([label, value]) => <div key={label} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3"><div className="text-[9px] font-black uppercase tracking-[.15em] text-slate-600">{label}</div><div className="mt-1 text-xl font-black tabular-nums text-white">{ratingLabel(value)}</div></div>)}</div></div>}
  </section>;
}
