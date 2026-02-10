import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, isSameDay, parseISO, eachDayOfInterval } from 'date-fns';
import type { CalendarEvent } from '@/hooks/useEvents';
import { getTeamColorClass } from '@/components/calendar/TeamColorLegend';

interface EventsWeekViewProps {
  events: CalendarEvent[] | undefined;
  isLoading: boolean;
  weekDays: Date[];
  ministryColorMap?: Record<string, string>;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 7); // 7 AM – 6 PM

export default function EventsWeekView({ events, isLoading, weekDays, ministryColorMap }: EventsWeekViewProps) {
  const navigate = useNavigate();
  const { getLocalizedField } = useLanguage();

  // Separate all-day vs timed events per day
  const eventsByDay = useMemo(() => {
    const map: Record<string, { allDay: CalendarEvent[]; timed: CalendarEvent[] }> = {};
    weekDays.forEach((day) => {
      const key = format(day, 'yyyy-MM-dd');
      map[key] = { allDay: [], timed: [] };
    });
    events?.forEach((event) => {
      const bucket = map[event.date];
      if (!bucket) return;
      if (event.is_all_day || !event.start_time) {
        bucket.allDay.push(event);
      } else {
        bucket.timed.push(event);
      }
    });
    return map;
  }, [events, weekDays]);

  if (isLoading) {
    return <Skeleton className="h-[600px]" />;
  }

  return (
    <Card>
      <CardContent className="p-0 overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Header row */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b">
            <div className="p-2" />
            {weekDays.map((day) => {
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={day.toISOString()}
                  className={`p-2 text-center border-l ${isToday ? 'bg-primary/10' : ''}`}
                >
                  <div className="text-xs text-muted-foreground">{format(day, 'EEE')}</div>
                  <div className={`text-sm font-semibold ${isToday ? 'text-primary' : ''}`}>
                    {format(day, 'd')}
                  </div>
                </div>
              );
            })}
          </div>

          {/* All-day row */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b bg-muted/20">
            <div className="p-1 text-[10px] text-muted-foreground flex items-center justify-center">
              All day
            </div>
            {weekDays.map((day) => {
              const key = format(day, 'yyyy-MM-dd');
              const allDay = eventsByDay[key]?.allDay || [];
              return (
                <div key={key} className="p-1 border-l min-h-[32px] space-y-0.5">
                  {allDay.map((event) => (
                    <TooltipProvider key={event.id} delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={`text-[10px] px-1 py-0.5 rounded truncate cursor-pointer text-white ${
                            getTeamColorClass(event.language)
                            }`}
                            onClick={() => navigate(`/calendar/events/${event.id}`)}
                          >
                            {getLocalizedField(event, 'title')}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{getLocalizedField(event, 'title')}</p>
                          {event.ministry && (
                            <p className="text-xs text-muted-foreground">{getLocalizedField(event.ministry, 'name')}</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Hourly grid */}
          {HOURS.map((hour) => (
            <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b">
              <div className="p-1 text-[10px] text-muted-foreground text-right pr-2 pt-0">
                {format(new Date(2000, 0, 1, hour), 'h a')}
              </div>
              {weekDays.map((day) => {
                const key = format(day, 'yyyy-MM-dd');
                const timed = eventsByDay[key]?.timed || [];
                const hourEvents = timed.filter((e) => {
                  if (!e.start_time) return false;
                  const startHour = parseInt(e.start_time.split(':')[0], 10);
                  return startHour === hour;
                });
                const isToday = isSameDay(day, new Date());

                return (
                  <div
                    key={key}
                    className={`border-l min-h-[48px] p-0.5 relative cursor-pointer hover:bg-accent/30 transition-colors ${isToday ? 'bg-primary/5' : ''}`}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('[data-event]')) return;
                      navigate(`/calendar/events/new?date=${key}`);
                    }}
                  >
                    {hourEvents.map((event) => (
                      <TooltipProvider key={event.id} delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              data-event
                              className={`text-[10px] px-1 py-0.5 rounded truncate cursor-pointer text-white mb-0.5 ${
                                getTeamColorClass(event.language)
                              }`}
                              onClick={() => navigate(`/calendar/events/${event.id}`)}
                            >
                              {event.start_time?.slice(0, 5)} {getLocalizedField(event, 'title')}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium">{getLocalizedField(event, 'title')}</p>
                            {event.ministry && (
                              <p className="text-xs text-muted-foreground">{getLocalizedField(event.ministry, 'name')}</p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
