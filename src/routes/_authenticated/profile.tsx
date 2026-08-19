import { createFileRoute } from "@tanstack/react-router";
import { ProfileSocialActions } from "@/components/profile/ProfileSocialActions";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — OUTSTAND" },
      { name: "description", content: "Your OUTSTAND identity, progress, social profile, and recent activity." },
    ],
  }),
  component: ProfileSocialActions,
});
