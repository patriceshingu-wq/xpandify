import { useState, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Meeting } from '@/hooks/useMeetings';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface MonthlyCalendarViewProps {
  meetings: Meeting[];
  onMeetingClick: (meetingId: string) => void;
  onDayClick?: (date: Date) => void;
}

export function MonthlyCalendarView({ meetings, onMeetingClick, onDayClick }: MonthlyCalendarViewProps) {
  const { getLocalizedField } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days: Date[] = [];
    let day = calendarStart;
    while (day <= calendarEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  const meetingsByDay = useMemo(() => {
    const map: Record<string, Meeting[]> = {};
    meetings?.forEach((meeting) => {
      const key = format(new Date(meeting.date_time), 'yyyy-MM-dd');
      if (!map[key]) map[key] = [];
      map[key].push(meeting);
    });
    return map;
  }, [meetings]);

  const getMeetingTypeColor = (type: string) => {
    switch (type) {
      case 'one_on_one':
        return 'bg-accent text-accent-foreground';
      case 'team':
        return 'bg-info text-info-foreground';
      case 'ministry':
        return 'bg-success text-success-foreground';
      case 'board':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const goToPreviousMonth = () => setCurrentMonth((prev) => subMonths(prev, 1));
  const goToNextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header Navigation */}
        <div className="flex flex-col gap-3 p-3 md:p-4 border-b bg-muted/30">
          {/* Top row: Navigation and Month */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 md:gap-2 shrink-0">
              <Button variant="outline" size="icon" className="h-8 w-8 md:h-9 md:w-9" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8 md:h-9 md:w-9" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 md:h-9 text-xs md:text-sm" onClick={goToToday}>
                Today
              </Button>
            </div>
            <h3 className="font-semibold text-sm md:text-lg">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
          </div>
          
          {/* Bottom row: Legend */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Badge variant="outline" className="bg-accent/20 text-accent text-xs">1:1</Badge>
            <Badge variant="outline" className="bg-info/20 text-info text-xs">Team</Badge>
            <Badge variant="outline" className="bg-success/20 text-success text-xs">Ministry</Badge>
            <Badge variant="outline" className="bg-destructive/20 text-destructive text-xs">Board</Badge>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {/* Week day headers */}
          {weekDays.map((day) => (
            <div
              key={day}
              className="p-2 text-center text-sm font-medium text-muted-foreground border-b bg-muted/20"
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((day) => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const dayMeetings = meetingsByDay[dayKey] || [];
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={dayKey}
                className={cn(
                  'min-h-[100px] border-b border-r p-1 transition-colors',
                  !isCurrentMonth && 'bg-muted/30',
                  isToday && 'bg-primary/5',
                  onDayClick && 'cursor-pointer hover:bg-accent/10'
                )}
                onClick={() => onDayClick?.(day)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={cn(
                      'text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full',
                      !isCurrentMonth && 'text-muted-foreground',
                      isToday && 'bg-primary text-primary-foreground'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayMeetings.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{dayMeetings.length - 3} more
                    </span>
                  )}
                </div>
                <ScrollArea className="h-[70px]">
                  <div className="space-y-0.5">
                    {dayMeetings.slice(0, 3).map((meeting) => (
                      <div
                        key={meeting.id}
                        className={cn(
                          'text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80',
                          getMeetingTypeColor(meeting.meeting_type || 'other')
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          onMeetingClick(meeting.id);
                        }}
                        title={`${format(new Date(meeting.date_time), 'h:mm a')} - ${getLocalizedField(meeting, 'title')}`}
                      >
                        <span className="font-medium">
                          {format(new Date(meeting.date_time), 'h:mm')}
                        </span>{' '}
                        {getLocalizedField(meeting, 'title')}
                      </div>
                    ))}
                    {dayMeetings.length > 3 && (
                      <div className="text-xs text-muted-foreground px-1.5 py-0.5">
                        {dayMeetings.slice(3).map((meeting) => (
                          <div
                            key={meeting.id}
                            className="truncate cursor-pointer hover:text-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              onMeetingClick(meeting.id);
                            }}
                          >
                            {format(new Date(meeting.date_time), 'h:mm a')} - {getLocalizedField(meeting, 'title')}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
