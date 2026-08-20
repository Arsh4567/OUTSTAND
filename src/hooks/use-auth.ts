import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { requestPushPermission } from "@/lib/notification-engine";

export type Profile = {
  id: string;
  display_name?: string | null;
  full_name?: string | null;
  username?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  has_completed_onboarding?: boolean;
  screen_time?: number | null;
};

const fallbackProfile = (id: string): Profile => ({
  id,
  display_name: null,
  full_name: null,
  username: null,
  bio: null,
  avatar_url: null,
  has_completed_onboarding: false,
});

let notificationPromptedForUser: string | null = null;

function promptForNotifications(currentUser: User) {
  if (notificationPromptedForUser === currentUser.id) return;
  notificationPromptedForUser = currentUser.id;

  void requestPushPermission().catch((error) => {
    // Permission denial, unsupported browsers, and missing push configuration
    // should never block authentication or the rest of the app.
    console.info("Push notification setup skipped:", error instanceof Error ? error.message : error);
  });
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (currentUser: User | null) => {
    if (!currentUser?.id) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    setUser(currentUser);
    promptForNotifications(currentUser);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        setProfile(fallbackProfile(currentUser.id));
      } else {
        setProfile(data ? (data as Profile) : fallbackProfile(currentUser.id));
      }
    } catch (error) {
      console.error("Unhandled profile fetch error:", error);
      setProfile(fallbackProfile(currentUser.id));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession()
      .then(({ data }) => {
        if (mounted) void fetchProfile(data.session?.user ?? null);
      })
      .catch((error) => {
        console.error("Failed to get session:", error);
        if (mounted) setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setLoading(true);
      void fetchProfile(session?.user ?? null);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user?.id) return { error: new Error("No authenticated user found.") };

    const previous = profile;
    setProfile((current) => current ? { ...current, ...updates } : { ...fallbackProfile(user.id), ...updates });

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select("*")
      .single();

    if (error) {
      setProfile(previous);
      console.error("Failed to sync profile update:", error);
      return { error };
    }

    setProfile(data as Profile);
    return { data: data as Profile };
  }, [profile, user?.id]);

  return { user, profile, loading, updateProfile, refreshProfile: () => fetchProfile(user) };
}

export function displayNameOf(user: User | null, profile: Profile | null): string {
  return (
    profile?.full_name ||
    profile?.display_name ||
    profile?.username ||
    (user?.user_metadata as Record<string, unknown> | undefined)?.full_name as string ||
    (user?.user_metadata as Record<string, unknown> | undefined)?.display_name as string ||
    user?.email?.split("@")[0] ||
    "Friend"
  );
}
