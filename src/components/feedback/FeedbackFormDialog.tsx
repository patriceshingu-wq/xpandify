import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateFeedback } from '@/hooks/useFeedback';
import { usePeople } from '@/hooks/usePeople';

interface FeedbackFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPersonId?: string;
}

interface FeedbackFormData {
  person_id: string;
  feedback_type: string;
  title_en: string;
  title_fr: string;
  content_en: string;
  content_fr: string;
  visible_to_person: boolean;
}

export function FeedbackFormDialog({ open, onOpenChange, defaultPersonId }: FeedbackFormDialogProps) {
  const { t, language } = useLanguage();
  const { person } = useAuth();
  const createFeedback = useCreateFeedback();
  const { data: people } = usePeople({});

  const { register, handleSubmit, reset, setValue, watch } = useForm<FeedbackFormData>({
    defaultValues: {
      person_id: '',
      feedback_type: 'encouragement',
      title_en: '',
      title_fr: '',
      content_en: '',
      content_fr: '',
      visible_to_person: true,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        person_id: defaultPersonId || '',
        feedback_type: 'encouragement',
        title_en: '',
        title_fr: '',
        content_en: '',
        content_fr: '',
        visible_to_person: true,
      });
    }
  }, [open, reset, defaultPersonId]);

  const onSubmit = async (data: FeedbackFormData) => {
    if (!person) return;

    const feedbackData = {
      person_id: data.person_id,
      given_by_id: person.id,
      feedback_type: data.feedback_type as any,
      title_en: data.title_en || null,
      title_fr: data.title_fr || null,
      content_en: data.content_en || null,
      content_fr: data.content_fr || null,
      visible_to_person: data.visible_to_person,
    };

    await createFeedback.mutateAsync(feedbackData);
    onOpenChange(false);
  };

  const isLoading = createFeedback.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('feedback.addFeedback')}</DialogTitle>
          <DialogDescription>{t('feedback.addFeedbackDescription')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('feedback.recipient')}</Label>
            <Select value={watch('person_id')} onValueChange={(v) => setValue('person_id', v)}>
              <SelectTrigger>
                <SelectValue placeholder={t('feedback.selectPerson')} />
              </SelectTrigger>
              <SelectContent>
                {people?.filter(p => p.id !== person?.id).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.preferred_name || p.first_name} {p.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('common.type')}</Label>
            <Select value={watch('feedback_type')} onValueChange={(v) => setValue('feedback_type', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="encouragement">{t('feedback.encouragement')}</SelectItem>
                <SelectItem value="coaching">{t('feedback.coaching')}</SelectItem>
                <SelectItem value="concern">{t('feedback.concern')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title_en">{t('feedback.titleEn')}</Label>
            <Textarea id="title_en" {...register('title_en')} rows={1} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content_en">{t('feedback.contentEn')}</Label>
            <Textarea id="content_en" {...register('content_en')} rows={4} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title_fr">{t('feedback.titleFr')}</Label>
            <Textarea id="title_fr" {...register('title_fr')} rows={1} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content_fr">{t('feedback.contentFr')}</Label>
            <Textarea id="content_fr" {...register('content_fr')} rows={4} />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label htmlFor="visible_to_person">{t('feedback.visibleToPerson')}</Label>
              <p className="text-xs text-muted-foreground">{t('feedback.visibleToPersonDescription')}</p>
            </div>
            <Switch
              id="visible_to_person"
              checked={watch('visible_to_person')}
              onCheckedChange={(checked) => setValue('visible_to_person', checked)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading || !watch('person_id')}>
              {isLoading ? t('common.loading') : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
