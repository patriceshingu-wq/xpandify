import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserActionItems, ActionItem } from '@/hooks/useUserActionItems';
import { useMeetings } from '@/hooks/useMeetings';
import { useGoals } from '@/hooks/useGoals';
import { useDevelopmentPlans } from '@/hooks/useDevelopmentPlans';
import { useUpdateAgendaItem } from '@/hooks/useMeetings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  CheckSquare, 
  Calendar, 
  Target, 
  GraduationCap, 
  Clock, 
  AlertCircle,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

export function StaffDashboard() {
  const { t, getLocalizedField } = useLanguage();
  const { person } = useAuth();
  const navigate = useNavigate();
  
  const { data: actionItems, isLoading: actionsLoading } = useUserActionItems('all');
  const { data: meetings, isLoading: meetingsLoading } = useMeetings();
  const { data: goals, isLoading: goalsLoading } = useGoals();
  const { data: pdps, isLoading: pdpsLoading } = useDevelopmentPlans();
  const updateAgendaItem = useUpdateAgendaItem();

  // Group action items by urgency
  const today = new Date().toISOString().split('T')[0];
  const openActions = actionItems?.filter(a => 
    a.action_status === 'open' || a.action_status === 'in_progress'
  ) || [];

  const overdueActions = openActions.filter(a => a.action_due_date && a.action_due_date < today);
  const dueTodayActions = openActions.filter(a => a.action_due_date === today);
  const upcomingActions = openActions.filter(a => !a.action_due_date || a.action_due_date > today);
  const urgentCount = overdueActions.length + dueTodayActions.length;

  // Get upcoming meetings for this user (as participant or focus)
  const now = new Date();
  const upcomingMeetings = meetings?.filter(m => 
    new Date(m.date_time) > now && 
    (m.organizer_id === person?.id || (m as any).person_focus_id === person?.id)
  ).sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime())
  .slice(0, 5) || [];

  // Filter user's in-progress goals
  const myGoals = goals?.filter(g => 
    g.owner_person_id === person?.id && 
    (g.status === 'in_progress' || g.status === 'not_started')
  ).slice(0, 5) || [];

  // Get PDP items for current user
  const myPdpItems = pdps?.filter(p => p.person_id === person?.id)
    .flatMap(p => (p as any).pdp_items || [])
    .filter((item: any) => item.status === 'in_progress' || item.status === 'not_started')
    .slice(0, 5) || [];

  const handleStatusChange = async (itemId: string, meetingId: string, newStatus: string) => {
    try {
      await updateAgendaItem.mutateAsync({
        id: itemId,
        meeting_id: meetingId,
        action_status: newStatus as any,
      });
      toast.success('Action item updated');
    } catch (error) {
      toast.error('Failed to update action item');
    }
  };

  const isLoading = actionsLoading || meetingsLoading || goalsLoading || pdpsLoading;

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${urgentCount > 0 ? 'bg-destructive/10' : openActions.length > 0 ? 'bg-warning/10' : 'bg-success/10'}`}>
                <CheckSquare className={`h-4 w-4 ${urgentCount > 0 ? 'text-destructive' : openActions.length > 0 ? 'text-warning' : 'text-success'}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{openActions.length}</p>
                <p className="text-xs text-muted-foreground">Open Actions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingMeetings.length}</p>
                <p className="text-xs text-muted-foreground">Upcoming Meetings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Target className="h-4 w-4 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{myGoals.length}</p>
                <p className="text-xs text-muted-foreground">Active Goals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10">
                <GraduationCap className="h-4 w-4 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{myPdpItems.length}</p>
                <p className="text-xs text-muted-foreground">Development Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Action Items */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckSquare className="h-4 w-4" />
                My Action Items
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/meetings')}
              >
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {openActions.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle className="h-10 w-10 mx-auto mb-2 text-success" />
                <p className="text-sm">All caught up! No open action items.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {overdueActions.length > 0 && (
                  <>
                    <p className="text-xs font-semibold text-destructive uppercase tracking-wider">Overdue</p>
                    {overdueActions.slice(0, 3).map((item) => (
                      <ActionItemRow key={item.id} item={item} urgency="overdue" onStatusChange={handleStatusChange} />
                    ))}
                  </>
                )}
                {dueTodayActions.length > 0 && (
                  <>
                    <p className="text-xs font-semibold text-warning uppercase tracking-wider">Due Today</p>
                    {dueTodayActions.slice(0, 3).map((item) => (
                      <ActionItemRow key={item.id} item={item} urgency="due_today" onStatusChange={handleStatusChange} />
                    ))}
                  </>
                )}
                {upcomingActions.length > 0 && (
                  <>
                    {(overdueActions.length > 0 || dueTodayActions.length > 0) && (
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upcoming</p>
                    )}
                    {upcomingActions.slice(0, 5 - overdueActions.length - dueTodayActions.length).map((item) => (
                      <ActionItemRow key={item.id} item={item} urgency="upcoming" onStatusChange={handleStatusChange} />
                    ))}
                  </>
                )}
                {openActions.length > 5 && (
                  <p className="text-xs text-center text-muted-foreground pt-2">
                    +{openActions.length - 5} more items
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Meetings */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                Upcoming Meetings
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/meetings')}
              >
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingMeetings.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No upcoming meetings scheduled</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingMeetings.map((meeting) => (
                  <MeetingRow key={meeting.id} meeting={meeting} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Goals */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4" />
                My Goals
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/goals')}
              >
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {myGoals.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Target className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No active goals</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myGoals.map((goal) => (
                  <GoalRow key={goal.id} goal={goal} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Development Items */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <GraduationCap className="h-4 w-4" />
                Development Plan
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/development')}
              >
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {myPdpItems.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <GraduationCap className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No development items in progress</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myPdpItems.map((item: any) => (
                  <PdpItemRow key={item.id} item={item} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ActionItemRow({ 
  item, 
  urgency = 'upcoming',
  onStatusChange 
}: { 
  item: ActionItem; 
  urgency?: 'overdue' | 'due_today' | 'upcoming';
  onStatusChange: (id: string, meetingId: string, status: string) => void;
}) {
  const { getLocalizedField } = useLanguage();

  const borderClass = urgency === 'overdue' 
    ? 'border-destructive/30 bg-destructive/5' 
    : urgency === 'due_today' 
    ? 'border-warning/30 bg-warning/5' 
    : '';

  return (
    <div className={`p-3 rounded-lg border hover:bg-muted/50 transition-colors ${borderClass}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm truncate">
              {getLocalizedField(item, 'topic')}
            </p>
            {urgency === 'overdue' && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Overdue</Badge>
            )}
            {urgency === 'due_today' && (
              <Badge className="text-[10px] px-1.5 py-0 bg-warning text-warning-foreground">Due Today</Badge>
            )}
          </div>
          {item.meeting && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              From: {getLocalizedField(item.meeting, 'title')}
            </p>
          )}
          {item.action_due_date && (
            <div className={`flex items-center gap-1 mt-1 text-xs ${urgency === 'overdue' ? 'text-destructive' : 'text-muted-foreground'}`}>
              {urgency === 'overdue' ? <AlertCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
              <span>
                {urgency === 'overdue' ? 'Overdue: ' : 'Due: '}
                {format(new Date(item.action_due_date), 'MMM d, yyyy')}
              </span>
            </div>
          )}
        </div>
        <Select
          value={item.action_status || 'open'}
          onValueChange={(value) => onStatusChange(item.id, item.meeting_id, value)}
        >
          <SelectTrigger className="w-28 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function MeetingRow({ meeting }: { meeting: any }) {
  const { getLocalizedField } = useLanguage();
  const meetingDate = new Date(meeting.date_time);
  
  const getDateLabel = () => {
    if (isToday(meetingDate)) return 'Today';
    if (isTomorrow(meetingDate)) return 'Tomorrow';
    return format(meetingDate, 'EEE, MMM d');
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

  return (
    <div className="p-3 rounded-lg border hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">
            {getLocalizedField(meeting, 'title')}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {getDateLabel()} at {format(meetingDate, 'h:mm a')}
          </p>
        </div>
        <Badge className={`text-xs shrink-0 ${getMeetingTypeStyle(meeting.meeting_type)}`}>
          {meeting.meeting_type === 'one_on_one' ? '1:1' : meeting.meeting_type}
        </Badge>
      </div>
    </div>
  );
}

function GoalRow({ goal }: { goal: any }) {
  const { getLocalizedField } = useLanguage();
  const progress = goal.progress_percent || 0;

  return (
    <div className="p-3 rounded-lg border hover:bg-muted/50 transition-colors">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="font-medium text-sm truncate flex-1">
          {getLocalizedField(goal, 'title')}
        </p>
        <span className="text-xs text-muted-foreground shrink-0">
          {progress}%
        </span>
      </div>
      <Progress value={progress} className="h-1.5" />
    </div>
  );
}

function PdpItemRow({ item }: { item: any }) {
  const { getLocalizedField } = useLanguage();

  const statusColors: Record<string, string> = {
    not_started: 'bg-muted text-muted-foreground',
    in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    completed: 'bg-success/10 text-success',
  };

  return (
    <div className="p-3 rounded-lg border hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">
            {getLocalizedField(item, 'title')}
          </p>
          {item.item_type && (
            <Badge variant="outline" className="mt-1 text-xs">
              {item.item_type}
            </Badge>
          )}
        </div>
        <Badge className={`text-xs shrink-0 ${statusColors[item.status] || statusColors.not_started}`}>
          {item.status?.replace(/_/g, ' ')}
        </Badge>
      </div>
    </div>
  );
}
