import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Target, BookOpen, ChevronDown, ChevronUp, Save, Loader2 } from 'lucide-react';
import { useGoal, useUpdateGoal } from '@/hooks/useGoals';
import { useDevelopmentPlan, useUpdatePDPItem } from '@/hooks/useDevelopmentPlans';
import { useLanguage } from '@/contexts/LanguageContext';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface LinkedGoalProgressProps {
  goalId: string;
  canEdit: boolean;
}

const goalStatusOptions = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'cancelled', label: 'Cancelled' },
];

const statusColors: Record<string, string> = {
  not_started: 'bg-muted text-muted-foreground',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  on_hold: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

export function LinkedGoalProgress({ goalId, canEdit }: LinkedGoalProgressProps) {
  const { getLocalizedField } = useLanguage();
  const { data: goal, isLoading } = useGoal(goalId);
  const updateGoal = useUpdateGoal();
  
  const [isOpen, setIsOpen] = useState(false);
  const [localProgress, setLocalProgress] = useState<number | null>(null);
  const [localStatus, setLocalStatus] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  if (isLoading || !goal) {
    return (
      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
        <Target className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading goal...</span>
      </div>
    );
  }

  const currentProgress = localProgress ?? goal.progress_percent ?? 0;
  const currentStatus = localStatus ?? goal.status ?? 'not_started';

  const handleProgressChange = (value: number[]) => {
    setLocalProgress(value[0]);
    setHasChanges(true);
  };

  const handleStatusChange = (value: string) => {
    setLocalStatus(value);
    setHasChanges(true);
    // Auto-set progress for completed/cancelled
    if (value === 'completed') {
      setLocalProgress(100);
    }
  };

  const handleSave = async () => {
    await updateGoal.mutateAsync({
      id: goalId,
      progress_percent: currentProgress,
      status: currentStatus as any,
    });
    setHasChanges(false);
    setLocalProgress(null);
    setLocalStatus(null);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-3">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Target className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-medium truncate">
                  {getLocalizedField(goal, 'title')}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge className={`text-xs ${statusColors[currentStatus]}`}>
                  {currentStatus.replace(/_/g, ' ')}
                </Badge>
                <span className="text-xs text-muted-foreground">{currentProgress}%</span>
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="pt-3 space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{currentProgress}%</span>
              </div>
              <Progress value={currentProgress} className="h-2" />
              {canEdit && (
                <Slider
                  value={[currentProgress]}
                  onValueChange={handleProgressChange}
                  max={100}
                  step={5}
                  className="mt-2"
                />
              )}
            </div>

            {canEdit && (
              <div className="flex items-center gap-2">
                <Select value={currentStatus} onValueChange={handleStatusChange}>
                  <SelectTrigger className="flex-1 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {goalStatusOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {hasChanges && (
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={updateGoal.isPending}
                    className="h-8"
                  >
                    {updateGoal.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            )}
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
}

interface LinkedPDPItemProgressProps {
  pdpItemId: string;
  pdpId: string;
  canEdit: boolean;
}

const pdpItemStatusOptions = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'dropped', label: 'Dropped' },
];

export function LinkedPDPItemProgress({ pdpItemId, pdpId, canEdit }: LinkedPDPItemProgressProps) {
  const { getLocalizedField } = useLanguage();
  const { data: pdp, isLoading } = useDevelopmentPlan(pdpId);
  const updatePDPItem = useUpdatePDPItem();
  
  const [isOpen, setIsOpen] = useState(false);
  const [localStatus, setLocalStatus] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const pdpItem = pdp?.items?.find(item => item.id === pdpItemId);

  if (isLoading || !pdpItem) {
    return (
      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
        <BookOpen className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading development item...</span>
      </div>
    );
  }

  const currentStatus = localStatus ?? pdpItem.status ?? 'not_started';

  const handleStatusChange = (value: string) => {
    setLocalStatus(value);
    setHasChanges(true);
  };

  const handleSave = async () => {
    await updatePDPItem.mutateAsync({
      id: pdpItemId,
      pdp_id: pdpId,
      status: currentStatus as any,
    });
    setHasChanges(false);
    setLocalStatus(null);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-accent/20 bg-accent/5">
        <CardContent className="p-3">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <BookOpen className="h-4 w-4 text-accent shrink-0" />
                <span className="text-sm font-medium truncate">
                  {getLocalizedField(pdpItem, 'title')}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge className={`text-xs ${statusColors[currentStatus]}`}>
                  {currentStatus.replace(/_/g, ' ')}
                </Badge>
                {pdpItem.item_type && (
                  <Badge variant="outline" className="text-xs">
                    {pdpItem.item_type}
                  </Badge>
                )}
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="pt-3 space-y-3">
            {pdpItem.due_date && (
              <p className="text-xs text-muted-foreground">
                Due: {new Date(pdpItem.due_date).toLocaleDateString()}
              </p>
            )}

            {canEdit && (
              <div className="flex items-center gap-2">
                <Select value={currentStatus} onValueChange={handleStatusChange}>
                  <SelectTrigger className="flex-1 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pdpItemStatusOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {hasChanges && (
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={updatePDPItem.isPending}
                    className="h-8"
                  >
                    {updatePDPItem.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            )}
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
}
