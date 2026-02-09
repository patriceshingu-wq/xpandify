import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, BookOpen } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDevelopmentPlans } from '@/hooks/useDevelopmentPlans';
import { useGoals } from '@/hooks/useGoals';
import { useCreateAgendaItem, useMeetingAgendaItems } from '@/hooks/useMeetings';

interface AttachPDPDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingId: string;
  personId: string;
}

export function AttachPDPDialog({ open, onOpenChange, meetingId, personId }: AttachPDPDialogProps) {
  const { t, getLocalizedField } = useLanguage();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const { data: pdps, isLoading: pdpsLoading } = useDevelopmentPlans({ person_id: personId, status: 'active' });
  const { data: existingAgendaItems } = useMeetingAgendaItems(meetingId);
  const createAgendaItem = useCreateAgendaItem();

  const activePDP = pdps?.[0];
  
  // Use goals filtered by pdp_id instead of pdp_items
  const { data: pdpGoals, isLoading: goalsLoading } = useGoals({ pdp_id: activePDP?.id });

  const isLoading = pdpsLoading || goalsLoading;

  // Get linked goal IDs from existing agenda items
  const linkedGoalIds = existingAgendaItems
    ?.filter(item => item.linked_goal_id)
    .map(item => item.linked_goal_id) || [];

  const availableItems = (pdpGoals || []).filter(goal => 
    !linkedGoalIds.includes(goal.id) && 
    goal.status !== 'completed' && 
    goal.status !== 'cancelled'
  );

  const handleToggleItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleAttach = async () => {
    const maxOrder = existingAgendaItems?.reduce((max, item) => Math.max(max, item.order_index || 0), 0) || 0;

    for (let i = 0; i < selectedItems.length; i++) {
      const goalId = selectedItems[i];
      const goal = pdpGoals?.find(g => g.id === goalId);
      if (!goal) continue;

      await createAgendaItem.mutateAsync({
        meeting_id: meetingId,
        topic_en: `PDP: ${goal.title_en}`,
        topic_fr: goal.title_fr ? `PDP: ${goal.title_fr}` : null,
        section_type: 'development_training' as any,
        order_index: maxOrder + i + 1,
        linked_goal_id: goalId,
      });
    }

    setSelectedItems([]);
    onOpenChange(false);
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'in_progress': return 'bg-info/10 text-info';
      case 'not_started': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getItemTypeLabel = (type: string | null) => {
    switch (type) {
      case 'course': return 'Course';
      case 'mentoring': return 'Mentoring';
      case 'project': return 'Project';
      case 'reading': return 'Reading';
      default: return 'Other';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Attach PDP Items to Meeting
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : !activePDP ? (
          <p className="text-center text-muted-foreground py-8">
            No active development plan found for this person.
          </p>
        ) : availableItems.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No PDP items available to attach. All items are either completed, cancelled, or already linked.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-3">
              From: {getLocalizedField(activePDP, 'plan_title')}
            </p>
            <ScrollArea className="max-h-[400px] pr-4">
              <div className="space-y-3">
                {availableItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleToggleItem(item.id)}
                  >
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={() => handleToggleItem(item.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium">{getLocalizedField(item, 'title')}</p>
                        <div className="flex gap-2">
                          {item.item_type && (
                            <Badge variant="outline">{getItemTypeLabel(item.item_type)}</Badge>
                          )}
                          <Badge className={getStatusColor(item.status)}>
                            {item.status?.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                      {item.due_date && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Due: {new Date(item.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAttach} 
            disabled={selectedItems.length === 0 || createAgendaItem.isPending}
          >
            {createAgendaItem.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Attach {selectedItems.length > 0 && `(${selectedItems.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
