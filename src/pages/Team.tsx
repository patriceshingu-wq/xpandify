import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamMembersWithDetails, TeamMemberStats } from '@/hooks/useTeamMembers';
import { useTeammates } from '@/hooks/useTeammates';
import { useMeetingTemplates } from '@/hooks/useMeetingTemplates';
import { useCreateMeeting, useCreateAgendaItem } from '@/hooks/useMeetings';
import { useBulkAddMeetingParticipants } from '@/hooks/useMeetingParticipants';
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

export default function Team() {
  const { t } = useLanguage();
  const { person } = useAuth();
  const { data: teamMembers, isLoading } = useTeamMembersWithDetails();
  const { data: teammates, isLoading: isLoadingTeammates } = useTeammates();
  const { data: templates } = useMeetingTemplates();
  const createMeeting = useCreateMeeting();
  const createAgendaItem = useCreateAgendaItem();
  const bulkAddParticipants = useBulkAddMeetingParticipants();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'direct-reports' | 'teammates'>('direct-reports');
  const [selectedMember, setSelectedMember] = useState<TeamMemberStats | null>(null);
  const [scheduleForMember, setScheduleForMember] = useState<TeamMemberStats | null>(null);

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
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="My Team"
          subtitle="View detailed profiles, track performance, and manage your direct reports"
        />

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'direct-reports' | 'teammates')}>
          <TabsList>
            <TabsTrigger value="direct-reports" className="gap-2">
              <Users className="h-4 w-4" />
              Direct Reports
              {hasDirectReports && (
                <Badge variant="secondary" className="ml-1">{teamMembers.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="teammates" className="gap-2">
              <UsersRound className="h-4 w-4" />
              My Teammates
              {hasTeammates && (
                <Badge variant="secondary" className="ml-1">{teammates.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Direct Reports Tab */}
          <TabsContent value="direct-reports" className="mt-6 space-y-6">
            {hasDirectReports && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <StatCard
                  title="Team Members"
                  value={teamMembers.length}
                  icon={<Users className="h-5 w-5" />}
                />
                <StatCard
                  title="Goal Completion"
                  value={`${teamStats?.totalGoals ? Math.round((teamStats.completedGoals / teamStats.totalGoals) * 100) : 0}%`}
                  icon={<Target className="h-5 w-5" />}
                  trend={teamStats?.completedGoals ? { value: teamStats.completedGoals, isPositive: true } : undefined}
                />
                <StatCard
                  title="Open Actions"
                  value={teamStats?.openActions || 0}
                  icon={<CheckSquare className="h-5 w-5" />}
                />
                <StatCard
                  title="Upcoming 1:1s"
                  value={teamStats?.upcomingMeetings || 0}
                  icon={<Calendar className="h-5 w-5" />}
                />
                <StatCard
                  title="Need Scheduling"
                  value={teamStats?.noScheduledMeeting || 0}
                  icon={<AlertTriangle className="h-5 w-5" />}
                  className={teamStats?.noScheduledMeeting ? 'border-warning/50' : ''}
                />
              </div>
            )}

            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search direct reports..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="spinner" />
              </div>
            ) : filteredMembers.length > 0 ? (
              <div className="grid gap-4">
                {filteredMembers.map((member) => {
                  const initials = `${member.member.first_name[0]}${member.member.last_name[0]}`.toUpperCase();
                  const displayName = member.member.preferred_name || `${member.member.first_name} ${member.member.last_name}`;
                  const goalProgress = getGoalProgress(member);
                  const meetingStatus = getMeetingStatus(member);

                  return (
                    <Card key={member.member.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            <Avatar className="h-14 w-14 cursor-pointer" onClick={() => setSelectedMember(member)}>
                              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3
                                  className="font-semibold text-lg cursor-pointer hover:text-primary transition-colors truncate"
                                  onClick={() => setSelectedMember(member)}
                                >
                                  {displayName}
                                </h3>
                                <Badge variant="secondary" className="text-xs shrink-0">
                                  {member.member.person_type || 'Staff'}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                {member.member.email && (
                                  <span className="flex items-center gap-1">
                                    <Mail className="h-3.5 w-3.5" />
                                    {member.member.email}
                                  </span>
                                )}
                                {member.member.start_date && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    Since {format(new Date(member.member.start_date), 'MMM yyyy')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-6">
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground mb-1">Next 1:1</div>
                              {member.meetings.nextMeetingDate ? (
                                <p className="text-sm font-medium">
                                  {formatDistanceToNow(new Date(member.meetings.nextMeetingDate), { addSuffix: true })}
                                </p>
                              ) : (
                                <Badge variant={meetingStatus.color as any} className="text-xs">
                                  {meetingStatus.label}
                                </Badge>
                              )}
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground mb-1">Goals</div>
                              <div className="flex items-center justify-center gap-1">
                                <Target className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                  {member.goals.completed}/{member.goals.total}
                                </span>
                              </div>
                              <Progress value={goalProgress} className="h-1 mt-1" />
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground mb-1">Open Actions</div>
                              <span className={`text-sm font-medium ${member.actionItems.open > 3 ? 'text-warning' : ''}`}>
                                {member.actionItems.open}
                              </span>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground mb-1">Courses</div>
                              <div className="flex items-center justify-center gap-1">
                                <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                  {member.courses.completed}/{member.courses.assigned}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 lg:flex-col lg:items-end shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedMember(member)}
                              className="gap-1"
                            >
                              View Profile
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                            {!member.meetings.nextMeetingDate && (
                              <Button
                                size="sm"
                                onClick={() => setScheduleForMember(member)}
                                className="gap-1"
                              >
                                <Calendar className="h-3.5 w-3.5" />
                                Schedule 1:1
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
                icon={<Users className="h-16 w-16" />}
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

            if (data.templateId) {
              const template = templates?.find(t => t.id === data.templateId);
              if (template?.items) {
                for (const item of template.items) {
                  await createAgendaItem.mutateAsync({
                    meeting_id: meeting.id,
                    topic_en: item.topic_en,
                    topic_fr: item.topic_fr,
                    section_type: item.section_type as any,
                    order_index: item.order_index || 0,
                  });
                }
              }
            }

            setScheduleForMember(null);
          }}
          isLoading={createMeeting.isPending}
        />
      )}
    </MainLayout>
  );
}
