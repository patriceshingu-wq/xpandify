import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export function MyRolesWidget() {
  const { person } = useAuth();
  const { getLocalizedField } = useLanguage();
  const navigate = useNavigate();

  const { data: myRoles = [] } = useQuery({
    queryKey: ['my-event-roles', person?.id],
    queryFn: async () => {
      if (!person?.id) return [];

      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('event_roles')
        .select(`
          id, role,
          event:events!event_roles_event_id_fkey(id, title_en, title_fr, date, start_time, location)
        `)
        .eq('person_id', person.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || [])
        .map(item => ({
          ...item,
          event: Array.isArray(item.event) ? item.event[0] : item.event,
        }))
        .filter(item => item.event && item.event.date >= today)
        .sort((a, b) => (a.event?.date || '').localeCompare(b.event?.date || ''))
        .slice(0, 5);
    },
    enabled: !!person?.id,
  });

  if (myRoles.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="h-4 w-4" />
          My Upcoming Roles
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {myRoles.map((role) => (
          <div
            key={role.id}
            className="flex items-center justify-between p-2 rounded border cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => navigate(`/calendar/events/${role.event?.id}`)}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{getLocalizedField(role.event, 'title')}</p>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {role.event?.date && format(parseISO(role.event.date), 'MMM d')}
                {role.event?.start_time && ` • ${role.event.start_time.slice(0, 5)}`}
              </div>
            </div>
            <Badge variant="outline" className="text-xs shrink-0">{role.role}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
