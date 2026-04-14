import { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMeetings, Meeting } from '@/hooks/useMeetings';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { MeetingCardSkeleton, ListSkeleton } from '@/components/ui/mobile-skeletons';
import { Plus, Calendar, CalendarDays, CalendarRange, User, Eye, List } from 'lucide-react';
import { MeetingFormDialog } from '@/components/meetings/MeetingFormDialog';
import { MeetingDetailDialog } from '@/components/meetings/MeetingDetailDialog';
import { WeeklyCalendarView } from '@/components/meetings/WeeklyCalendarView';
import { MonthlyCalendarView } from '@/components/meetings/MonthlyCalendarView';
import { useIsMobile } from '@/hooks/use-mobile';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';

export default function Meetings() {
  const { t, getLocalizedField } = useLanguage();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [meetingType, setMeetingType] = useState('all');
  const [showUpcoming, setShowUpcoming] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [viewingMeetingId, setViewingMeetingId] = useState<string | null>(null);
  // Default to list view on mobile
  const [viewMode, setViewMode] = useState<'list' | 'week' | 'month'>('list');

  // For calendar view, we need all meetings (not just upcoming)
  const { data: meetings, isLoading } = useMeetings({
    meeting_type: meetingType,
    upcoming: viewMode === 'list' ? showUpcoming : false,
  });

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['meetings'] });
  }, [queryClient]);

  const handleEdit = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    setIsFormOpen(true);
  };

  const handleView = (meetingId: string) => {
    setViewingMeetingId(meetingId);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingMeeting(null);
  };

  const getMeetingTypeColor = (type: string) => {
    switch (type) {
      case 'one_on_one':
        return 'bg-muted text-muted-foreground';
      case 'team':
        return 'bg-info/10 text-info';
      case 'ministry':
        return 'bg-success/10 text-success';
      case 'board':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getMeetingTypeLabel = (type: string) => {
    switch (type) {
      case 'one_on_one':
        return t('meetings.oneOnOne');
      case 'team':
        return t('meetings.team');
      case 'ministry':
        return t('nav.ministries');
      case 'board':
        return t('meetings.board');
      default:
        return type;
    }
  };

  // Group meetings by date
  const groupedMeetings = meetings?.reduce((acc, meeting) => {
    const date = format(new Date(meeting.date_time), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(meeting);
    return acc;
  }, {} as Record<string, Meeting[]>) || {};

  return (
    <MainLayout title={t('meetings.title')} subtitle={t('meetings.subtitle')}>
      <div className="space-y-4 md:space-y-6 animate-fade-in">
        <PageHeader
          title={t('meetings.title')}
          subtitle={t('meetings.subtitle')}
          actions={
            <Button onClick={() => setIsFormOpen(true)} className="gap-2 touch-target">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">{t('meetings.addMeeting')}</span>
              <span className="sm:hidden">Add</span>
            </Button>
          }
        />

        {/* Filters and View Toggle - Stacked on mobile */}
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex flex-col gap-3 md:gap-4">
              {/* View Toggle - First on mobile for easy thumb access */}
              <div className="md:hidden">
                <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as 'list' | 'week' | 'month')} className="grid w-full grid-cols-3 gap-1 bg-muted p-1 rounded-md">
                  <ToggleGroupItem value="list" className="gap-1.5 touch-target text-sm data-[state=on]:bg-background data-[state=on]:shadow-sm">
                    <List className="h-4 w-4 shrink-0" />
                    <span>List</span>
                  </ToggleGroupItem>
                  <ToggleGroupItem value="week" className="gap-1.5 touch-target text-sm data-[state=on]:bg-background data-[state=on]:shadow-sm">
                    <CalendarDays className="h-4 w-4 shrink-0" />
                    <span>Week</span>
                  </ToggleGroupItem>
                  <ToggleGroupItem value="month" className="gap-1.5 touch-target text-sm data-[state=on]:bg-background data-[state=on]:shadow-sm">
                    <CalendarRange className="h-4 w-4 shrink-0" />
                    <span>Month</span>
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
              
              {/* Filters Row */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex flex-row gap-2 flex-1">
                  <Select value={meetingType} onValueChange={setMeetingType}>
                    <SelectTrigger className="flex-1 sm:w-36 touch-target" aria-label={t('common.filterByType')}>
                      <SelectValue placeholder={t('common.type')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('common.all')}</SelectItem>
                      <SelectItem value="one_on_one">{t('meetings.oneOnOne')}</SelectItem>
                      <SelectItem value="team">{t('meetings.team')}</SelectItem>
                      <SelectItem value="ministry">{t('nav.ministries')}</SelectItem>
                      <SelectItem value="board">{t('meetings.board')}</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {viewMode === 'list' && (
                    <Select value={showUpcoming ? 'upcoming' : 'all'} onValueChange={(v) => setShowUpcoming(v === 'upcoming')}>
                      <SelectTrigger className="flex-1 sm:w-36 touch-target" aria-label={t('meetings.filterByTime')}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        <SelectItem value="all">All Meetings</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                
                {/* Desktop view toggle */}
                <div className="hidden md:block">
                  <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as 'list' | 'week' | 'month')} className="bg-muted p-1 rounded-md">
                    <ToggleGroupItem value="list" className="gap-2 data-[state=on]:bg-background data-[state=on]:shadow-sm">
                      <List className="h-4 w-4" />
                      List
                    </ToggleGroupItem>
                    <ToggleGroupItem value="week" className="gap-2 data-[state=on]:bg-background data-[state=on]:shadow-sm">
                      <CalendarDays className="h-4 w-4" />
                      Week
                    </ToggleGroupItem>
                    <ToggleGroupItem value="month" className="gap-2 data-[state=on]:bg-background data-[state=on]:shadow-sm">
                      <CalendarRange className="h-4 w-4" />
                      Month
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meetings Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner" />
          </div>
        ) : viewMode === 'week' ? (
          <WeeklyCalendarView
            meetings={meetings || []}
            onMeetingClick={handleView}
            onMeetingEdit={handleEdit}
          />
        ) : viewMode === 'month' ? (
          <MonthlyCalendarView
            meetings={meetings || []}
            onMeetingClick={handleView}
          />
        ) : Object.keys(groupedMeetings).length > 0 ? (
          <div className="space-y-4 md:space-y-6">
            {Object.entries(groupedMeetings).map(([date, dateMeetings]) => (
              <div key={date}>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2 sticky top-0 bg-background py-2 z-10">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(date), isMobile ? 'EEE, MMM d' : 'EEEE, MMMM d, yyyy')}
                </h3>
                <div className="space-y-2 md:space-y-3">
                  {dateMeetings.map((meeting) => (
                    <Card
                      key={meeting.id}
                      className="transition-all hover:shadow-md active:scale-[0.99]"
                      onClick={() => handleView(meeting.id)}
                    >
                      <CardContent className="p-3 md:p-4">
                        <div className="flex items-start gap-3 md:gap-4">
                          {/* Time block */}
                          <div className="text-center min-w-[48px] md:min-w-[50px]">
                            <div className="text-base md:text-lg font-bold text-foreground">
                              {format(new Date(meeting.date_time), 'HH:mm')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {meeting.duration_minutes}m
                            </div>
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Badge className={`${getMeetingTypeColor(meeting.meeting_type)} text-xs`}>
                                {getMeetingTypeLabel(meeting.meeting_type)}
                              </Badge>
                            </div>
                            <h4 className="font-medium text-foreground text-sm md:text-base truncate">
                              {getLocalizedField(meeting, 'title')}
                            </h4>
                            {meeting.organizer && (
                              <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                                <User className="h-3 w-3 md:h-3.5 md:w-3.5" />
                                <span className="truncate">
                                  {meeting.organizer.first_name} {meeting.organizer.last_name}
                                </span>
                              </p>
                            )}
                          </div>
                          
                          {/* Desktop actions */}
                          <div className="hidden md:flex gap-2 shrink-0">
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleView(meeting.id); }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(meeting); }}>
                              Edit
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Calendar className="h-16 w-16" />}
            title={t('common.noResults')}
            description="No meetings found"
            action={{
              label: t('meetings.addMeeting'),
              onClick: () => setIsFormOpen(true),
            }}
          />
        )}
      </div>

      <MeetingFormDialog
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        meeting={editingMeeting}
      />

      <MeetingDetailDialog
        open={!!viewingMeetingId}
        onOpenChange={(open) => !open && setViewingMeetingId(null)}
        meetingId={viewingMeetingId}
      />
    </MainLayout>
  );
}
