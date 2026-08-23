import type { ReactNode } from "react";

/**
 * The profile page already owns the primary identity card.
 * Keep this compatibility boundary so existing imports remain safe while the
 * old duplicate social/profile card is no longer rendered.
 */
export function ProfileSocialUpgrade(): ReactNode {
  return null;
}
