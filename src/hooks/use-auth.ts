import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Expanded to include the new onboarding data we are collecting
export type Profile = { 
  id: string; 
  display_name?: string | null; 
  full_name?: string | null;
  avatar_url?: string | null;
  has_completed_onboarding?: boolean;
  screen_time?: number | null; // Added for the Reality Check scene
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Safe Auth Listener setup
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });

    // 2. Safe Session Fetching with .catch()
    supabase.auth.getSession()
      .then(({ data }) => {
        setUser(data.session?.user ?? null);
      })
      .catch((err) => {
        console.error("Failed to get session:", err);
      })
      .finally(() => {
        setLoading(false);
      });

    // 3. Safe cleanup (optional chaining in case sub is missing)
    return () => {
      sub?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setProfile(null);
      return;
    }

    // 4. Use select("*") so it doesn't crash if a specific column is missing
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error("Error fetching profile:", error);
          setProfile({ id: user.id, display_name: null, full_name: null, avatar_url: null });
          return;
        }
        setProfile(data ?? { id: user.id, display_name: null, full_name: null, avatar_url: null });
      })
      .catch((err) => {
        console.error("Unhandled profile fetch error:", err);
        setProfile({ id: user.id });
      });
  }, [user]);

  // 5. NEW: Optimistic Update Function for Cinematic Onboarding
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user?.id) return { error: "No authenticated user found." };

    // Update the local UI instantly so there is zero visual lag
    setProfile((prev) => prev ? { ...prev, ...updates } : { id: user.id, ...updates });

    // Quietly sync with the database in the background
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
  // Checks for BOTH full_name and display_name 
  return (
    profile?.full_name ||
    profile?.display_name ||
    (user?.user_metadata as any)?.full_name ||
    (user?.user_metadata as any)?.display_name ||
    user?.email?.split("@")[0] ||
    "Hustler"
  );
}
