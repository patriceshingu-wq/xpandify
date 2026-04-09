import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useEventRSVPs, useMyEventRSVP, useSubmitRSVP, RSVPStatus } from '@/hooks/useEventRSVP';
import { useLanguage } from '@/contexts/LanguageContext';
import { Check, X, HelpCircle, Clock, MessageSquare } from 'lucide-react';

interface EventRSVPSectionProps {
  eventId: string;
}

const statusConfig: Record<RSVPStatus, { icon: React.ElementType; label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  attending: { icon: Check, label: 'Attending', variant: 'default' },
  declined: { icon: X, label: 'Declined', variant: 'destructive' },
  maybe: { icon: HelpCircle, label: 'Maybe', variant: 'secondary' },
  pending: { icon: Clock, label: 'Pending', variant: 'outline' },
};

export function EventRSVPSection({ eventId }: EventRSVPSectionProps) {
  const { t } = useLanguage();
  const { data: rsvps } = useEventRSVPs(eventId);
  const { data: myRsvp } = useMyEventRSVP(eventId);
  const submitRSVP = useSubmitRSVP();
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');

  const handleRSVP = (status: RSVPStatus) => {
    submitRSVP.mutate({ eventId, status, notes: notes || undefined });
    setShowNotes(false);
    setNotes('');
  };

  const attendingCount = rsvps?.filter(r => r.status === 'attending').length || 0;
  const declinedCount = rsvps?.filter(r => r.status === 'declined').length || 0;
  const maybeCount = rsvps?.filter(r => r.status === 'maybe').length || 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          RSVP
        </CardTitle>
        <div className="flex gap-2">
          <Badge variant="default" className="bg-success/10 text-success border-success/20">{attendingCount} attending</Badge>
          {maybeCount > 0 && <Badge variant="secondary">{maybeCount} maybe</Badge>}
          {declinedCount > 0 && <Badge variant="outline">{declinedCount} declined</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* My RSVP */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            {myRsvp ? `Your response: ${statusConfig[myRsvp.status as RSVPStatus]?.label}` : 'Will you attend?'}
          </p>
          <div className="flex flex-wrap gap-2">
            {(['attending', 'maybe', 'declined'] as RSVPStatus[]).map((status) => {
              const config = statusConfig[status];
              const Icon = config.icon;
              const isSelected = myRsvp?.status === status;
              return (
                <Button
                  key={status}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleRSVP(status)}
                  disabled={submitRSVP.isPending}
                  className={isSelected ? '' : ''}
                >
                  <Icon className="h-4 w-4 mr-1" />
                  {config.label}
                </Button>
              );
            })}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNotes(!showNotes)}
            >
              Add note
            </Button>
          </div>
          {showNotes && (
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add a note (optional)..."
              rows={2}
            />
          )}
        </div>

        {/* RSVP List */}
        {rsvps && rsvps.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            {rsvps.filter(r => r.status !== 'pending').map((rsvp) => {
              const config = statusConfig[rsvp.status as RSVPStatus] || statusConfig.pending;
              const Icon = config.icon;
              return (
                <div key={rsvp.id} className="flex items-center justify-between text-sm py-1">
                  <span>{rsvp.person?.preferred_name || rsvp.person?.first_name} {rsvp.person?.last_name}</span>
                  <Badge variant={config.variant} className="text-xs">
                    <Icon className="h-3 w-3 mr-1" />
                    {config.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
