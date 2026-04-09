import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEventAttendance, useCheckInPerson, useRemoveCheckIn } from '@/hooks/useEventAttendance';
import { useEventRSVPs } from '@/hooks/useEventRSVP';
import { usePeople } from '@/hooks/usePeople';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserCheck, UserX, Search, Plus, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface EventAttendanceSectionProps {
  eventId: string;
  isOrganizer: boolean;
}

export function EventAttendanceSection({ eventId, isOrganizer }: EventAttendanceSectionProps) {
  const { t } = useLanguage();
  const { data: attendance } = useEventAttendance(eventId);
  const { data: rsvps } = useEventRSVPs(eventId);
  const { data: people } = usePeople();
  const checkIn = useCheckInPerson();
  const removeCheckIn = useRemoveCheckIn();
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [search, setSearch] = useState('');

  const checkedInIds = new Set(attendance?.map(a => a.person_id) || []);
  
  // People who RSVPed attending but haven't checked in
  const expectedPeople = rsvps
    ?.filter(r => r.status === 'attending' && !checkedInIds.has(r.person_id))
    .map(r => r.person) || [];

  const filteredPeople = people?.filter(p => {
    if (checkedInIds.has(p.id)) return false;
    if (!search) return false;
    const name = `${p.first_name} ${p.last_name}`.toLowerCase();
    return name.includes(search.toLowerCase());
  }) || [];

  const handleCheckIn = (personId: string) => {
    checkIn.mutate({ eventId, personId });
    setSelectedPersonId('');
    setSearch('');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          Attendance
        </CardTitle>
        <Badge variant="secondary">{attendance?.length || 0} checked in</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick check-in for expected attendees */}
        {isOrganizer && expectedPeople.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Expected ({expectedPeople.length})</p>
            <div className="flex flex-wrap gap-2">
              {expectedPeople.map((person) => person && (
                <Button
                  key={person.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleCheckIn(person.id)}
                  disabled={checkIn.isPending}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {person.preferred_name || person.first_name} {person.last_name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Search and add */}
        {isOrganizer && (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search to check in..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {filteredPeople.length > 0 && (
              <div className="border rounded-md max-h-32 overflow-y-auto">
                {filteredPeople.slice(0, 5).map((person) => (
                  <button
                    key={person.id}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                    onClick={() => handleCheckIn(person.id)}
                  >
                    {person.first_name} {person.last_name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Checked-in list */}
        {attendance && attendance.length > 0 ? (
          <div className="space-y-1 pt-2 border-t">
            {attendance.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-success" />
                  <span className="text-sm">
                    {a.person?.preferred_name || a.person?.first_name} {a.person?.last_name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {format(parseISO(a.checked_in_at), 'h:mm a')}
                  </span>
                  {isOrganizer && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeCheckIn.mutate({ id: a.id, eventId })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No one checked in yet</p>
        )}
      </CardContent>
    </Card>
  );
}
