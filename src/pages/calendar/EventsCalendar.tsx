import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvents, type EventFilters, type EventStatus } from '@/hooks/useEvents';
import { useMinistries } from '@/hooks/useMinistries';
import { usePrograms } from '@/hooks/usePrograms';
import { useActivityCategories } from '@/hooks/useActivityCategories';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks, addYears, subYears, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { getStatusBadgeVariant } from '@/components/calendar/EventStatusBadge';
import EventsListView from '@/components/calendar/EventsListView';
import EventsWeekView from '@/components/calendar/EventsWeekView';
import TeamColorLegend, { getTeamColorClass } from '@/components/calendar/TeamColorLegend';

// Ministry color palette for calendar
const ministryColors = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
  'bg-pink-500', 'bg-teal-500', 'bg-yellow-500', 'bg-red-500',
  'bg-indigo-500', 'bg-cyan-500'
];

type ViewMode = 'list' | 'week' | 'month';

export default function EventsCalendarPage() {
  const navigate = useNavigate();
  const { getLocalizedField, t } = useLanguage();
  const { isAdminOrSuper } = useAuth();
  const { data: ministries } = useMinistries();
  const { data: programs } = usePrograms();
  const { data: categories } = useActivityCategories();

  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filters, setFilters] = useState<EventFilters>({});

  // Date range calculations based on view mode
  const { rangeStart, rangeEnd, calendarDays, weekDays } = useMemo(() => {
    if (viewMode === 'list') {
      const ys = startOfYear(currentDate);
      const ye = endOfYear(currentDate);
      return { rangeStart: ys, rangeEnd: ye, calendarDays: [], weekDays: [] };
    }
    if (viewMode === 'week') {
      const ws = startOfWeek(currentDate);
      const we = endOfWeek(currentDate);
      return {
        rangeStart: ws,
        rangeEnd: we,
        calendarDays: eachDayOfInterval({ start: ws, end: we }),
        weekDays: eachDayOfInterval({ start: ws, end: we }),
      };
    }
    // month
    const ms = startOfMonth(currentDate);
    const me = endOfMonth(currentDate);
    const cs = startOfWeek(ms);
    const ce = endOfWeek(me);
    return {
      rangeStart: cs,
      rangeEnd: ce,
      calendarDays: eachDayOfInterval({ start: cs, end: ce }),
      weekDays: [],
    };
  }, [viewMode, currentDate]);

  const { data: events, isLoading } = useEvents({
    ...filters,
    start_date: format(rangeStart, 'yyyy-MM-dd'),
    end_date: format(rangeEnd, 'yyyy-MM-dd'),
  });

  // Create color map for ministries
  const ministryColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    ministries?.forEach((m, i) => {
      map[m.id] = ministryColors[i % ministryColors.length];
    });
    return map;
  }, [ministries]);

  // Group events by date (for month view)
  const eventsByDate = useMemo(() => {
    const map: Record<string, typeof events> = {};
    events?.forEach((event) => {
      if (!map[event.date]) map[event.date] = [];
      map[event.date]!.push(event);
    });
    return map;
  }, [events]);

  const handlePrev = () => {
    if (viewMode === 'list') setCurrentDate(subYears(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNext = () => {
    if (viewMode === 'list') setCurrentDate(addYears(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => setCurrentDate(new Date());

  const handleFilterChange = (key: keyof EventFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
    }));
  };

  const headerLabel = viewMode === 'list'
    ? format(currentDate, 'yyyy')
    : viewMode === 'week'
      ? `${format(startOfWeek(currentDate), 'MMM d')} – ${format(endOfWeek(currentDate), 'MMM d, yyyy')}`
      : format(currentDate, 'MMMM yyyy');

  return (
    <MainLayout>
      <div className="space-y-4">
        <PageHeader
          title={t('calendar.eventsCalendar') || 'Events Calendar'}
          subtitle={t('calendar.eventsCalendarDescription') || 'View and manage all events'}
          actions={
            isAdminOrSuper && (
              <Button onClick={() => navigate('/calendar/events/new')}>
                <Plus className="h-4 w-4 mr-2" />
                {t('calendar.addEvent') || 'Add Event'}
              </Button>
            )
          }
        />

        {/* View Toggle + Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="w-auto">
            <TabsList>
              <TabsTrigger value="list">List</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-wrap gap-2 flex-1">
            <Select value={filters.ministry_id || 'all'} onValueChange={(v) => handleFilterChange('ministry_id', v)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Ministries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('calendar.allMinistries') || 'All Ministries'}</SelectItem>
                {ministries?.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{getLocalizedField(m, 'name')}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.status || 'all'} onValueChange={(v) => handleFilterChange('status', v)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('calendar.allStatus') || 'All'}</SelectItem>
                <SelectItem value="Planned">Planned</SelectItem>
                <SelectItem value="Confirmed">Confirmed</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Canceled">Canceled</SelectItem>
                <SelectItem value="Postponed">Postponed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.language || 'all'} onValueChange={(v) => handleFilterChange('language', v)}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="EN">EN</SelectItem>
                <SelectItem value="FR">FR</SelectItem>
                <SelectItem value="Bilingual">Bilingual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday}>
              {t('calendar.today') || 'Today'}
            </Button>
          </div>
          <h2 className="text-lg font-semibold">{headerLabel}</h2>
          <div className="w-24" />
        </div>

        {/* Views */}
        {viewMode === 'list' && (
          <EventsListView events={events} isLoading={isLoading} />
        )}

        {viewMode === 'week' && (
          <EventsWeekView
            events={events}
            isLoading={isLoading}
            weekDays={weekDays}
            ministryColorMap={ministryColorMap}
          />
        )}

        {viewMode === 'month' && (
          <>
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <Skeleton className="h-[600px]" />
                ) : (
                  <div className="grid grid-cols-7">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground border-b">
                        {day}
                      </div>
                    ))}
                    {calendarDays.map((day) => {
                      const dateKey = format(day, 'yyyy-MM-dd');
                      const dayEvents = eventsByDate[dateKey] || [];
                      const isToday = isSameDay(day, new Date());
                      const isCurrentMonth = isSameMonth(day, currentDate);

                      return (
                        <div
                          key={dateKey}
                          className={`min-h-[100px] border-b border-r p-1 cursor-pointer hover:bg-accent/30 transition-colors ${!isCurrentMonth ? 'bg-muted/30' : ''}`}
                          onClick={(e) => {
                            if ((e.target as HTMLElement).closest('[data-event]')) return;
                            navigate(`/calendar/events/new?date=${dateKey}`);
                          }}
                        >
                          <div
                            className={`text-sm font-medium p-1 w-7 h-7 flex items-center justify-center rounded-full ${
                              isToday ? 'bg-primary text-primary-foreground' : ''
                            } ${!isCurrentMonth ? 'text-muted-foreground' : ''}`}
                          >
                            {format(day, 'd')}
                          </div>
                          <div className="space-y-1 mt-1">
                            {dayEvents.slice(0, 3).map((event) => (
                              <TooltipProvider key={event.id} delayDuration={200}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      data-event
                                      className={`text-xs p-1 rounded cursor-pointer truncate ${
                                        getTeamColorClass(event.language)
                                      } text-white`}
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
                            {dayEvents.length > 3 && (
                              <div className="text-xs text-muted-foreground px-1">
                                +{dayEvents.length - 3} more
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <TeamColorLegend />
          </>
        )}
      </div>
    </MainLayout>
  );
}
