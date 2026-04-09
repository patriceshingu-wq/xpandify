import { useMeetingPrep } from '@/hooks/useMeetingPrep';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCreateAgendaItem } from '@/hooks/useMeetings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Target, MessageSquare, CheckCircle, Plus, AlertTriangle, Clock, Info } from 'lucide-react';
import { format } from 'date-fns';

interface MeetingPrepPanelProps {
  meetingId: string;
  personFocusId: string | undefined;
  organizerId: string | undefined;
  meetingDateTime: string | undefined;
}

export function MeetingPrepPanel({ meetingId, personFocusId, organizerId, meetingDateTime }: MeetingPrepPanelProps) {
  const { getLocalizedField, t } = useLanguage();
  const createAgendaItem = useCreateAgendaItem();
  const { goalChanges, recentFeedback, outstandingActions, lastMeetingDate, isLoading } = useMeetingPrep(
    personFocusId, organizerId, meetingDateTime
  );

  const handleAddAsAgenda = async (topic: string, sectionType: string) => {
    await createAgendaItem.mutateAsync({
      meeting_id: meetingId,
      topic_en: topic,
      section_type: sectionType as any,
      order_index: 999,
    });
  };

  if (!personFocusId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Info className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-muted-foreground">Meeting prep is available for 1:1 meetings with a person focus.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <ScrollArea className="h-[500px] pr-4">
      <div className="space-y-4">
        {/* Last meeting info */}
        <div className="text-sm text-muted-foreground px-1">
          {lastMeetingDate ? (
            <span>Changes since last meeting: {format(new Date(lastMeetingDate), 'MMM d, yyyy')}</span>
          ) : (
            <span>No previous meeting found — showing all current data</span>
          )}
        </div>

        {/* Goal Changes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Goal Progress ({goalChanges.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {goalChanges.length === 0 ? (
              <p className="text-sm text-muted-foreground">No goal changes since last meeting</p>
            ) : (
              goalChanges.map((goal) => (
                <div key={goal.id} className="flex items-center justify-between gap-2 p-2 rounded border">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{getLocalizedField(goal, 'title')}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{goal.status}</Badge>
                      <span className="text-xs text-muted-foreground">{goal.progress_percent ?? 0}%</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    title="Add to agenda"
                    onClick={() => handleAddAsAgenda(`Review: ${goal.title_en}`, 'goals_review')}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Feedback */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Recent Feedback ({recentFeedback.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentFeedback.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent feedback</p>
            ) : (
              recentFeedback.map((fb) => (
                <div key={fb.id} className="flex items-center justify-between gap-2 p-2 rounded border">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{fb.title_en || fb.content_en?.slice(0, 50) || 'Feedback'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs capitalize">{fb.feedback_type}</Badge>
                      {fb.given_by && (
                        <span className="text-xs text-muted-foreground">
                          by {fb.given_by.first_name} {fb.given_by.last_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    title="Add to agenda"
                    onClick={() => handleAddAsAgenda(`Discuss: ${fb.title_en || 'Feedback'}`, 'feedback_coaching')}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Outstanding Action Items */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              Outstanding Actions ({outstandingActions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {outstandingActions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No outstanding action items</p>
            ) : (
              outstandingActions.map((action) => {
                const isOverdue = action.action_due_date && action.action_due_date < today;
                return (
                  <div
                    key={action.id}
                    className={`flex items-center justify-between gap-2 p-2 rounded border ${
                      isOverdue ? 'border-destructive/50 bg-destructive/5' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{action.topic_en}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={isOverdue ? 'destructive' : 'outline'} className="text-xs">
                          {isOverdue ? 'Overdue' : action.action_status}
                        </Badge>
                        {action.action_due_date && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(action.action_due_date), 'MMM d')}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      title="Add to agenda"
                      onClick={() => handleAddAsAgenda(`Follow-up: ${action.topic_en}`, 'action_items')}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
