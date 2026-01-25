import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Teammate {
  id: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  email: string | null;
  person_type: string | null;
  campus: string | null;
}

export function useTeammates() {
  const { person } = useAuth();

  return useQuery({
    queryKey: ['teammates', person?.id],
    queryFn: async () => {
      if (!person?.id) return [];

      // First get the current user's supervisor_id
      const { data: currentPerson, error: personError } = await supabase
        .from('people')
        .select('supervisor_id')
        .eq('id', person.id)
        .single();

      if (personError) throw personError;
      if (!currentPerson?.supervisor_id) return [];

      // Get all people who share the same supervisor (excluding current user)
      const { data: teammates, error: teammatesError } = await supabase
        .from('people')
        .select('id, first_name, last_name, preferred_name, email, person_type, campus')
        .eq('supervisor_id', currentPerson.supervisor_id)
        .eq('status', 'active')
        .neq('id', person.id)
        .order('first_name');

      if (teammatesError) throw teammatesError;
      return teammates as Teammate[];
    },
    enabled: !!person?.id,
  });
}
