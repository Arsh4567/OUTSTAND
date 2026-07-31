import { useState } from 'react';
import { supabase } from '@/lib/supabase'; // Adjust import based on your setup
// import { useAuth } from '@/hooks/use-auth'; // Assuming you have an auth hook

export function useDPP() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completeDPP = async (
    userId: string,
    subject: string, 
    chapterId: string, 
    difficulty: 'easy' | 'medium' | 'hard', 
    xpAmount: number
  ) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('complete_dpp_and_award_xp', {
        p_user_id: userId,
        p_subject: subject,
        p_chapter_id: chapterId,
        p_difficulty: difficulty,
        p_xp_amount: xpAmount
      });

      if (rpcError) throw rpcError;

      if (data) {
        // RPC returned true (Success!)
        return true;
      } else {
        // RPC returned false (Already completed today)
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
