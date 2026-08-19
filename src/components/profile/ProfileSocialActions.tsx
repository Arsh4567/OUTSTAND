import { MessageCircle, UserPlus } from "lucide-react";
import { ProfileSocialUpgrade } from "@/components/profile/ProfileSocialUpgrade";

export function ProfileSocialActions() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 rounded-[2rem] border border-white/[0.08] bg-white/[0.035] p-4 backdrop-blur-2xl sm:p-5">
        <button type="button" onClick={() => window.location.assign("/friends")} className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-xs font-black text-slate-950 transition hover:bg-cyan-200">
          <UserPlus className="h-4 w-4" /> Add friends
        </button>
        <button type="button" onClick={() => window.location.assign("/chat")} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-xs font-black text-white transition hover:border-cyan-300/20 hover:bg-cyan-300/10">
          <MessageCircle className="h-4 w-4 text-cyan-300" /> Messages
        </button>
      </div>
      <ProfileSocialUpgrade />
    </div>
  );
}
