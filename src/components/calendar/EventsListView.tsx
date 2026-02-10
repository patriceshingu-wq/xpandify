import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarIcon, Clock, MapPin } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { getStatusBadgeVariant } from '@/components/calendar/EventStatusBadge';
import type { CalendarEvent } from '@/hooks/useEvents';

interface EventsListViewProps {
  events: CalendarEvent[] | undefined;
  isLoading: boolean;
}

export default function EventsListView({ events, isLoading }: EventsListViewProps) {
  const navigate = useNavigate();
  const { getLocalizedField, t } = useLanguage();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <Card className="p-8 text-center">
        <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">
          {t('calendar.noEvents') || 'No events found'}
        </h3>
        <p className="text-muted-foreground">
          {t('calendar.noEventsDescription') || 'No events match your current filters.'}
        </p>
      </Card>
    );
  }

  // Group events by date
  const grouped: Record<string, CalendarEvent[]> = {};
  events.forEach((event) => {
    if (!grouped[event.date]) grouped[event.date] = [];
    grouped[event.date].push(event);
  });

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([date, dayEvents]) => (
        <div key={date}>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2 sticky top-0 bg-background py-1">
            {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
          </h3>
          <div className="space-y-2">
            {dayEvents.map((event) => (
              <Card
                key={event.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => navigate(`/calendar/events/${event.id}`)}
              >
                <CardContent className="p-3 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">
                        {getLocalizedField(event, 'title')}
                      </span>
                      <Badge variant={getStatusBadgeVariant(event.status)} className="text-xs">
                        {event.status}
                      </Badge>
                      {event.language && event.language !== 'Bilingual' && (
                        <Badge variant="outline" className="text-xs">{event.language}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      {!event.is_all_day && event.start_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {event.start_time.slice(0, 5)}
                          {event.end_time && ` – ${event.end_time.slice(0, 5)}`}
                        </span>
                      )}
                      {event.is_all_day && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          All day
                        </span>
                      )}
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </span>
                      )}
                      {event.ministry && (
                        <span>{getLocalizedField(event.ministry, 'name')}</span>
                      )}
                      {event.program && (
                        <span>{event.program.code}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
