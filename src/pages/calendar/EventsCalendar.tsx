import { useState, useMemo } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { getStatusBadgeVariant } from '@/components/calendar/EventStatusBadge';
import type { ProgramLanguage } from '@/hooks/usePrograms';

// Ministry color palette for calendar
const ministryColors = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
  'bg-pink-500', 'bg-teal-500', 'bg-yellow-500', 'bg-red-500',
  'bg-indigo-500', 'bg-cyan-500'
];

export default function EventsCalendarPage() {
  const navigate = useNavigate();
  const { getLocalizedField, t } = useLanguage();
  const { isAdminOrSuper } = useAuth();
  const { data: ministries } = useMinistries();
  const { data: programs } = usePrograms();
  const { data: categories } = useActivityCategories();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filters, setFilters] = useState<EventFilters>({});

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const { data: events, isLoading } = useEvents({
    ...filters,
    start_date: format(calendarStart, 'yyyy-MM-dd'),
    end_date: format(calendarEnd, 'yyyy-MM-dd'),
  });

  // Create color map for ministries
  const ministryColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    ministries?.forEach((m, i) => {
      map[m.id] = ministryColors[i % ministryColors.length];
    });
    return map;
  }, [ministries]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map: Record<string, typeof events> = {};
    events?.forEach((event) => {
      if (!map[event.date]) map[event.date] = [];
      map[event.date]!.push(event);
    });
    return map;
  }, [events]);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => setCurrentMonth(new Date());

  const handleFilterChange = (key: keyof EventFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
    }));
  };

  return (
    <MainLayout>
      <div className="space-y-6">
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

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Select
            value={filters.ministry_id || 'all'}
            onValueChange={(v) => handleFilterChange('ministry_id', v)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t('calendar.allMinistries') || 'All Ministries'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('calendar.allMinistries') || 'All Ministries'}</SelectItem>
              {ministries?.map((m) => (
                <SelectItem key={m.id} value={m.id}>{getLocalizedField(m, 'name')}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.program_id || 'all'}
            onValueChange={(v) => handleFilterChange('program_id', v)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t('calendar.allPrograms') || 'All Programs'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('calendar.allPrograms') || 'All Programs'}</SelectItem>
              {programs?.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.code} - {getLocalizedField(p, 'name')}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.activity_category_id || 'all'}
            onValueChange={(v) => handleFilterChange('activity_category_id', v)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t('calendar.allCategories') || 'All Categories'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('calendar.allCategories') || 'All Categories'}</SelectItem>
              {categories?.map((c) => (
                <SelectItem key={c.id} value={c.id}>{getLocalizedField(c, 'name')}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.language || 'all'}
            onValueChange={(v) => handleFilterChange('language', v)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder={t('calendar.allLanguages') || 'All Languages'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('calendar.allLanguages') || 'All'}</SelectItem>
              <SelectItem value="EN">English</SelectItem>
              <SelectItem value="FR">Français</SelectItem>
              <SelectItem value="Bilingual">Bilingual</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.status || 'all'}
            onValueChange={(v) => handleFilterChange('status', v)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder={t('calendar.allStatus') || 'All Status'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('calendar.allStatus') || 'All'}</SelectItem>
              <SelectItem value="Planned">{t('calendar.planned') || 'Planned'}</SelectItem>
              <SelectItem value="Confirmed">{t('calendar.confirmed') || 'Confirmed'}</SelectItem>
              <SelectItem value="Completed">{t('calendar.completed') || 'Completed'}</SelectItem>
              <SelectItem value="Canceled">{t('calendar.canceled') || 'Canceled'}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Calendar Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday}>
              {t('calendar.today') || 'Today'}
            </Button>
          </div>
          <h2 className="text-xl font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className="w-32" /> {/* Spacer for balance */}
        </div>

        {/* Calendar Grid */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <Skeleton className="h-[600px]" />
            ) : (
              <div className="grid grid-cols-7">
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground border-b">
                    {day}
                  </div>
                ))}

                {/* Calendar days */}
                {calendarDays.map((day) => {
                  const dateKey = format(day, 'yyyy-MM-dd');
                  const dayEvents = eventsByDate[dateKey] || [];
                  const isToday = isSameDay(day, new Date());
                  const isCurrentMonth = isSameMonth(day, currentMonth);

                  return (
                    <div
                      key={dateKey}
                      className={`min-h-[100px] border-b border-r p-1 ${
                        !isCurrentMonth ? 'bg-muted/30' : ''
                      }`}
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
                          <div
                            key={event.id}
                            className={`text-xs p-1 rounded cursor-pointer truncate ${
                              event.ministry_id ? ministryColorMap[event.ministry_id] : 'bg-gray-500'
                            } text-white`}
                            onClick={() => navigate(`/calendar/events/${event.id}`)}
                            title={getLocalizedField(event, 'title')}
                          >
                            {getLocalizedField(event, 'title')}
                          </div>
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

        {/* Ministry Color Legend */}
        {ministries && ministries.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {ministries.map((m) => (
              <div key={m.id} className="flex items-center gap-2 text-sm">
                <div className={`w-3 h-3 rounded ${ministryColorMap[m.id]}`} />
                <span>{getLocalizedField(m, 'name')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
