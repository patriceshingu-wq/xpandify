import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Supervisor {
  id: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  email: string | null;
  phone: string | null;
  person_type: string | null;
  campus: string | null;
}

export function useSupervisor() {
  const { person } = useAuth();

  return useQuery({
    queryKey: ['supervisor', person?.id],
    queryFn: async () => {
      if (!person?.id) return null;

      // First get the current user's supervisor_id
      const { data: currentPerson, error: personError } = await supabase
        .from('people')
        .select('supervisor_id')
        .eq('id', person.id)
        .single();

      if (personError) throw personError;
      if (!currentPerson?.supervisor_id) return null;

      // Get supervisor details
      const { data: supervisor, error: supervisorError } = await supabase
        .from('people')
        .select('id, first_name, last_name, preferred_name, email, phone, person_type, campus')
        .eq('id', currentPerson.supervisor_id)
        .single();

      if (supervisorError) throw supervisorError;
      return supervisor as Supervisor;
    },
    enabled: !!person?.id,
  });
}
