import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamMembersWithDetails, TeamMemberStats } from '@/hooks/useTeamMembers';
import { useMeetingTemplates } from '@/hooks/useMeetingTemplates';
import { useCreateMeeting, useCreateAgendaItem } from '@/hooks/useMeetings';
import { useBulkAddMeetingParticipants } from '@/hooks/useMeetingParticipants';
import { fetchVisibleFeedback, formatFeedbackForNotes } from '@/hooks/useVisibleFeedback';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { StatCard } from '@/components/ui/stat-card';
import { TeamCardSkeleton, ListSkeleton } from '@/components/ui/mobile-skeletons';
import {
  Users, Search, Calendar, Target, GraduationCap, CheckSquare, ArrowRight, AlertTriangle,
} from 'lucide-react';
import { formatDistanceToNow, differenceInDays } from 'date-fns';
import { TeamMemberDetailDialog } from '@/components/team/TeamMemberDetailDialog';
import { QuickScheduleDialog } from '@/components/dashboard/QuickScheduleDialog';

export function MyTeamTab() {
  const { person } = useAuth();
  const { data: teamMembers, isLoading } = useTeamMembersWithDetails();
  const { data: templates } = useMeetingTemplates();
  const createMeeting = useCreateMeeting();
  const createAgendaItem = useCreateAgendaItem();
  const bulkAddParticipants = useBulkAddMeetingParticipants();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<TeamMemberStats | null>(null);
  const [scheduleForMember, setScheduleForMember] = useState<TeamMemberStats | null>(null);

  const oneOnOneTemplates = templates?.filter(t => t.meeting_type === 'one_on_one') || [];
  const defaultTemplate = oneOnOneTemplates.find(t => t.is_default);

  const filteredMembers = teamMembers?.filter(m => {
    const fullName = `${m.member.first_name} ${m.member.last_name}`.toLowerCase();
    const preferredName = m.member.preferred_name?.toLowerCase() || '';
    return fullName.includes(searchQuery.toLowerCase()) || preferredName.includes(searchQuery.toLowerCase());
  }) || [];

  const hasDirectReports = teamMembers && teamMembers.length > 0;

  const teamStats = teamMembers?.reduce((acc, m) => ({
    totalGoals: acc.totalGoals + m.goals.total,
    completedGoals: acc.completedGoals + m.goals.completed,
    openActions: acc.openActions + m.actionItems.open,
    upcomingMeetings: acc.upcomingMeetings + m.meetings.upcoming,
    noScheduledMeeting: acc.noScheduledMeeting + (m.meetings.nextMeetingDate ? 0 : 1),
  }), { totalGoals: 0, completedGoals: 0, openActions: 0, upcomingMeetings: 0, noScheduledMeeting: 0 });

  const getGoalProgress = (member: TeamMemberStats) => {
    if (member.goals.total === 0) return 0;
    return Math.round((member.goals.completed / member.goals.total) * 100);
  };

  const getMeetingStatus = (member: TeamMemberStats) => {
    if (!member.meetings.nextMeetingDate) {
      if (member.meetings.lastMeetingDate) {
        const daysSince = differenceInDays(new Date(), new Date(member.meetings.lastMeetingDate));
        if (daysSince > 14) return { status: 'overdue', label: 'Overdue', color: 'destructive' };
      }
      return { status: 'none', label: 'None scheduled', color: 'warning' };
    }
    return { status: 'scheduled', label: 'Scheduled', color: 'success' };
  };

  const handleSchedule = async (data: { title: string; dateTime: Date; personId: string; templateId?: string }) => {
    if (!person) return;

    const meeting = await createMeeting.mutateAsync({
      meeting_type: 'one_on_one',
      title_en: data.title,
      date_time: data.dateTime.toISOString(),
      duration_minutes: 60,
      organizer_id: person.id,
      person_focus_id: data.personId,
    });

    await bulkAddParticipants.mutateAsync({
      meeting_id: meeting.id,
      person_ids: [data.personId],
    });

    let orderIndex = 0;
    if (data.templateId) {
      const template = templates?.find(t => t.id === data.templateId);
      if (template?.items) {
        for (const item of template.items) {
          await createAgendaItem.mutateAsync({
            meeting_id: meeting.id,
            topic_en: item.topic_en,
            topic_fr: item.topic_fr,
            section_type: item.section_type as any,
            order_index: item.order_index || orderIndex,
          });
          orderIndex = Math.max(orderIndex, (item.order_index || 0) + 1);
        }
      }
    }

    try {
      const visibleFeedback = await fetchVisibleFeedback(data.personId);
      for (const feedback of visibleFeedback) {
        await createAgendaItem.mutateAsync({
          meeting_id: meeting.id,
          topic_en: 'Received Feedback',
          topic_fr: 'Rétroaction reçue',
          section_type: 'feedback_coaching',
          discussion_notes: formatFeedbackForNotes(feedback, 'en'),
          order_index: orderIndex++,
        });
      }
    } catch (error) {
      console.error('Error fetching feedback for agenda:', error);
    }

    setScheduleForMember(null);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {hasDirectReports && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4">
          <StatCard title="Team" value={teamMembers.length} icon={<Users className="h-4 w-4 md:h-5 md:w-5" />} className="p-3 md:p-4" />
          <StatCard title="Goal %" value={`${teamStats?.totalGoals ? Math.round((teamStats.completedGoals / teamStats.totalGoals) * 100) : 0}%`} icon={<Target className="h-4 w-4 md:h-5 md:w-5" />} className="p-3 md:p-4" />
          <StatCard title="Actions" value={teamStats?.openActions || 0} icon={<CheckSquare className="h-4 w-4 md:h-5 md:w-5" />} className="p-3 md:p-4" />
          <StatCard title="1:1s" value={teamStats?.upcomingMeetings || 0} icon={<Calendar className="h-4 w-4 md:h-5 md:w-5" />} className="p-3 md:p-4" />
          <StatCard title="Unscheduled" value={teamStats?.noScheduledMeeting || 0} icon={<AlertTriangle className="h-4 w-4 md:h-5 md:w-5" />} className={`p-3 md:p-4 ${teamStats?.noScheduledMeeting ? 'border-warning/50' : ''}`} />
        </div>
      )}

      <Card>
        <CardContent className="p-3 md:p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search direct reports..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 touch-target" />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <ListSkeleton count={3} ItemComponent={TeamCardSkeleton} />
      ) : filteredMembers.length > 0 ? (
        <div className="grid gap-3 md:gap-4">
          {filteredMembers.map((member) => {
            const initials = `${member.member.first_name[0]}${member.member.last_name[0]}`.toUpperCase();
            const displayName = member.member.preferred_name || `${member.member.first_name} ${member.member.last_name}`;
            const meetingStatus = getMeetingStatus(member);

            return (
              <Card key={member.member.id} className="hover:shadow-md transition-shadow active:scale-[0.99]" onClick={() => setSelectedMember(member)}>
                <CardContent className="p-4 md:p-5">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-base">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-base leading-snug">{displayName}</h3>
                            <Badge variant="secondary" className="text-xs mt-1">{member.member.person_type || 'Staff'}</Badge>
                          </div>
                          <Badge variant={meetingStatus.color as any} className="text-xs shrink-0">{meetingStatus.label}</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">Next 1:1:</span>
                        {member.meetings.nextMeetingDate ? (
                          <span className="font-medium">{formatDistanceToNow(new Date(member.meetings.nextMeetingDate), { addSuffix: false })}</span>
                        ) : (
                          <span className="font-medium text-warning">None</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Target className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">Goals:</span>
                        <span className="font-medium">{member.goals.completed}/{member.goals.total}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">Actions:</span>
                        <span className={`font-medium ${member.actionItems.open > 3 ? 'text-warning' : ''}`}>{member.actionItems.open}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">Courses:</span>
                        <span className="font-medium">{member.courses.completed}/{member.courses.assigned}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button variant="outline" onClick={(e) => { e.stopPropagation(); setSelectedMember(member); }} className="flex-1 sm:flex-none gap-2 touch-target">
                        Profile <ArrowRight className="h-4 w-4" />
                      </Button>
                      {!member.meetings.nextMeetingDate && (
                        <Button onClick={(e) => { e.stopPropagation(); setScheduleForMember(member); }} className="flex-1 sm:flex-none gap-2 touch-target">
                          <Calendar className="h-4 w-4" /> Schedule 1:1
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Users className="h-12 w-12 md:h-16 md:w-16" />}
          title="No Direct Reports"
          description={searchQuery ? "No direct reports match your search" : "You don't have any direct reports assigned yet"}
        />
      )}

      <TeamMemberDetailDialog
        open={!!selectedMember}
        onOpenChange={(open) => !open && setSelectedMember(null)}
        member={selectedMember}
        onScheduleMeeting={() => {
          if (selectedMember) setScheduleForMember(selectedMember);
        }}
      />

      {scheduleForMember && person && (
        <QuickScheduleDialog
          open={!!scheduleForMember}
          onOpenChange={(open) => !open && setScheduleForMember(null)}
          personId={scheduleForMember.member.id}
          personName={`${scheduleForMember.member.first_name} ${scheduleForMember.member.last_name}`}
          organizerId={person.id}
          templates={oneOnOneTemplates}
          defaultTemplateId={defaultTemplate?.id}
          onSchedule={handleSchedule}
          isLoading={createMeeting.isPending}
        />
      )}
    </div>
  );
}
