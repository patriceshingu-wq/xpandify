import { lazy, Suspense } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DevelopmentProgressWidget } from '@/components/dashboard/DevelopmentProgressWidget';
import { WelcomeBanner } from '@/components/dashboard/WelcomeBanner';
import { YearlyThemeBanner } from '@/components/dashboard/YearlyThemeBanner';
import { SupervisorDashboard } from '@/components/dashboard/SupervisorDashboard';
import { StaffDashboard } from '@/components/dashboard/StaffDashboard';
import { useDirectReports } from '@/hooks/useDirectReports';
import { usePeople } from '@/hooks/usePeople';
import { useGoals } from '@/hooks/useGoals';
import { useMeetings } from '@/hooks/useMeetings';
import { Users, Target, Calendar, BarChart3 } from 'lucide-react';
import { format, isToday, isTomorrow, isAfter } from 'date-fns';

// Lazy load chart components (recharts is ~1.2MB)
const GoalCompletionChart = lazy(() => import('@/components/dashboard/GoalCompletionChart').then(m => ({ default: m.GoalCompletionChart })));
const TrainingProgressChart = lazy(() => import('@/components/dashboard/TrainingProgressChart').then(m => ({ default: m.TrainingProgressChart })));
const TeamEngagementChart = lazy(() => import('@/components/dashboard/TeamEngagementChart').then(m => ({ default: m.TeamEngagementChart })));

// Chart skeleton for Suspense fallback
function ChartSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[200px] w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { t, getLocalizedField } = useLanguage();
  const { person } = useAuth();

  // Fetch real data
  const { data: allPeople, isLoading: peopleLoading } = usePeople();
  const { data: goals, isLoading: goalsLoading } = useGoals();
  const { data: meetings, isLoading: meetingsLoading } = useMeetings();
  const { data: directReports } = useDirectReports();

  const hasDirectReports = (directReports?.length || 0) > 0;

  const displayName = person?.preferred_name || person?.first_name || 'User';

  // Calculate people stats
  const activeStaff = (allPeople || []).filter(p => p.person_type === 'staff' && p.status === 'active').length;
  const activeVolunteers = (allPeople || []).filter(p => p.person_type === 'volunteer' && p.status === 'active').length;
  const totalActive = activeStaff + activeVolunteers;

  // Calculate goals stats
  const goalsInProgress = (goals || []).filter(g => g.status === 'in_progress').length;
  const recentGoals = (goals || [])
    .filter(g => g.status === 'in_progress' || g.status === 'not_started')
    .slice(0, 3);

  // Get upcoming meetings (future meetings, sorted by date)
  const now = new Date();
  const upcomingMeetings = (meetings || [])
    .filter(m => isAfter(new Date(m.date_time), now))
    .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime())
    .slice(0, 4);

  const formatMeetingDate = (dateTime: string) => {
    const date = new Date(dateTime);
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`;
    }
    if (isTomorrow(date)) {
      return `Tomorrow at ${format(date, 'h:mm a')}`;
    }
    return format(date, 'MMM d \'at\' h:mm a');
  };

  const getMeetingTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      one_on_one: '1:1',
      team: 'Team',
      ministry: 'Ministry',
      board: 'Board',
      other: 'Other',
    };
    return labels[type] || type;
  };

  const getMeetingTypeStyle = (type: string) => {
    const styles: Record<string, string> = {
      one_on_one: 'bg-accent/10 text-accent',
      team: 'bg-info/10 text-info',
      ministry: 'bg-success/10 text-success',
      board: 'bg-warning/10 text-warning',
      other: 'bg-muted text-muted-foreground',
    };
    return styles[type] || styles.other;
  };

  const isLoading = peopleLoading || goalsLoading;

  return (
    <MainLayout
      title={`${t('dashboard.welcome')}, ${displayName}!`}
      subtitle={t('dashboard.overview')}
    >
      <div className="space-y-6 animate-fade-in">
        {/* Yearly Theme Banner */}
        <YearlyThemeBanner />

        {/* Stats Grid - 2 cols on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {isLoading ? (
            <>
              <Skeleton className="h-[100px] md:h-[120px] rounded-xl" />
              <Skeleton className="h-[100px] md:h-[120px] rounded-xl" />
              <Skeleton className="h-[100px] md:h-[120px] rounded-xl" />
              <Skeleton className="h-[100px] md:h-[120px] rounded-xl" />
            </>
          ) : (
            <>
              <StatCard
                title={t('dashboard.totalPeople')}
                value={totalActive.toString()}
                subtitle={`${activeStaff} staff, ${activeVolunteers} vol.`}
                icon={<Users className="h-5 w-5 md:h-6 md:w-6 text-accent" />}
                className="p-4 md:p-6"
              />
              <StatCard
                title={t('dashboard.activeStaff')}
                value={activeStaff.toString()}
                icon={<Users className="h-5 w-5 md:h-6 md:w-6 text-info" />}
                className="p-4 md:p-6"
              />
              <StatCard
                title={t('dashboard.activeVolunteers')}
                value={activeVolunteers.toString()}
                icon={<Users className="h-5 w-5 md:h-6 md:w-6 text-success" />}
                className="p-4 md:p-6"
              />
              <StatCard
                title={t('dashboard.goalsInProgress')}
                value={goalsInProgress.toString()}
                icon={<Target className="h-5 w-5 md:h-6 md:w-6 text-warning" />}
                className="p-4 md:p-6"
              />
            </>
          )}
        </div>

        {/* Role-Based Dashboards */}
        {hasDirectReports ? (
          <SupervisorDashboard />
        ) : (
          <StaffDashboard />
        )}

        {/* Content Grid - Stack on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Upcoming Meetings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-accent" />
                {t('dashboard.upcomingMeetings')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {meetingsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 rounded-lg" />
                  <Skeleton className="h-16 rounded-lg" />
                </div>
              ) : upcomingMeetings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No upcoming meetings
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingMeetings.map((meeting) => (
                    <div key={meeting.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{getLocalizedField(meeting, 'title')}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatMeetingDate(meeting.date_time)}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${getMeetingTypeStyle(meeting.meeting_type || 'other')}`}>
                        {getMeetingTypeLabel(meeting.meeting_type || 'other')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-accent" />
                {t('dashboard.recentGoals')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {goalsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 rounded-lg" />
                  <Skeleton className="h-12 rounded-lg" />
                </div>
              ) : recentGoals.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No active goals
                </p>
              ) : (
                <div className="space-y-4">
                  {recentGoals.map((goal) => (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm truncate pr-2">
                          {getLocalizedField(goal, 'title')}
                        </p>
                        <span className="text-sm text-muted-foreground shrink-0">
                          {goal.progress_percent || 0}%
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            (goal.progress_percent || 0) >= 75 ? 'bg-success' :
                            (goal.progress_percent || 0) >= 50 ? 'bg-accent' :
                            (goal.progress_percent || 0) >= 25 ? 'bg-info' : 'bg-warning'
                          }`}
                          style={{ width: `${goal.progress_percent || 0}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Analytics Charts - Single column on mobile, lazy loaded */}
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
            <BarChart3 className="h-5 w-5 text-accent" />
            Analytics & Insights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <Suspense fallback={<ChartSkeleton />}>
              <GoalCompletionChart />
            </Suspense>
            <Suspense fallback={<ChartSkeleton />}>
              <TrainingProgressChart />
            </Suspense>
            <Suspense fallback={<ChartSkeleton />}>
              <TeamEngagementChart />
            </Suspense>
          </div>
        </div>

        {/* Development Progress Widget */}
        <DevelopmentProgressWidget />
      </div>
    </MainLayout>
  );
}
