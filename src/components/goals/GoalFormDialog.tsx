import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Goal, useCreateGoal, useUpdateGoal, useDeleteGoal, useGoals } from '@/hooks/useGoals';
import { usePeople } from '@/hooks/usePeople';
import { useMinistries } from '@/hooks/useMinistries';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Loader2, Trash2, GitBranch, Church, Building2, Users, User } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const LEVEL_ORDER = ['church', 'ministry', 'department', 'individual'] as const;

const getLevelIcon = (level: string) => {
  switch (level) {
    case 'church': return <Church className="h-4 w-4" />;
    case 'ministry': return <Building2 className="h-4 w-4" />;
    case 'department': return <Users className="h-4 w-4" />;
    case 'individual': return <User className="h-4 w-4" />;
    default: return null;
  }
};

interface GoalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal | null;
  presetLevel?: 'church' | 'ministry' | 'individual';
}

const currentYear = new Date().getFullYear();

export function GoalFormDialog({ open, onOpenChange, goal, presetLevel }: GoalFormDialogProps) {
  const { t } = useLanguage();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const { data: people } = usePeople();
  const { data: ministries } = useMinistries();
  const { data: allGoals } = useGoals();
  
  const isEditing = !!goal;

  const [formData, setFormData] = useState({
    title_en: '',
    title_fr: '',
    description_en: '',
    description_fr: '',
    goal_level: (presetLevel || 'individual') as 'church' | 'ministry' | 'department' | 'individual',
    owner_person_id: '',
    owner_ministry_id: '',
    parent_goal_id: '',
    year: currentYear,
    start_date: '',
    due_date: '',
    status: 'not_started' as 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled',
    progress_percent: 0,
    category: 'other' as 'spiritual' | 'operational' | 'financial' | 'growth' | 'training' | 'leadership' | 'discipleship' | 'evangelism' | 'operations' | 'finance' | 'other',
  });

  // Filter parent goals - only allow linking to higher-level goals
  const availableParentGoals = useMemo(() => {
    if (!allGoals) return [];
    const currentLevelIndex = LEVEL_ORDER.indexOf(formData.goal_level);
    return allGoals.filter(g => {
      // Exclude self
      if (goal && g.id === goal.id) return false;
      // Only allow parent goals at higher levels
      const parentLevelIndex = LEVEL_ORDER.indexOf(g.goal_level as any);
      return parentLevelIndex < currentLevelIndex;
    });
  }, [allGoals, formData.goal_level, goal]);

  useEffect(() => {
    if (goal) {
      setFormData({
        title_en: goal.title_en || '',
        title_fr: goal.title_fr || '',
        description_en: goal.description_en || '',
        description_fr: goal.description_fr || '',
        goal_level: goal.goal_level || presetLevel || 'individual',
        owner_person_id: goal.owner_person_id || '',
        owner_ministry_id: goal.owner_ministry_id || '',
        parent_goal_id: goal.parent_goal_id || '',
        year: goal.year || currentYear,
        start_date: goal.start_date || '',
        due_date: goal.due_date || '',
        status: goal.status || 'not_started',
        progress_percent: goal.progress_percent || 0,
        category: goal.category || 'other',
      });
    } else {
      setFormData({
        title_en: '',
        title_fr: '',
        description_en: '',
        description_fr: '',
        goal_level: 'individual',
        owner_person_id: '',
        owner_ministry_id: '',
        parent_goal_id: '',
        year: currentYear,
        start_date: '',
        due_date: '',
        status: 'not_started',
        progress_percent: 0,
        category: 'other',
      });
    }
  }, [goal, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      owner_person_id: formData.owner_person_id || null,
      owner_ministry_id: formData.owner_ministry_id || null,
      parent_goal_id: formData.parent_goal_id || null,
      start_date: formData.start_date || null,
      due_date: formData.due_date || null,
    };

    if (isEditing && goal) {
      await updateGoal.mutateAsync({ id: goal.id, ...payload });
    } else {
      await createGoal.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (goal) {
      await deleteGoal.mutateAsync(goal.id);
      onOpenChange(false);
    }
  };

  const isLoading = createGoal.isPending || updateGoal.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {isEditing ? 'Edit Goal' : t('goals.addGoal')}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update goal details' : 'Create a new goal'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title - English */}
          <div className="space-y-2">
            <Label htmlFor="title_en">Title (English) *</Label>
            <Input
              id="title_en"
              value={formData.title_en}
              onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
              placeholder="Goal title"
              required
            />
          </div>

          {/* Title - French */}
          <div className="space-y-2">
            <Label htmlFor="title_fr">Title (Français)</Label>
            <Input
              id="title_fr"
              value={formData.title_fr}
              onChange={(e) => setFormData({ ...formData, title_fr: e.target.value })}
              placeholder="Titre de l'objectif"
            />
          </div>

          {/* Description */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Description (English)</Label>
              <Textarea
                value={formData.description_en}
                onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                placeholder="Goal description..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Description (Français)</Label>
              <Textarea
                value={formData.description_fr}
                onChange={(e) => setFormData({ ...formData, description_fr: e.target.value })}
                placeholder="Description de l'objectif..."
                rows={3}
              />
            </div>
          </div>

          {/* Level and Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Goal Level *</Label>
              <Select
                value={formData.goal_level}
                onValueChange={(value) => setFormData({ ...formData, goal_level: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="church">{t('goals.church')}</SelectItem>
                  <SelectItem value="ministry">{t('goals.ministry')}</SelectItem>
                  <SelectItem value="department">{t('goals.department')}</SelectItem>
                  <SelectItem value="individual">{t('goals.individual')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('common.category')}</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="discipleship">Discipleship</SelectItem>
                  <SelectItem value="evangelism">Evangelism</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Parent Goal (Cascade Link) */}
          {formData.goal_level !== 'church' && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                Parent Goal (Cascade Link)
              </Label>
              <Select
                value={formData.parent_goal_id}
                onValueChange={(value) => setFormData({ ...formData, parent_goal_id: value === 'none' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Link to a higher-level goal (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No parent goal</SelectItem>
                  {availableParentGoals.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      <div className="flex items-center gap-2">
                        {getLevelIcon(g.goal_level)}
                        <span className="capitalize text-xs text-muted-foreground">[{g.goal_level}]</span>
                        <span>{g.title_en}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Link this goal to a higher-level objective to show how it contributes to organizational priorities.
              </p>
            </div>
          )}

          {/* Owner */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Owner (Person)</Label>
              <Select
                value={formData.owner_person_id}
                onValueChange={(value) => setFormData({ ...formData, owner_person_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select person" />
                </SelectTrigger>
                <SelectContent>
                  {people?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.first_name} {p.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Owner (Ministry)</Label>
              <Select
                value={formData.owner_ministry_id}
                onValueChange={(value) => setFormData({ ...formData, owner_ministry_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select ministry" />
                </SelectTrigger>
                <SelectContent>
                  {ministries?.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{t('common.year')}</Label>
              <Select
                value={formData.year.toString()}
                onValueChange={(value) => setFormData({ ...formData, year: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map((y) => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('common.startDate')}</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('common.dueDate')}</Label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>

          {/* Status and Progress */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('common.status')}</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">{t('goals.notStarted')}</SelectItem>
                  <SelectItem value="in_progress">{t('goals.inProgress')}</SelectItem>
                  <SelectItem value="completed">{t('goals.completed')}</SelectItem>
                  <SelectItem value="on_hold">{t('goals.onHold')}</SelectItem>
                  <SelectItem value="cancelled">{t('goals.cancelled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('common.progress')}: {formData.progress_percent}%</Label>
              <Slider
                value={[formData.progress_percent]}
                onValueChange={([value]) => setFormData({ ...formData, progress_percent: value })}
                max={100}
                step={5}
                className="mt-3"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            {isEditing ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('common.delete')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Goal</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this goal? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      {t('common.delete')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('common.save')}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
