import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Mail, MapPin } from 'lucide-react';
import { Teammate } from '@/hooks/useTeammates';

interface TeammateCardProps {
  teammate: Teammate;
}

export function TeammateCard({ teammate }: TeammateCardProps) {
  const initials = `${teammate.first_name[0]}${teammate.last_name[0]}`.toUpperCase();
  const displayName = teammate.preferred_name || `${teammate.first_name} ${teammate.last_name}`;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-secondary/50 text-secondary-foreground font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold truncate">{displayName}</h3>
              <Badge variant="outline" className="text-xs shrink-0">
                {teammate.title || teammate.person_type || 'Staff'}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {teammate.email && (
                <a
                  href={`mailto:${teammate.email}`}
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[200px]">{teammate.email}</span>
                </a>
              )}
              {teammate.campus && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {teammate.campus.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
