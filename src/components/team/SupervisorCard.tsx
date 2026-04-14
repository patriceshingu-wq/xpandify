import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Mail, Phone, MapPin, Crown, Calendar } from 'lucide-react';
import { Supervisor } from '@/hooks/useSupervisor';

interface SupervisorCardProps {
  supervisor: Supervisor;
  onScheduleMeeting?: () => void;
}

export function SupervisorCard({ supervisor, onScheduleMeeting }: SupervisorCardProps) {
  const initials = `${supervisor.first_name[0]}${supervisor.last_name[0]}`.toUpperCase();
  const displayName = supervisor.preferred_name || `${supervisor.first_name} ${supervisor.last_name}`;

  return (
    <Card className="border-border bg-muted/20">
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col gap-4">
          {/* Top section: Avatar and info */}
          <div className="flex items-start gap-3 md:gap-4">
            <Avatar className="h-14 w-14 md:h-16 md:w-16 border-2 border-border shrink-0">
              <AvatarFallback className="bg-muted text-foreground font-bold text-lg md:text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Crown className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Your Supervisor</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                <h3 className="font-semibold text-base md:text-lg truncate">{displayName}</h3>
                <Badge variant="secondary" className="text-xs w-fit shrink-0">
                  {supervisor.title || supervisor.person_type || 'Staff'}
                </Badge>
              </div>
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-sm text-muted-foreground">
                {supervisor.email && (
                  <a
                    href={`mailto:${supervisor.email}`}
                    className="flex items-center gap-1.5 hover:text-foreground/70 transition-colors truncate"
                  >
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{supervisor.email}</span>
                  </a>
                )}
                {supervisor.phone && (
                  <a
                    href={`tel:${supervisor.phone}`}
                    className="flex items-center gap-1.5 hover:text-foreground/70 transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <span>{supervisor.phone}</span>
                  </a>
                )}
                {supervisor.campus && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {supervisor.campus.name}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Action button - full width on mobile, inline on desktop */}
          {onScheduleMeeting && (
            <Button onClick={onScheduleMeeting} className="gap-2 w-full sm:w-auto sm:self-end touch-target">
              <Calendar className="h-4 w-4" />
              Schedule 1:1
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
