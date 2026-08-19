import { useEffect, useState } from "react";
import { MessageCircle, Search, UserPlus, X } from "lucide-react";
import { ProfileSocialUpgrade } from "@/components/profile/ProfileSocialUpgrade";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Profile = {
  id: string;
  display_name: string | null;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const personName = (profile: Profile) =>
  profile.display_name || profile.full_name || (profile.username ? `@${profile.username}` : "OUTSTAND user");

export function ProfileSocialActions() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    if (!open || !userId) return;
    const timer = window.setTimeout(async () => {
      const clean = query.trim().replace(/^@/, "");
      if (!clean) {
        setResults([]);
        return;
      }

      const request = uuidPattern.test(clean)
        ? supabase
            .from("profiles")
            .select("id,display_name,full_name,username,avatar_url")
            .eq("id", clean)
            .neq("id", userId)
            .limit(8)
        : supabase
            .from("profiles")
            .select("id,display_name,full_name,username,avatar_url")
            .or(`username.ilike.%${clean}%,display_name.ilike.%${clean}%,full_name.ilike.%${clean}%`)
            .neq("id", userId)
            .limit(8);

      const { data, error } = await request;
      if (error) {
        toast.error("Could not search users.");
        setResults([]);
        return;
      }
      setResults(data || []);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [open, query, userId]);

  const sendFriendRequest = async (target: Profile) => {
    if (!userId || busy) return;
    setBusy(target.id);

    const { error } = await supabase.rpc("send_friend_request", {
      target_user: target.id,
    });

    if (error) {
      const message = error.message?.includes("Already friends")
        ? "You're already friends."
        : error.message?.includes("Invalid friend target")
          ? "You can't add this user."
          : "Could not send friend request.";
      toast.error(message);
    } else {
      toast.success(`Friend request sent to ${personName(target)}`);
      setResults((current) => current.filter((profile) => profile.id !== target.id));
    }

    setBusy(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 rounded-[2rem] border border-white/[0.08] bg-white/[0.035] p-4 backdrop-blur-2xl sm:p-5">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-xs font-black text-slate-950 transition hover:bg-cyan-200"
        >
          <UserPlus className="h-4 w-4" /> Add friends
        </button>
        <button
          type="button"
          onClick={() => window.location.assign("/chat")}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-xs font-black text-white transition hover:border-cyan-300/20 hover:bg-cyan-300/10"
        >
          <MessageCircle className="h-4 w-4 text-cyan-300" /> Messages
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="friend-search-title">
          <div className="w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b1020] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.06] p-5">
              <div>
                <h2 id="friend-search-title" className="text-xl font-black text-white">Find a friend</h2>
                <p className="mt-1 text-xs text-slate-500">Search by name, username, or exact User ID.</p>
              </div>
              <button type="button" onClick={() => { setOpen(false); setQuery(""); setResults([]); }} aria-label="Close friend search" className="rounded-xl p-2 text-slate-500 transition hover:bg-white/5 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                <input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Name, @username, or User ID…"
                  className="w-full rounded-2xl border border-white/10 bg-black/25 py-4 pl-11 pr-4 text-sm font-semibold text-white outline-none placeholder:text-slate-700 focus:border-cyan-300/40"
                />
              </div>

              <div className="mt-4 max-h-[55vh] space-y-2 overflow-y-auto">
                {query.trim() && results.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-600">No users found.</div>
                ) : results.map((profile) => (
                  <div key={profile.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-950 text-sm font-black text-cyan-200">
                        {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : personName(profile).slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-white">{personName(profile)}</p>
                        {profile.username && <p className="truncate text-xs text-slate-600">@{profile.username}</p>}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={Boolean(busy)}
                      onClick={() => void sendFriendRequest(profile)}
                      className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-950 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      {busy === profile.id ? "Sending…" : "Add friend"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <ProfileSocialUpgrade />
    </div>
  );
}
