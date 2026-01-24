import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { useLanguage } from '@/contexts/LanguageContext';
import { Survey, useCreateSurvey, useUpdateSurvey } from '@/hooks/useSurveys';

interface SurveyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  survey: Survey | null;
}

interface SurveyFormData {
  title: string;
  description: string;
  target_group: string;
  is_active: boolean;
}

export function SurveyFormDialog({ open, onOpenChange, survey }: SurveyFormDialogProps) {
  const { t } = useLanguage();
  const createSurvey = useCreateSurvey();
  const updateSurvey = useUpdateSurvey();

  const { register, handleSubmit, reset, setValue, watch } = useForm<SurveyFormData>({
    defaultValues: {
      title: '',
      description: '',
      target_group: 'all_staff',
      is_active: true,
    },
  });

  useEffect(() => {
    if (survey) {
      reset({
        title: survey.title,
        description: survey.description || '',
        target_group: survey.target_group || 'all_staff',
        is_active: survey.is_active ?? true,
      });
    } else {
      reset({
        title: '',
        description: '',
        target_group: 'all_staff',
        is_active: true,
      });
    }
  }, [survey, reset]);

  const onSubmit = async (data: SurveyFormData) => {
    const surveyData = {
      title: data.title,
      description: data.description || null,
      target_group: data.target_group as any,
      is_active: data.is_active,
    };

    if (survey) {
      await updateSurvey.mutateAsync({ id: survey.id, ...surveyData });
    } else {
      await createSurvey.mutateAsync(surveyData);
    }
    onOpenChange(false);
  };

  const isLoading = createSurvey.isPending || updateSurvey.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{survey ? t('surveys.editSurvey') : t('surveys.addSurvey')}</DialogTitle>
          <DialogDescription>
            {survey ? t('surveys.editSurveyDescription') : t('surveys.addSurveyDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t('surveys.surveyTitle')}</Label>
            <Input id="title" {...register('title', { required: true })} placeholder={t('surveys.titlePlaceholder')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('common.description')}</Label>
            <Textarea id="description" {...register('description')} rows={3} />
          </div>

          <div className="space-y-2">
            <Label>{t('surveys.targetGroup')}</Label>
            <Select value={watch('target_group')} onValueChange={(v) => setValue('target_group', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_staff">{t('surveys.allStaff')}</SelectItem>
                <SelectItem value="all_volunteers">{t('surveys.allVolunteers')}</SelectItem>
                <SelectItem value="custom">{t('surveys.custom')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <Label htmlFor="is_active">{t('surveys.isActive')}</Label>
            <Switch
              id="is_active"
              checked={watch('is_active')}
              onCheckedChange={(checked) => setValue('is_active', checked)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t('common.loading') : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
