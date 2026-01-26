import { useState, useCallback } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGoals, Goal } from '@/hooks/useGoals';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { GoalCardSkeleton, ListSkeleton } from '@/components/ui/mobile-skeletons';
import { Plus, Target, Calendar, User, Building, List, GitBranch } from 'lucide-react';
import { GoalFormDialog } from '@/components/goals/GoalFormDialog';
import { GoalCascadeView } from '@/components/goals/GoalCascadeView';
import { useQueryClient } from '@tanstack/react-query';

const currentYear = new Date().getFullYear();

export default function Goals() {
  const { t, getLocalizedField } = useLanguage();
  const queryClient = useQueryClient();
  const [year, setYear] = useState(currentYear);
  const [level, setLevel] = useState('all');
  const [status, setStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'cascade'>('list');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const { data: goals, isLoading } = useGoals({
    year,
    goal_level: level,
    status: status,
  });

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['goals'] });
  }, [queryClient]);

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingGoal(null);
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'church':
        return <Building className="h-4 w-4" />;
      case 'ministry':
        return <Building className="h-4 w-4" />;
      case 'individual':
        return <User className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'church':
        return 'bg-accent/10 text-accent';
      case 'ministry':
        return 'bg-info/10 text-info';
      case 'individual':
        return 'bg-success/10 text-success';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <MainLayout title={t('goals.title')} subtitle={t('goals.subtitle')}>
      <PullToRefresh onRefresh={handleRefresh} className="min-h-[calc(100vh-12rem)]">
        <div className="space-y-6 animate-fade-in">
        <PageHeader
          title={t('goals.title')}
          subtitle={t('goals.subtitle')}
          actions={
            <div className="flex items-center gap-3">
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
                <TabsList>
                  <TabsTrigger value="list" className="gap-1.5">
                    <List className="h-4 w-4" />
                    <span className="hidden sm:inline">List</span>
                  </TabsTrigger>
                  <TabsTrigger value="cascade" className="gap-1.5">
                    <GitBranch className="h-4 w-4" />
                    <span className="hidden sm:inline">Cascade</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Button onClick={() => setIsFormOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                {t('goals.addGoal')}
              </Button>
            </div>
          }
        />

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder={t('common.year')} />
                </SelectTrigger>
                <SelectContent>
                  {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  <SelectItem value="church">{t('goals.church')}</SelectItem>
                  <SelectItem value="ministry">{t('goals.ministry')}</SelectItem>
                  <SelectItem value="department">{t('goals.department')}</SelectItem>
                  <SelectItem value="individual">{t('goals.individual')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder={t('common.status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  <SelectItem value="not_started">{t('goals.notStarted')}</SelectItem>
                  <SelectItem value="in_progress">{t('goals.inProgress')}</SelectItem>
                  <SelectItem value="completed">{t('goals.completed')}</SelectItem>
                  <SelectItem value="on_hold">{t('goals.onHold')}</SelectItem>
                  <SelectItem value="cancelled">{t('goals.cancelled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Goals Display */}
        {isLoading ? (
          <ListSkeleton count={4} ItemComponent={GoalCardSkeleton} />
        ) : goals && goals.length > 0 ? (
          viewMode === 'cascade' ? (
            <GoalCascadeView goals={goals} onGoalClick={handleEdit} />
          ) : (
            <div className="space-y-4">
              {goals.map((goal) => (
                <Card
                  key={goal.id}
                  className="cursor-pointer transition-all hover:shadow-md"
                  onClick={() => handleEdit(goal)}
                >
                <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${getLevelColor(goal.goal_level)}`}>
                            {getLevelIcon(goal.goal_level)}
                            {t(`goals.${goal.goal_level}`)}
                          </span>
                          <StatusBadge status={goal.status} />
                        </div>
                        <h3 className="font-medium text-base sm:text-lg text-foreground leading-snug">
                          {getLocalizedField(goal, 'title')}
                        </h3>
                        {getLocalizedField(goal, 'description') && (
                          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                            {getLocalizedField(goal, 'description')}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          {goal.owner_person && (
                            <span className="flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 shrink-0" />
                              {goal.owner_person.first_name} {goal.owner_person.last_name}
                            </span>
                          )}
                          {goal.due_date && (
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 shrink-0" />
                              {new Date(goal.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:min-w-[100px]">
                        <div className="text-xl sm:text-2xl font-bold text-foreground">
                          {goal.progress_percent}%
                        </div>
                        <Progress value={goal.progress_percent} className="h-2 w-24 sm:w-full" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : (
          <EmptyState
            icon={<Target className="h-16 w-16" />}
            title={t('common.noResults')}
            description="No goals found for the selected filters"
            action={{
              label: t('goals.addGoal'),
              onClick: () => setIsFormOpen(true),
            }}
          />
        )}
        </div>
      </PullToRefresh>

      <GoalFormDialog
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        goal={editingGoal}
      />
    </MainLayout>
  );
}
