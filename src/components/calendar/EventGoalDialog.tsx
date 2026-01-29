import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGoals } from '@/hooks/useGoals';
import { useAddEventGoal } from '@/hooks/useEventGoals';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

interface EventGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  existingGoalIds: string[];
}

export default function EventGoalDialog({ open, onOpenChange, eventId, existingGoalIds }: EventGoalDialogProps) {
  const { t, getLocalizedField } = useLanguage();
  const { data: goals, isLoading } = useGoals();
  const addEventGoal = useAddEventGoal();

  const availableGoals = goals?.filter((g) => !existingGoalIds.includes(g.id));

  const handleLinkGoal = async (goalId: string) => {
    await addEventGoal.mutateAsync({ event_id: eventId, goal_id: goalId });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('calendar.linkGoal') || 'Link Goal to Event'}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : availableGoals && availableGoals.length > 0 ? (
          <div className="space-y-2">
            {availableGoals.map((goal) => (
              <div
                key={goal.id}
                className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handleLinkGoal(goal.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{getLocalizedField(goal, 'title')}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{goal.goal_level}</Badge>
                      <Badge variant="secondary" className="text-xs">{goal.status}</Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={addEventGoal.isPending}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLinkGoal(goal.id);
                    }}
                  >
                    {t('calendar.link') || 'Link'}
                  </Button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Progress value={goal.progress_percent || 0} className="flex-1 h-2" />
                  <span className="text-xs text-muted-foreground">{goal.progress_percent || 0}%</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            {t('calendar.noAvailableGoals') || 'No available goals to link'}
          </p>
        )}

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.close') || 'Close'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
