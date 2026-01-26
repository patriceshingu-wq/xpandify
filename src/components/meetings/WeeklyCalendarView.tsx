import { useState, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks, setHours, setMinutes } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import { Meeting, useUpdateMeeting } from '@/hooks/useMeetings';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface WeeklyCalendarViewProps {
  meetings: Meeting[];
  onMeetingClick: (meetingId: string) => void;
  onMeetingEdit: (meeting: Meeting) => void;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 7); // 7 AM to 6 PM
const HOUR_HEIGHT = 60; // pixels per hour

interface DraggableMeetingProps {
  meeting: Meeting;
  onClick: () => void;
  getLocalizedField: (obj: any, field: string) => string;
  getMeetingTypeColor: (type: string) => string;
}

function DraggableMeeting({ meeting, onClick, getLocalizedField, getMeetingTypeColor }: DraggableMeetingProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: meeting.id,
    data: { meeting },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const meetingTime = new Date(meeting.date_time);
  const startHour = meetingTime.getHours() + meetingTime.getMinutes() / 60;
  const durationHours = (meeting.duration_minutes || 60) / 60;
  const top = (startHour - 7) * HOUR_HEIGHT;
  const height = Math.max(durationHours * HOUR_HEIGHT - 4, 30);

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        position: 'absolute',
        top: `${top}px`,
        height: `${height}px`,
        left: '4px',
        right: '4px',
        zIndex: isDragging ? 50 : 10,
      }}
      className={cn(
        'rounded-md border p-1 cursor-grab active:cursor-grabbing transition-shadow',
        'bg-card hover:shadow-md',
        getMeetingTypeColor(meeting.meeting_type || 'other')
      )}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-start gap-1 h-full overflow-hidden" onClick={(e) => { e.stopPropagation(); onClick(); }}>
        <GripVertical className="h-3 w-3 shrink-0 mt-0.5 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium truncate leading-tight">
            {getLocalizedField(meeting, 'title')}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {format(meetingTime, 'h:mm a')}
          </p>
        </div>
      </div>
    </div>
  );
}

interface DroppableSlotProps {
  date: Date;
  hour: number;
  children?: React.ReactNode;
}

function DroppableSlot({ date, hour, children }: DroppableSlotProps) {
  const slotId = `${format(date, 'yyyy-MM-dd')}-${hour}`;
  const { setNodeRef, isOver } = useDroppable({
    id: slotId,
    data: { date, hour },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'border-b border-r border-border/50 relative',
        isOver && 'bg-accent/30'
      )}
      style={{ height: `${HOUR_HEIGHT}px` }}
    >
      {children}
    </div>
  );
}

export function WeeklyCalendarView({ meetings, onMeetingClick, onMeetingEdit }: WeeklyCalendarViewProps) {
  const { t, getLocalizedField } = useLanguage();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const updateMeeting = useUpdateMeeting();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  const meetingsByDay = useMemo(() => {
    const map: Record<string, Meeting[]> = {};
    weekDays.forEach((day) => {
      const key = format(day, 'yyyy-MM-dd');
      map[key] = meetings?.filter((m) => isSameDay(new Date(m.date_time), day)) || [];
    });
    return map;
  }, [meetings, weekDays]);

  const getMeetingTypeColor = (type: string) => {
    switch (type) {
      case 'one_on_one':
        return 'border-l-4 border-l-accent bg-accent/5';
      case 'team':
        return 'border-l-4 border-l-info bg-info/5';
      case 'ministry':
        return 'border-l-4 border-l-success bg-success/5';
      case 'board':
        return 'border-l-4 border-l-destructive bg-destructive/5';
      default:
        return 'border-l-4 border-l-muted bg-muted/5';
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const meeting = event.active.data.current?.meeting as Meeting;
    setActiveMeeting(meeting);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveMeeting(null);
    
    const { active, over } = event;
    if (!over || !active.data.current?.meeting) return;

    const meeting = active.data.current.meeting as Meeting;
    const dropData = over.data.current as { date: Date; hour: number } | undefined;
    
    if (!dropData) return;

    const { date, hour } = dropData;
    const originalTime = new Date(meeting.date_time);
    const newDateTime = setMinutes(setHours(date, hour), originalTime.getMinutes());

    // Don't update if dropped in the same slot
    if (newDateTime.getTime() === originalTime.getTime()) return;

    updateMeeting.mutate({
      id: meeting.id,
      date_time: newDateTime.toISOString(),
    });
  };

  const goToPreviousWeek = () => setCurrentWeekStart((prev) => subWeeks(prev, 1));
  const goToNextWeek = () => setCurrentWeekStart((prev) => addWeeks(prev, 1));
  const goToToday = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header Navigation */}
        <div className="flex flex-col gap-3 p-3 md:p-4 border-b bg-muted/30">
          {/* Top row: Navigation and Date Range */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 md:gap-2 shrink-0">
              <Button variant="outline" size="icon" className="h-8 w-8 md:h-9 md:w-9" onClick={goToPreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8 md:h-9 md:w-9" onClick={goToNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 md:h-9 text-xs md:text-sm" onClick={goToToday}>
                Today
              </Button>
            </div>
            <h3 className="font-semibold text-sm md:text-lg text-right">
              <span className="hidden sm:inline">
                {format(currentWeekStart, 'MMMM d')} - {format(addDays(currentWeekStart, 6), 'MMMM d, yyyy')}
              </span>
              <span className="sm:hidden">
                {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d')}
              </span>
            </h3>
          </div>
          
          {/* Bottom row: Legend */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Badge variant="outline" className="border-l-4 border-l-accent text-xs">1:1</Badge>
            <Badge variant="outline" className="border-l-4 border-l-info text-xs">Team</Badge>
            <Badge variant="outline" className="border-l-4 border-l-success text-xs">Ministry</Badge>
            <Badge variant="outline" className="border-l-4 border-l-destructive text-xs">Board</Badge>
          </div>
        </div>

        {/* Calendar Grid */}
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex">
            {/* Time Column */}
            <div className="w-16 shrink-0 border-r bg-muted/20">
              <div className="h-12 border-b" /> {/* Spacer for day headers */}
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="text-xs text-muted-foreground text-right pr-2 pt-1"
                  style={{ height: `${HOUR_HEIGHT}px` }}
                >
                  {format(setHours(new Date(), hour), 'h a')}
                </div>
              ))}
            </div>

            {/* Days Columns */}
            <ScrollArea className="flex-1">
              <div className="flex min-w-[700px]">
                {weekDays.map((day) => {
                  const dayKey = format(day, 'yyyy-MM-dd');
                  const dayMeetings = meetingsByDay[dayKey] || [];
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div key={dayKey} className="flex-1 min-w-[100px]">
                      {/* Day Header */}
                      <div
                        className={cn(
                          'h-12 border-b border-r p-2 text-center',
                          isToday && 'bg-primary/10'
                        )}
                      >
                        <p className="text-xs text-muted-foreground">{format(day, 'EEE')}</p>
                        <p className={cn('text-sm font-medium', isToday && 'text-primary')}>
                          {format(day, 'd')}
                        </p>
                      </div>

                      {/* Hour Slots */}
                      <div className="relative">
                        {HOURS.map((hour) => (
                          <DroppableSlot key={`${dayKey}-${hour}`} date={day} hour={hour}>
                            {/* Meetings are rendered inside the first slot of each day */}
                          </DroppableSlot>
                        ))}
                        
                        {/* Render meetings positioned absolutely */}
                        {dayMeetings.map((meeting) => (
                          <DraggableMeeting
                            key={meeting.id}
                            meeting={meeting}
                            onClick={() => onMeetingClick(meeting.id)}
                            getLocalizedField={getLocalizedField}
                            getMeetingTypeColor={getMeetingTypeColor}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeMeeting && (
              <div
                className={cn(
                  'rounded-md border p-2 shadow-lg bg-card',
                  getMeetingTypeColor(activeMeeting.meeting_type || 'other')
                )}
                style={{ width: '150px' }}
              >
                <p className="text-xs font-medium truncate">
                  {getLocalizedField(activeMeeting, 'title')}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {format(new Date(activeMeeting.date_time), 'h:mm a')}
                </p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </CardContent>
    </Card>
  );
}
