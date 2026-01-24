import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Review, useCreateReview, useUpdateReview } from '@/hooks/useReviews';
import { usePeople } from '@/hooks/usePeople';
import { format } from 'date-fns';

interface ReviewFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: Review | null;
}

interface ReviewFormData {
  person_id: string;
  period_label: string;
  start_period_date: string;
  end_period_date: string;
  overall_rating: number;
  spiritual_health_rating: number;
  ministry_effectiveness_rating: number;
  character_rating: number;
  skills_rating: number;
  summary_en: string;
  summary_fr: string;
}

export function ReviewFormDialog({ open, onOpenChange, review }: ReviewFormDialogProps) {
  const { t } = useLanguage();
  const { person } = useAuth();
  const createReview = useCreateReview();
  const updateReview = useUpdateReview();
  const { data: people } = usePeople({});

  const { register, handleSubmit, reset, setValue, watch } = useForm<ReviewFormData>({
    defaultValues: {
      person_id: '',
      period_label: '',
      start_period_date: '',
      end_period_date: '',
      overall_rating: 3,
      spiritual_health_rating: 3,
      ministry_effectiveness_rating: 3,
      character_rating: 3,
      skills_rating: 3,
      summary_en: '',
      summary_fr: '',
    },
  });

  useEffect(() => {
    if (review) {
      reset({
        person_id: review.person_id,
        period_label: review.period_label || '',
        start_period_date: review.start_period_date || '',
        end_period_date: review.end_period_date || '',
        overall_rating: review.overall_rating || 3,
        spiritual_health_rating: review.spiritual_health_rating || 3,
        ministry_effectiveness_rating: review.ministry_effectiveness_rating || 3,
        character_rating: review.character_rating || 3,
        skills_rating: review.skills_rating || 3,
        summary_en: review.summary_en || '',
        summary_fr: review.summary_fr || '',
      });
    } else {
      reset({
        person_id: '',
        period_label: `${new Date().getFullYear()} Annual Review`,
        start_period_date: `${new Date().getFullYear()}-01-01`,
        end_period_date: `${new Date().getFullYear()}-12-31`,
        overall_rating: 3,
        spiritual_health_rating: 3,
        ministry_effectiveness_rating: 3,
        character_rating: 3,
        skills_rating: 3,
        summary_en: '',
        summary_fr: '',
      });
    }
  }, [review, reset]);

  const onSubmit = async (data: ReviewFormData) => {
    if (!person) return;

    const reviewData = {
      person_id: data.person_id,
      reviewer_id: person.id,
      period_label: data.period_label || null,
      start_period_date: data.start_period_date || null,
      end_period_date: data.end_period_date || null,
      overall_rating: data.overall_rating,
      spiritual_health_rating: data.spiritual_health_rating,
      ministry_effectiveness_rating: data.ministry_effectiveness_rating,
      character_rating: data.character_rating,
      skills_rating: data.skills_rating,
      summary_en: data.summary_en || null,
      summary_fr: data.summary_fr || null,
    };

    if (review) {
      await updateReview.mutateAsync({ id: review.id, ...reviewData });
    } else {
      await createReview.mutateAsync(reviewData);
    }
    onOpenChange(false);
  };

  const isLoading = createReview.isPending || updateReview.isPending;

  const ratingOptions = [1, 2, 3, 4, 5];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{review ? t('reviews.editReview') : t('reviews.addReview')}</DialogTitle>
          <DialogDescription>
            {review ? t('reviews.editReviewDescription') : t('reviews.addReviewDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('reviews.person')}</Label>
            <Select 
              value={watch('person_id')} 
              onValueChange={(v) => setValue('person_id', v)}
              disabled={!!review}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('reviews.selectPerson')} />
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
            <Label htmlFor="period_label">{t('reviews.periodLabel')}</Label>
            <Input id="period_label" {...register('period_label')} placeholder="2024 Annual Review" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_period_date">{t('common.startDate')}</Label>
              <Input id="start_period_date" type="date" {...register('start_period_date')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_period_date">{t('common.endDate')}</Label>
              <Input id="end_period_date" type="date" {...register('end_period_date')} />
            </div>
          </div>

          <div className="space-y-3 p-3 border rounded-lg">
            <Label className="text-base font-medium">{t('reviews.ratings')}</Label>
            
            {[
              { key: 'overall_rating', label: 'reviews.overallRating' },
              { key: 'spiritual_health_rating', label: 'reviews.spiritualHealth' },
              { key: 'ministry_effectiveness_rating', label: 'reviews.ministryEffectiveness' },
              { key: 'character_rating', label: 'reviews.character' },
              { key: 'skills_rating', label: 'reviews.skills' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <Label className="text-sm">{t(label)}</Label>
                <div className="flex gap-1">
                  {ratingOptions.map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setValue(key as keyof ReviewFormData, rating)}
                      className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                        watch(key as keyof ReviewFormData) === rating
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary_en">{t('reviews.summaryEn')}</Label>
            <Textarea id="summary_en" {...register('summary_en')} rows={4} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary_fr">{t('reviews.summaryFr')}</Label>
            <Textarea id="summary_fr" {...register('summary_fr')} rows={4} />
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
