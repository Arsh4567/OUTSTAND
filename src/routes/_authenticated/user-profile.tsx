import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, MessageCircle, UserPlus, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/user-profile")({ component: UserProfilePage });

type Profile = { id: string; display_name: string | null; full_name: string | null; username: string | null; avatar_url: string | null; bio?: string | null; total_xp?: number | null; current_level?: number | null };
const label = (p: Profile) => p.display_name || p.full_name || (p.username ? `@${p.username}` : "OUTSTAND user");
const initials = (p: Profile) => label(p).slice(0, 1).toUpperCase();

function UserProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [relationship, setRelationship] = useState<"friend" | "pending" | "none">("none");
  const [loading, setLoading] = useState(true);
  const targetId = Route.useSearch?.() as unknown as { id?: string };

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!id || !auth.user) { setLoading(false); return; }
      setUserId(auth.user.id);
      const { data } = await supabase.from("profiles").select("id,display_name,full_name,username,avatar_url,bio,total_xp,current_level").eq("id", id).maybeSingle();
      setProfile(data as Profile | null);
      if (data) {
        const { data: friendship } = await supabase.from("friendships").select("id").eq("user_id", auth.user.id).eq("friend_id", id).maybeSingle();
        if (friendship) setRelationship("friend");
        else { const { data: request } = await supabase.from("friend_requests").select("id").or(`and(sender_id.eq.${auth.user.id},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${auth.user.id})`).eq("status", "pending").maybeSingle(); if (request) setRelationship("pending"); }
      }
      setLoading(false);
    })();
  }, []);

  const addFriend = async () => {
    if (!profile || !userId) return;
    const { error } = await supabase.rpc("send_friend_request", { target_user: profile.id });
    if (error) toast.error(error.message?.includes("Already friends") ? "You're already friends." : "Could not send friend request.");
    else { setRelationship("pending"); toast.success("Friend request sent."); }
  };

  if (loading) return <main className="mx-auto max-w-3xl p-6 text-slate-500">Loading profile…</main>;
  if (!profile) return <main className="mx-auto max-w-3xl p-6"><p className="text-white">Profile not found.</p><Link to="/friends" className="mt-4 inline-block text-cyan-300">Back to friends</Link></main>;

  return <main className="mx-auto max-w-3xl space-y-5 px-4 pb-24 pt-6 sm:px-6">
    <button type="button" onClick={() => navigate({ to: "/friends" })} className="inline-flex items-center gap-2 text-xs font-black text-slate-500 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to friends</button>
    <section className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,.14),transparent_35%),rgba(255,255,255,.035)] p-7 sm:p-10">
      <div className="flex flex-col items-center text-center sm:flex-row sm:text-left">
        <div className="grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 text-4xl font-black text-cyan-200">{profile.avatar_url ? <img src={profile.avatar_url} alt={`${label(profile)} avatar`} className="h-full w-full object-cover" /> : initials(profile)}</div>
        <div className="mt-5 sm:ml-6 sm:mt-0"><h1 className="text-3xl font-black text-white">{label(profile)}</h1>{profile.username && <p className="mt-1 text-sm text-cyan-200/60">@{profile.username}</p>}<p className="mt-3 text-sm text-slate-500">UID: #{profile.id.slice(-8)}</p><p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">{profile.bio || "No bio yet."}</p></div>
      </div>
      <div className="mt-7 flex flex-wrap gap-3">
        {relationship === "friend" ? <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-2.5 text-xs font-black text-emerald-200"><Users className="h-4 w-4" /> Friends</span> : relationship === "pending" ? <span className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-black text-slate-500">Request pending</span> : profile.id !== userId ? <button type="button" onClick={() => void addFriend()} className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-xs font-black text-slate-950 hover:bg-cyan-200"><UserPlus className="h-4 w-4" /> Add friend</button> : null}
        {relationship === "friend" && <Link to="/chat" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-xs font-black text-white"><MessageCircle className="h-4 w-4 text-cyan-300" /> Message</Link>}
      </div>
    </section>
  </main>;
}
