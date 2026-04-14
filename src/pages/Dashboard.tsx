import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { WelcomeBanner } from '@/components/dashboard/WelcomeBanner';
import { YearlyThemeBanner } from '@/components/dashboard/YearlyThemeBanner';
import { useDirectReports } from '@/hooks/useDirectReports';
import { usePeople } from '@/hooks/usePeople';
import { useGoals } from '@/hooks/useGoals';
import { useMeetings } from '@/hooks/useMeetings';
import { useUserActionItems } from '@/hooks/useUserActionItems';
import {
  Users,
  Target,
  Calendar,
  CheckSquare,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { format, isToday, isTomorrow, isAfter } from 'date-fns';

export default function Dashboard() {
  const { t, getLocalizedField } = useLanguage();
  const { person } = useAuth();
  const navigate = useNavigate();
  const needsOnboarding = person && !person.onboarding_completed;
  const [showOnboarding, setShowOnboarding] = useState(!!needsOnboarding);

  // Fetch data
  const { data: allPeople, isLoading: peopleLoading } = usePeople();
  const { data: goals, isLoading: goalsLoading } = useGoals();
  const { data: meetings, isLoading: meetingsLoading } = useMeetings();
  const { data: directReports } = useDirectReports();
  const { data: actionItems } = useUserActionItems('all');

  const displayName = person?.preferred_name || person?.first_name || 'User';

  // Calculate stats
  const totalPeople = (allPeople || []).filter(p => p.status === 'active').length;
  const goalsInProgress = (goals || []).filter(g => g.status === 'in_progress').length;

  // Open action items
  const openActions = (actionItems || []).filter(
    (a: any) => a.action_status === 'open' || a.action_status === 'in_progress'
  );
  const today = new Date().toISOString().split('T')[0];
  const overdueActions = openActions.filter((a: any) => a.action_due_date && a.action_due_date < today);

  // Get upcoming meetings
  const now = new Date();
  const upcomingMeetings = (meetings || [])
    .filter(m => isAfter(new Date(m.date_time), now))
    .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime())
    .slice(0, 5);

  // My active goals
  const myGoals = (goals || [])
    .filter(g => g.owner_person_id === person?.id && (g.status === 'in_progress' || g.status === 'not_started'))
    .slice(0, 5);

  const isLoading = peopleLoading || goalsLoading || meetingsLoading;

  const formatMeetingDate = (dateTime: string) => {
    const date = new Date(dateTime);
    if (isToday(date)) return `Today, ${format(date, 'h:mm a')}`;
    if (isTomorrow(date)) return `Tomorrow, ${format(date, 'h:mm a')}`;
    return format(date, 'EEE, MMM d · h:mm a');
  };

  return (
    <>
      <OnboardingWizard open={showOnboarding} onComplete={() => setShowOnboarding(false)} />
      <MainLayout
        title={`${t('dashboard.welcome')}, ${displayName}!`}
        subtitle={t('dashboard.overview')}
      >
        <div className="space-y-6 animate-fade-in max-w-4xl">
          {/* Welcome Banner for new users */}
          <WelcomeBanner />

          {/* Yearly Theme Banner */}
          <YearlyThemeBanner />

          {/* Compact Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {isLoading ? (
              <>
                <Skeleton className="h-[72px] rounded-lg" />
                <Skeleton className="h-[72px] rounded-lg" />
                <Skeleton className="h-[72px] rounded-lg" />
                <Skeleton className="h-[72px] rounded-lg" />
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/meetings')}
                  className="text-left p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <p className="text-2xl font-semibold">{upcomingMeetings.length}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Upcoming Meetings</p>
                </button>
                <button
                  onClick={() => navigate('/goals')}
                  className="text-left p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <p className="text-2xl font-semibold">{goalsInProgress}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Active Goals</p>
                </button>
                <button
                  onClick={() => navigate('/people')}
                  className="text-left p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <p className="text-2xl font-semibold">{totalPeople}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Team Members</p>
                </button>
                <button
                  onClick={() => navigate('/meetings')}
                  className={`text-left p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors ${overdueActions.length > 0 ? 'border-destructive/30' : ''}`}
                >
                  <p className="text-2xl font-semibold">{openActions.length}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Open Actions
                    {overdueActions.length > 0 && (
                      <span className="text-destructive ml-1">({overdueActions.length} overdue)</span>
                    )}
                  </p>
                </button>
              </>
            )}
          </div>

          {/* Action Items — only show if there are items */}
          {openActions.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base font-medium">
                    <CheckSquare className="h-4 w-4" />
                    Action Items
                    {overdueActions.length > 0 && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0 font-normal">
                        {overdueActions.length} overdue
                      </Badge>
                    )}
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/meetings')} className="text-muted-foreground text-xs">
                    View All <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {openActions.slice(0, 4).map((item: any) => {
                    const isOverdue = item.action_due_date && item.action_due_date < today;
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-3 rounded-lg border text-sm ${isOverdue ? 'border-destructive/20 bg-destructive/5' : ''}`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {isOverdue ? (
                            <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                          ) : (
                            <CheckSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          )}
                          <span className="truncate">{getLocalizedField(item, 'topic')}</span>
                        </div>
                        {item.action_due_date && (
                          <span className={`text-xs shrink-0 ml-2 ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {format(new Date(item.action_due_date), 'MMM d')}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {openActions.length > 4 && (
                    <p className="text-xs text-muted-foreground text-center pt-1">
                      +{openActions.length - 4} more
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Two-column: Upcoming Meetings + My Goals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Upcoming Meetings */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base font-medium">
                    <Calendar className="h-4 w-4" />
                    Upcoming Meetings
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/meetings')} className="text-muted-foreground text-xs">
                    View All <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {meetingsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-14 rounded-lg" />
                    <Skeleton className="h-14 rounded-lg" />
                  </div>
                ) : upcomingMeetings.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">No upcoming meetings</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/meetings')}>
                      Schedule a meeting
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {upcomingMeetings.map((meeting) => (
                      <div key={meeting.id} className="flex items-center justify-between p-3 rounded-lg border text-sm">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{getLocalizedField(meeting, 'title')}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatMeetingDate(meeting.date_time)}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[10px] shrink-0 ml-2">
                          {meeting.meeting_type === 'one_on_one' ? '1:1' : meeting.meeting_type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* My Goals */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base font-medium">
                    <Target className="h-4 w-4" />
                    My Goals
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/goals')} className="text-muted-foreground text-xs">
                    View All <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {goalsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 rounded-lg" />
                    <Skeleton className="h-12 rounded-lg" />
                  </div>
                ) : myGoals.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">No active goals</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/goals')}>
                      Create a goal
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myGoals.map((goal) => (
                      <div key={goal.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <p className="font-medium truncate pr-2">
                            {getLocalizedField(goal, 'title')}
                          </p>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {goal.progress_percent || 0}%
                          </span>
                        </div>
                        <Progress value={goal.progress_percent || 0} className="h-1.5" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Supervisor: Direct Reports section */}
          {(directReports?.length || 0) > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base font-medium">
                    <Users className="h-4 w-4" />
                    My Team
                    <span className="text-sm font-normal text-muted-foreground">
                      ({directReports?.length} direct report{(directReports?.length || 0) !== 1 ? 's' : ''})
                    </span>
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/people')} className="text-muted-foreground text-xs">
                    View All <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {directReports?.slice(0, 5).map((report: any) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-3 rounded-lg border text-sm cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigate(`/people/${report.id}`)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <span className="text-xs font-medium">
                            {(report.first_name || '?')[0]}{(report.last_name || '?')[0]}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{report.first_name} {report.last_name}</p>
                          {report.title && (
                            <p className="text-xs text-muted-foreground truncate">{report.title}</p>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] shrink-0 ${
                          report.status === 'active' ? 'text-success border-success/20' : ''
                        }`}
                      >
                        {report.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </MainLayout>
    </>
  );
}
