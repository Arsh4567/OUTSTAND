import { useMemo, useState } from "react";
import { BadgeCheck, Check, Clock3, Copy, Link2, UserPlus, UserRoundMinus, Users, Zap } from "lucide-react";
import { toast } from "sonner";
import { useProfileState } from "@/hooks/use-profile-state";

const panel = "rounded-[2rem] border border-white/[0.08] bg-white/[0.035] shadow-[0_30px_100px_-55px_rgba(34,211,238,.28)] backdrop-blur-2xl";

function formattedUid(id?: string | null) {
  if (!id) return "#00000";
  const hex = id.replace(/-/g, "").slice(-6);
  return `#${String(parseInt(hex, 16) % 100000).padStart(5, "0")}`;
}

export function ProfileSocialUpgrade() {
  const state = useProfileState();
  const [friendMode, setFriendMode] = useState<"add" | "requested" | "remove">("add");
  const [copied, setCopied] = useState(false);
  const uid = useMemo(() => formattedUid(state.user?.id), [state.user?.id]);

  const shareProfile = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Link copied!");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy the profile link.");
    }
  };

  const friendAction = () => {
    setFriendMode((current) => current === "add" ? "requested" : current === "requested" ? "remove" : "add");
  };

  const friendLabel = friendMode === "add" ? "Add Friend" : friendMode === "requested" ? "Requested" : "Remove Friend";
  const friendClass = friendMode === "remove"
    ? "border-rose-300/20 bg-rose-400/10 text-rose-200 hover:bg-rose-400/15"
    : friendMode === "requested"
      ? "border-amber-300/20 bg-amber-300/10 text-amber-200 hover:bg-amber-300/15"
      : "border-cyan-300/20 bg-cyan-300 text-slate-950 hover:bg-cyan-200";

  return (
    <section className={`${panel} overflow-hidden`}>
      <div className="relative overflow-hidden p-5 sm:p-7">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950 text-3xl font-black text-cyan-200">
              {state.profile?.avatar_url ? <img src={state.profile.avatar_url} alt="Profile avatar" className="h-full w-full object-cover" /> : (state.name || "U").slice(0, 1).toUpperCase()}
              <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-[2px] border-slate-950 bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.8)]" aria-label="Online" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-2xl font-black tracking-tight text-white">{state.name}</h2>
                <span title="Verified" className="inline-flex items-center gap-1 rounded-full border border-cyan-300/15 bg-cyan-300/10 px-2 py-1 text-[9px] font-black uppercase tracking-[.12em] text-cyan-200"><BadgeCheck className="h-3.5 w-3.5" />Verified</span>
                <span className="rounded-full border border-violet-300/20 bg-violet-300/10 px-2 py-1 text-[9px] font-black uppercase tracking-[.12em] text-violet-200">PRO</span>
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-500">UID: {uid}</p>
              {state.profile?.username && <p className="mt-1 text-xs font-semibold text-cyan-200/60">@{state.profile.username}</p>}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-black/15 px-3 py-2 text-xs font-bold text-slate-400"><Users className="h-4 w-4 text-cyan-300" />Friends: 124</span>
            <button type="button" onClick={friendAction} className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-black transition ${friendClass}`}>
              {friendMode === "remove" ? <UserRoundMinus className="h-4 w-4" /> : friendMode === "requested" ? <Check className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {friendLabel}
            </button>
            <button type="button" onClick={shareProfile} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-xs font-black text-white transition hover:border-cyan-300/20 hover:bg-cyan-300/10">
              {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Link2 className="h-4 w-4 text-cyan-300" />}
              {copied ? "Link Copied!" : "Share Profile"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-5 border-t border-white/[0.06] p-5 sm:p-7 lg:grid-cols-[1fr_.7fr]">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.22em] text-slate-500"><Clock3 className="h-4 w-4 text-cyan-300" />Recent Activity</div>
          <div className="relative mt-6 space-y-5 pl-7">
            <div className="absolute bottom-2 left-[6px] top-2 w-px bg-gradient-to-b from-cyan-300/40 via-violet-300/20 to-transparent" />
            {["Earned Top Contributor Badge", "Completed a 7-day focus streak", "Reached a new profile milestone"].map((item, index) => (
              <div key={item} className="relative">
                <span className="absolute -left-7 top-1.5 grid h-3 w-3 place-items-center rounded-full border-2 border-slate-950 bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,.55)]" />
                <p className="text-sm font-bold text-white">{item}</p>
                <p className="mt-1 text-xs text-slate-600">{index === 0 ? "2 hours ago" : index === 1 ? "Yesterday" : "3 days ago"}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-300/10 bg-gradient-to-br from-cyan-300/[0.06] to-violet-400/[0.03] p-5">
          <p className="text-[9px] font-black uppercase tracking-[.2em] text-cyan-200/70">Profile signal</p>
          <p className="mt-3 text-sm leading-6 text-slate-300">A shareable identity layer for OUTSTAND — built around progress, social proof, and momentum.</p>
          <button type="button" onClick={state.handleCopyId} className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-slate-500 transition hover:text-white">
            {state.copiedId ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5 text-cyan-300" />}
            {state.copiedId ? "UID copied" : "Copy UID"}
          </button>
        </div>
      </div>
    </section>
  );
}
