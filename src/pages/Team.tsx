import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamMembersWithDetails, TeamMemberStats } from '@/hooks/useTeamMembers';
import { useTeammates } from '@/hooks/useTeammates';
import { useSupervisor } from '@/hooks/useSupervisor';
import { useMeetingTemplates } from '@/hooks/useMeetingTemplates';
import { useCreateMeeting, useCreateAgendaItem } from '@/hooks/useMeetings';
import { useBulkAddMeetingParticipants } from '@/hooks/useMeetingParticipants';
import { fetchVisibleFeedback, formatFeedbackForNotes } from '@/hooks/useVisibleFeedback';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { StatCard } from '@/components/ui/stat-card';
import {
  Users,
  UsersRound,
  Crown,
  Search,
  Calendar,
  Target,
  GraduationCap,
  CheckSquare,
  Mail,
  Clock,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
import { TeamMemberDetailDialog } from '@/components/team/TeamMemberDetailDialog';
import { QuickScheduleDialog } from '@/components/dashboard/QuickScheduleDialog';
import { TeammateCard } from '@/components/team/TeammateCard';
import { SupervisorCard } from '@/components/team/SupervisorCard';

export default function Team() {
  const { t } = useLanguage();
  const { person } = useAuth();
  const { data: teamMembers, isLoading } = useTeamMembersWithDetails();
  const { data: teammates, isLoading: isLoadingTeammates } = useTeammates();
  const { data: supervisor, isLoading: isLoadingSupervisor } = useSupervisor();
  const { data: templates } = useMeetingTemplates();
  const createMeeting = useCreateMeeting();
  const createAgendaItem = useCreateAgendaItem();
  const bulkAddParticipants = useBulkAddMeetingParticipants();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'supervisor' | 'direct-reports' | 'teammates' | null>(null);
  const [selectedMember, setSelectedMember] = useState<TeamMemberStats | null>(null);
  const [scheduleForMember, setScheduleForMember] = useState<TeamMemberStats | null>(null);
  const [scheduleForSupervisor, setScheduleForSupervisor] = useState(false);

  // Set default tab based on available data
  useEffect(() => {
    if (activeTab === null && !isLoading && !isLoadingTeammates) {
      if (teamMembers && teamMembers.length > 0) {
        setActiveTab('direct-reports');
      } else if (teammates && teammates.length > 0) {
        setActiveTab('teammates');
      } else {
        setActiveTab('supervisor');
      }
    }
  }, [activeTab, isLoading, isLoadingTeammates, teamMembers, teammates]);

  // Filter templates for 1:1 meetings
  const oneOnOneTemplates = templates?.filter(t => t.meeting_type === 'one_on_one') || [];
  const defaultTemplate = oneOnOneTemplates.find(t => t.is_default);

  const filteredMembers = teamMembers?.filter(m => {
    const fullName = `${m.member.first_name} ${m.member.last_name}`.toLowerCase();
    const preferredName = m.member.preferred_name?.toLowerCase() || '';
    return fullName.includes(searchQuery.toLowerCase()) || preferredName.includes(searchQuery.toLowerCase());
  }) || [];

  const filteredTeammates = teammates?.filter(t => {
    const fullName = `${t.first_name} ${t.last_name}`.toLowerCase();
    const preferredName = t.preferred_name?.toLowerCase() || '';
    return fullName.includes(searchQuery.toLowerCase()) || preferredName.includes(searchQuery.toLowerCase());
  }) || [];

  const hasSupervisor = !!supervisor;
  const hasDirectReports = teamMembers && teamMembers.length > 0;
  const hasTeammates = teammates && teammates.length > 0;

  // Calculate team-wide stats
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

  return (
    <MainLayout title="My Team" subtitle="Manage and support your direct reports">
      <div className="space-y-4 md:space-y-6 animate-fade-in">
        <PageHeader
          title="My Team"
          subtitle="View profiles and track performance"
        />

        {/* Tab Navigation - Scrollable on mobile */}
        <Tabs value={activeTab || 'supervisor'} onValueChange={(v) => setActiveTab(v as 'supervisor' | 'direct-reports' | 'teammates')}>
          <TabsList className="w-full md:w-auto overflow-x-auto flex-nowrap">
            <TabsTrigger value="supervisor" className="gap-1.5 touch-target flex-shrink-0">
              <Crown className="h-4 w-4" />
              <span className="hidden sm:inline">My</span> Supervisor
            </TabsTrigger>
            <TabsTrigger value="direct-reports" className="gap-1.5 touch-target flex-shrink-0">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Direct</span> Reports
              {hasDirectReports && (
                <Badge variant="secondary" className="ml-1 text-xs">{teamMembers.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="teammates" className="gap-1.5 touch-target flex-shrink-0">
              <UsersRound className="h-4 w-4" />
              Teammates
              {hasTeammates && (
                <Badge variant="secondary" className="ml-1 text-xs">{teammates.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Supervisor Tab */}
          <TabsContent value="supervisor" className="mt-6 space-y-6">
            {isLoadingSupervisor ? (
              <div className="flex items-center justify-center py-12">
                <div className="spinner" />
              </div>
            ) : supervisor ? (
              <SupervisorCard supervisor={supervisor} onScheduleMeeting={() => setScheduleForSupervisor(true)} />
            ) : (
              <EmptyState
                icon={<Crown className="h-16 w-16" />}
                title="No Supervisor Assigned"
                description="You don't have a supervisor assigned in the system yet"
              />
            )}
          </TabsContent>

          <TabsContent value="direct-reports" className="mt-4 md:mt-6 space-y-4 md:space-y-6">
            {hasDirectReports && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4">
                <StatCard
                  title="Team"
                  value={teamMembers.length}
                  icon={<Users className="h-4 w-4 md:h-5 md:w-5" />}
                  className="p-3 md:p-4"
                />
                <StatCard
                  title="Goal %"
                  value={`${teamStats?.totalGoals ? Math.round((teamStats.completedGoals / teamStats.totalGoals) * 100) : 0}%`}
                  icon={<Target className="h-4 w-4 md:h-5 md:w-5" />}
                  className="p-3 md:p-4"
                />
                <StatCard
                  title="Actions"
                  value={teamStats?.openActions || 0}
                  icon={<CheckSquare className="h-4 w-4 md:h-5 md:w-5" />}
                  className="p-3 md:p-4"
                />
                <StatCard
                  title="1:1s"
                  value={teamStats?.upcomingMeetings || 0}
                  icon={<Calendar className="h-4 w-4 md:h-5 md:w-5" />}
                  className="p-3 md:p-4"
                />
                <StatCard
                  title="Unscheduled"
                  value={teamStats?.noScheduledMeeting || 0}
                  icon={<AlertTriangle className="h-4 w-4 md:h-5 md:w-5" />}
                  className={`p-3 md:p-4 ${teamStats?.noScheduledMeeting ? 'border-warning/50' : ''}`}
                />
              </div>
            )}

            <Card>
              <CardContent className="p-3 md:p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search direct reports..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 touch-target"
                  />
                </div>
              </CardContent>
            </Card>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="spinner" />
              </div>
            ) : filteredMembers.length > 0 ? (
              <div className="grid gap-3 md:gap-4">
                {filteredMembers.map((member) => {
                  const initials = `${member.member.first_name[0]}${member.member.last_name[0]}`.toUpperCase();
                  const displayName = member.member.preferred_name || `${member.member.first_name} ${member.member.last_name}`;
                  const goalProgress = getGoalProgress(member);
                  const meetingStatus = getMeetingStatus(member);

                  return (
                    <Card 
                      key={member.member.id} 
                      className="hover:shadow-md transition-shadow active:scale-[0.99]"
                      onClick={() => setSelectedMember(member)}
                    >
                      <CardContent className="p-4 md:p-6">
                        {/* Mobile-first layout */}
                        <div className="flex items-start gap-3 md:gap-4">
                          <Avatar className="h-12 w-12 md:h-14 md:w-14 flex-shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-base md:text-lg">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h3 className="font-semibold text-base md:text-lg truncate">
                                  {displayName}
                                </h3>
                                <Badge variant="secondary" className="text-xs mt-0.5">
                                  {member.member.person_type || 'Staff'}
                                </Badge>
                              </div>
                              {/* Meeting status badge - visible on mobile */}
                              <Badge 
                                variant={meetingStatus.color as any} 
                                className="text-xs shrink-0 md:hidden"
                              >
                                {meetingStatus.label}
                              </Badge>
                            </div>
                            
                            {/* Stats grid - 2x2 on mobile */}
                            <div className="grid grid-cols-4 gap-2 mt-3 text-center">
                              <div>
                                <div className="text-[10px] md:text-xs text-muted-foreground">Next 1:1</div>
                                {member.meetings.nextMeetingDate ? (
                                  <p className="text-xs md:text-sm font-medium truncate">
                                    {formatDistanceToNow(new Date(member.meetings.nextMeetingDate), { addSuffix: false })}
                                  </p>
                                ) : (
                                  <p className="text-xs font-medium text-warning">None</p>
                                )}
                              </div>
                              <div>
                                <div className="text-[10px] md:text-xs text-muted-foreground">Goals</div>
                                <p className="text-xs md:text-sm font-medium">
                                  {member.goals.completed}/{member.goals.total}
                                </p>
                              </div>
                              <div>
                                <div className="text-[10px] md:text-xs text-muted-foreground">Actions</div>
                                <p className={`text-xs md:text-sm font-medium ${member.actionItems.open > 3 ? 'text-warning' : ''}`}>
                                  {member.actionItems.open}
                                </p>
                              </div>
                              <div>
                                <div className="text-[10px] md:text-xs text-muted-foreground">Courses</div>
                                <p className="text-xs md:text-sm font-medium">
                                  {member.courses.completed}/{member.courses.assigned}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Action buttons - full width on mobile */}
                        <div className="flex gap-2 mt-3 md:mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); setSelectedMember(member); }}
                            className="flex-1 md:flex-none gap-1 touch-target text-xs md:text-sm"
                          >
                            Profile
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                          {!member.meetings.nextMeetingDate && (
                            <Button
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); setScheduleForMember(member); }}
                              className="flex-1 md:flex-none gap-1 touch-target text-xs md:text-sm"
                            >
                              <Calendar className="h-3.5 w-3.5" />
                              Schedule
                            </Button>
                          )}
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
          </TabsContent>

          {/* Teammates Tab */}
          <TabsContent value="teammates" className="mt-6 space-y-6">
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search teammates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {isLoadingTeammates ? (
              <div className="flex items-center justify-center py-12">
                <div className="spinner" />
              </div>
            ) : filteredTeammates.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredTeammates.map((teammate) => (
                  <TeammateCard key={teammate.id} teammate={teammate} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<UsersRound className="h-16 w-16" />}
                title="No Teammates"
                description={searchQuery ? "No teammates match your search" : "You don't have any teammates with the same supervisor"}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Member Detail Dialog */}
      <TeamMemberDetailDialog
        open={!!selectedMember}
        onOpenChange={(open) => !open && setSelectedMember(null)}
        member={selectedMember}
        onScheduleMeeting={() => {
          if (selectedMember) {
            setScheduleForMember(selectedMember);
          }
        }}
      />

      {/* Quick Schedule Dialog */}
      {scheduleForMember && person && (
        <QuickScheduleDialog
          open={!!scheduleForMember}
          onOpenChange={(open) => !open && setScheduleForMember(null)}
          personId={scheduleForMember.member.id}
          personName={`${scheduleForMember.member.first_name} ${scheduleForMember.member.last_name}`}
          organizerId={person.id}
          templates={oneOnOneTemplates}
          defaultTemplateId={defaultTemplate?.id}
          onSchedule={async (data) => {
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

            // Add visible feedback as agenda items
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
          }}
          isLoading={createMeeting.isPending}
        />
      )}

      {/* Quick Schedule Dialog for Supervisor */}
      {scheduleForSupervisor && supervisor && person && (
        <QuickScheduleDialog
          open={scheduleForSupervisor}
          onOpenChange={(open) => !open && setScheduleForSupervisor(false)}
          personId={supervisor.id}
          personName={`${supervisor.first_name} ${supervisor.last_name}`}
          organizerId={person.id}
          templates={oneOnOneTemplates}
          defaultTemplateId={defaultTemplate?.id}
          onSchedule={async (data) => {
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

            // Add visible feedback as agenda items
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

            setScheduleForSupervisor(false);
          }}
          isLoading={createMeeting.isPending}
        />
      )}
    </MainLayout>
  );
}
