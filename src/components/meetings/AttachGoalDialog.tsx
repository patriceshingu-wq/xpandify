import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Target } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGoals } from '@/hooks/useGoals';
import { useCreateAgendaItem, useMeetingAgendaItems } from '@/hooks/useMeetings';

interface AttachGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingId: string;
  personId: string;
}

export function AttachGoalDialog({ open, onOpenChange, meetingId, personId }: AttachGoalDialogProps) {
  const { t, getLocalizedField } = useLanguage();
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const { data: goals, isLoading } = useGoals({ owner_person_id: personId });
  const { data: existingItems } = useMeetingAgendaItems(meetingId);
  const createAgendaItem = useCreateAgendaItem();

  // Filter out already linked goals
  const linkedGoalIds = existingItems
    ?.filter(item => (item as any).linked_goal_id)
    .map(item => (item as any).linked_goal_id) || [];

  const availableGoals = goals?.filter(g => 
    !linkedGoalIds.includes(g.id) && 
    g.status !== 'completed' && 
    g.status !== 'cancelled'
  ) || [];

  const handleToggleGoal = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const handleAttach = async () => {
    const maxOrder = existingItems?.reduce((max, item) => Math.max(max, item.order_index || 0), 0) || 0;

    for (let i = 0; i < selectedGoals.length; i++) {
      const goalId = selectedGoals[i];
      const goal = goals?.find(g => g.id === goalId);
      if (!goal) continue;

      await createAgendaItem.mutateAsync({
        meeting_id: meetingId,
        topic_en: `Goal: ${goal.title_en}`,
        topic_fr: goal.title_fr ? `Objectif: ${goal.title_fr}` : null,
        section_type: 'goals_review' as any,
        order_index: maxOrder + i + 1,
        linked_goal_id: goalId,
      });
    }

    setSelectedGoals([]);
    onOpenChange(false);
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'in_progress': return 'bg-info/10 text-info';
      case 'not_started': return 'bg-muted text-muted-foreground';
      case 'on_hold': return 'bg-warning/10 text-warning';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Attach Goals to Meeting
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : availableGoals.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No goals available to attach. All goals are either completed, cancelled, or already linked.
          </p>
        ) : (
          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-3">
              {availableGoals.map((goal) => (
                <div 
                  key={goal.id} 
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleToggleGoal(goal.id)}
                >
                  <Checkbox
                    checked={selectedGoals.includes(goal.id)}
                    onCheckedChange={() => handleToggleGoal(goal.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{getLocalizedField(goal, 'title')}</p>
                      <Badge className={getStatusColor(goal.status)}>
                        {goal.status?.replace('_', ' ')}
                      </Badge>
                    </div>
                    {goal.progress_percent !== null && (
                      <div className="mt-2">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${goal.progress_percent}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{goal.progress_percent}% complete</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAttach} 
            disabled={selectedGoals.length === 0 || createAgendaItem.isPending}
          >
            {createAgendaItem.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Attach {selectedGoals.length > 0 && `(${selectedGoals.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
