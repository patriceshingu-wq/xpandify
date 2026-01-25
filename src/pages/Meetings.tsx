import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMeetings, Meeting } from '@/hooks/useMeetings';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar, CalendarDays, Clock, User, Users, Eye, List } from 'lucide-react';
import { MeetingFormDialog } from '@/components/meetings/MeetingFormDialog';
import { MeetingDetailDialog } from '@/components/meetings/MeetingDetailDialog';
import { WeeklyCalendarView } from '@/components/meetings/WeeklyCalendarView';
import { format } from 'date-fns';

export default function Meetings() {
  const { t, getLocalizedField } = useLanguage();
  const [meetingType, setMeetingType] = useState('all');
  const [showUpcoming, setShowUpcoming] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [viewingMeetingId, setViewingMeetingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // For calendar view, we need all meetings (not just upcoming)
  const { data: meetings, isLoading } = useMeetings({
    meeting_type: meetingType,
    upcoming: viewMode === 'list' ? showUpcoming : false,
  });

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
        return 'bg-accent/10 text-accent';
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
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title={t('meetings.title')}
          subtitle={t('meetings.subtitle')}
          actions={
            <Button onClick={() => setIsFormOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              {t('meetings.addMeeting')}
            </Button>
          }
        />

        {/* Filters and View Toggle */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Select value={meetingType} onValueChange={setMeetingType}>
                  <SelectTrigger className="w-full sm:w-40">
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
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="all">All Meetings</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'calendar')}>
                <TabsList>
                  <TabsTrigger value="list" className="gap-2">
                    <List className="h-4 w-4" />
                    List
                  </TabsTrigger>
                  <TabsTrigger value="calendar" className="gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Calendar
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Meetings Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner" />
          </div>
        ) : viewMode === 'calendar' ? (
          <WeeklyCalendarView
            meetings={meetings || []}
            onMeetingClick={handleView}
            onMeetingEdit={handleEdit}
          />
        ) : Object.keys(groupedMeetings).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedMeetings).map(([date, dateMeetings]) => (
              <div key={date}>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                </h3>
                <div className="space-y-3">
                  {dateMeetings.map((meeting) => (
                    <Card
                      key={meeting.id}
                      className="transition-all hover:shadow-md"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div 
                            className="flex items-start gap-4 flex-1 cursor-pointer"
                            onClick={() => handleView(meeting.id)}
                          >
                            <div className="text-center min-w-[50px]">
                              <div className="text-lg font-bold text-foreground">
                                {format(new Date(meeting.date_time), 'HH:mm')}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {meeting.duration_minutes} min
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={getMeetingTypeColor(meeting.meeting_type)}>
                                  {getMeetingTypeLabel(meeting.meeting_type)}
                                </Badge>
                              </div>
                              <h4 className="font-medium text-foreground">
                                {getLocalizedField(meeting, 'title')}
                              </h4>
                              {meeting.organizer && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                  <User className="h-3.5 w-3.5" />
                                  {meeting.organizer.first_name} {meeting.organizer.last_name}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleView(meeting.id)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(meeting)}>
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
