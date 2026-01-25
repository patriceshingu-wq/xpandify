import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Mail, Phone, MapPin, Crown } from 'lucide-react';
import { Supervisor } from '@/hooks/useSupervisor';

interface SupervisorCardProps {
  supervisor: Supervisor;
}

export function SupervisorCard({ supervisor }: SupervisorCardProps) {
  const initials = `${supervisor.first_name[0]}${supervisor.last_name[0]}`.toUpperCase();
  const displayName = supervisor.preferred_name || `${supervisor.first_name} ${supervisor.last_name}`;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-primary uppercase tracking-wide">Your Supervisor</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg truncate">{displayName}</h3>
              <Badge variant="secondary" className="text-xs shrink-0">
                {supervisor.person_type || 'Staff'}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {supervisor.email && (
                <a 
                  href={`mailto:${supervisor.email}`} 
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>{supervisor.email}</span>
                </a>
              )}
              {supervisor.phone && (
                <a 
                  href={`tel:${supervisor.phone}`} 
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>{supervisor.phone}</span>
                </a>
              )}
              {supervisor.campus && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {supervisor.campus}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
