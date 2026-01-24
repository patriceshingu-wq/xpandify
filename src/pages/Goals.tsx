import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGoals, Goal } from '@/hooks/useGoals';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Progress } from '@/components/ui/progress';
import { Plus, Target, Calendar, User, Building } from 'lucide-react';
import { GoalFormDialog } from '@/components/goals/GoalFormDialog';

const currentYear = new Date().getFullYear();

export default function Goals() {
  const { t, getLocalizedField } = useLanguage();
  const [year, setYear] = useState(currentYear);
  const [level, setLevel] = useState('all');
  const [status, setStatus] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const { data: goals, isLoading } = useGoals({
    year,
    goal_level: level,
    status: status,
  });

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
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title={t('goals.title')}
          subtitle={t('goals.subtitle')}
          actions={
            <Button onClick={() => setIsFormOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              {t('goals.addGoal')}
            </Button>
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

        {/* Goals List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner" />
          </div>
        ) : goals && goals.length > 0 ? (
          <div className="space-y-4">
            {goals.map((goal) => (
              <Card
                key={goal.id}
                className="cursor-pointer transition-all hover:shadow-md"
                onClick={() => handleEdit(goal)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${getLevelColor(goal.goal_level)}`}>
                          {getLevelIcon(goal.goal_level)}
                          {t(`goals.${goal.goal_level}`)}
                        </span>
                        <StatusBadge status={goal.status} />
                      </div>
                      <h3 className="font-medium text-lg text-foreground mb-1">
                        {getLocalizedField(goal, 'title')}
                      </h3>
                      {getLocalizedField(goal, 'description') && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {getLocalizedField(goal, 'description')}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {goal.owner_person && (
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {goal.owner_person.first_name} {goal.owner_person.last_name}
                          </span>
                        )}
                        {goal.due_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(goal.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right min-w-[100px]">
                      <div className="text-2xl font-bold text-foreground mb-1">
                        {goal.progress_percent}%
                      </div>
                      <Progress value={goal.progress_percent} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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

      <GoalFormDialog
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        goal={editingGoal}
      />
    </MainLayout>
  );
}
