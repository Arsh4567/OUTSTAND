import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Profile = { 
  id: string; 
  display_name?: string | null; 
  full_name?: string | null;
  avatar_url?: string | null;
  has_completed_onboarding?: boolean;
  screen_time?: number | null;
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Unified fetch function to get User and Profile simultaneously
  const fetchUserDataAndProfile = async (currentUser: User | null) => {
    if (!currentUser?.id) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    setUser(currentUser);

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        setProfile({ id: currentUser.id, display_name: null, full_name: null, avatar_url: null, has_completed_onboarding: false });
      } else {
        setProfile(data ?? { id: currentUser.id, display_name: null, full_name: null, avatar_url: null, has_completed_onboarding: false });
      }
    } catch (err) {
      console.error("Unhandled profile fetch error:", err);
      setProfile({ id: currentUser.id });
    } finally {
      // Only stop loading AFTER both user and profile are securely locked in state
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // 1. Initial Session Check on Mount (Hard Refresh handler)
    supabase.auth.getSession()
      .then(({ data }) => {
        if (isMounted) {
          fetchUserDataAndProfile(data.session?.user ?? null);
        }
      })
      .catch((err) => {
        console.error("Failed to get session:", err);
        if (isMounted) setLoading(false);
      });

    // 2. Auth State Change Listener (Login/Logout events)
    const { data: { subscription: sub } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (isMounted) {
        setLoading(true);
        fetchUserDataAndProfile(session?.user ?? null);
      }
    });

    return () => {
      isMounted = false;
      sub?.unsubscribe();
    };
  }, []);

  // Optimistic Update Function for Cinematic Onboarding
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user?.id) return { error: "No authenticated user found." };

    setProfile((prev) => prev ? { ...prev, ...updates } : { id: user.id, ...updates });

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);

    if (error) {
      console.error("Failed to sync profile update:", error);
      return { error };
    }
    
    return { success: true };
  };

  return { user, profile, loading, updateProfile };
}

export function displayNameOf(user: User | null, profile: Profile | null): string {
  return (
    profile?.full_name ||
    profile?.display_name ||
    (user?.user_metadata as any)?.full_name ||
    (user?.user_metadata as any)?.display_name ||
    user?.email?.split("@")[0] ||
    "Hustler"
  );
}
