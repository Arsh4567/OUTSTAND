import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { useAppState } from '@/hooks/use-app-state';

export function useDPP() {
  const { user } = useAuth();
  const { refreshProfile } = useAppState(); // Assuming you have a way to refresh global state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completeDPP = async (
    subject: string, 
    chapterId: string, 
    difficulty: 'easy' | 'medium' | 'hard', 
    xpAmount: number
  ) => {
    if (!user) {
      setError("Agent not authenticated.");
      return false;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('complete_dpp_and_award_xp', {
        p_user_id: user.id,
        p_subject: subject,
        p_chapter_id: chapterId,
        p_difficulty: difficulty,
        p_xp_amount: xpAmount
      });

      if (rpcError) throw rpcError;

      if (data) {
        // Success! The RPC returned true
        await refreshProfile(); // Refresh XP on the frontend
        return true;
      } else {
        setError("Mission already completed today. No duplicate XP awarded.");
        return false;
      }
    } catch (err: any) {
      console.error("DPP Submission Error:", err);
      setError(err.message || "Failed to log mission.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { completeDPP, isSubmitting, error };
}
