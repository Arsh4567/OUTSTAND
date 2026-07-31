import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";

export const useDpps = () => {
  return useQuery({
    queryKey: ['dpps'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dpps')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching DPPs:", error);
        throw error;
      }
      
      return data;
    }
  });
};
