import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePeople } from '@/hooks/usePeople';
import { useCreateDevelopmentPlan, useUpdateDevelopmentPlan, useDeleteDevelopmentPlan, PDP } from '@/hooks/useDevelopmentPlans';
import { Loader2, Trash2 } from 'lucide-react';

interface PDPFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdp?: PDP | null;
}

export function PDPFormDialog({ open, onOpenChange, pdp }: PDPFormDialogProps) {
  const { t } = useLanguage();
  const { data: people } = usePeople({ person_type: 'staff' });
  const { data: volunteers } = usePeople({ person_type: 'volunteer' });
  const createPDP = useCreateDevelopmentPlan();
  const updatePDP = useUpdateDevelopmentPlan();
  const deletePDP = useDeleteDevelopmentPlan();

  const allPeople = [...(people || []), ...(volunteers || [])].sort((a, b) =>
    `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`)
  );

  const [formData, setFormData] = useState({
    person_id: '',
    plan_title_en: '',
    plan_title_fr: '',
    summary_en: '',
    summary_fr: '',
    start_date: '',
    target_date: '',
    status: 'active' as 'active' | 'completed' | 'on_hold',
  });

  useEffect(() => {
    if (open) {
      if (pdp) {
        setFormData({
          person_id: pdp.person_id,
          plan_title_en: pdp.plan_title_en,
          plan_title_fr: pdp.plan_title_fr || '',
          summary_en: pdp.summary_en || '',
          summary_fr: pdp.summary_fr || '',
          start_date: pdp.start_date || '',
          target_date: pdp.target_date || '',
          status: pdp.status || 'active',
        });
      } else {
        setFormData({
          person_id: '',
          plan_title_en: '',
          plan_title_fr: '',
          summary_en: '',
          summary_fr: '',
          start_date: new Date().toISOString().split('T')[0],
          target_date: '',
          status: 'active',
        });
      }
    }
  }, [pdp, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      person_id: formData.person_id,
      plan_title_en: formData.plan_title_en,
      plan_title_fr: formData.plan_title_fr || null,
      summary_en: formData.summary_en || null,
      summary_fr: formData.summary_fr || null,
      start_date: formData.start_date || null,
      target_date: formData.target_date || null,
      status: formData.status,
    };

    if (pdp) {
      await updatePDP.mutateAsync({ id: pdp.id, ...payload });
    } else {
      await createPDP.mutateAsync(payload);
    }

    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (pdp) {
      await deletePDP.mutateAsync(pdp.id);
      onOpenChange(false);
    }
  };

  const isLoading = createPDP.isPending || updatePDP.isPending || deletePDP.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{pdp ? 'Edit Development Plan' : 'Create Development Plan'}</DialogTitle>
          <DialogDescription>
            {pdp ? 'Update the development plan details' : 'Create a new personal development plan'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Person *</Label>
            <Select
              value={formData.person_id}
              onValueChange={(value) => setFormData({ ...formData, person_id: value })}
              disabled={!!pdp}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a person" />
              </SelectTrigger>
              <SelectContent>
                {allPeople.map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.first_name} {person.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title (English) *</Label>
              <Input
                value={formData.plan_title_en}
                onChange={(e) => setFormData({ ...formData, plan_title_en: e.target.value })}
                placeholder="2025 Growth Plan"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Title (French)</Label>
              <Input
                value={formData.plan_title_fr}
                onChange={(e) => setFormData({ ...formData, plan_title_fr: e.target.value })}
                placeholder="Plan de croissance 2025"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Summary (English)</Label>
            <Textarea
              value={formData.summary_en}
              onChange={(e) => setFormData({ ...formData, summary_en: e.target.value })}
              placeholder="Describe the goals and focus areas for this development plan..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Summary (French)</Label>
            <Textarea
              value={formData.summary_fr}
              onChange={(e) => setFormData({ ...formData, summary_fr: e.target.value })}
              placeholder="Décrivez les objectifs et les domaines prioritaires..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{t('common.startDate')}</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Target Date</Label>
              <Input
                type="date"
                value={formData.target_date}
                onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('common.status')}</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'completed' | 'on_hold') =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t('people.active')}</SelectItem>
                  <SelectItem value="completed">{t('goals.completed')}</SelectItem>
                  <SelectItem value="on_hold">{t('goals.onHold')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <div>
              {pdp && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Plan?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will delete the plan and all its items. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>{t('common.delete')}</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading || !formData.person_id || !formData.plan_title_en}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('common.save')}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
