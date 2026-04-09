import { useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Review, useUpdateReview } from '@/hooks/useReviews';
import { UserCheck, Star } from 'lucide-react';

interface SelfAssessmentTabProps {
  review: Review;
}

interface SelfAssessmentFormData {
  self_overall_rating: number;
  self_spiritual_health_rating: number;
  self_ministry_effectiveness_rating: number;
  self_character_rating: number;
  self_skills_rating: number;
  self_summary_en: string;
  self_summary_fr: string;
}

const ratingOptions = [1, 2, 3, 4, 5];

const ratingDimensions = [
  { key: 'overall_rating', label: 'reviews.overallRating' },
  { key: 'spiritual_health_rating', label: 'reviews.spiritualHealth' },
  { key: 'ministry_effectiveness_rating', label: 'reviews.ministryEffectiveness' },
  { key: 'character_rating', label: 'reviews.character' },
  { key: 'skills_rating', label: 'reviews.skills' },
] as const;

export function SelfAssessmentTab({ review }: SelfAssessmentTabProps) {
  const { t } = useLanguage();
  const { person } = useAuth();
  const updateReview = useUpdateReview();

  const isSelf = person?.id === review.person_id;
  const isReviewer = person?.id === review.reviewer_id;
  const selfSubmitted = !!review.self_submitted_at;

  const { setValue, watch, handleSubmit, reset } = useForm<SelfAssessmentFormData>({
    defaultValues: {
      self_overall_rating: 3,
      self_spiritual_health_rating: 3,
      self_ministry_effectiveness_rating: 3,
      self_character_rating: 3,
      self_skills_rating: 3,
      self_summary_en: '',
      self_summary_fr: '',
    },
  });

  useEffect(() => {
    reset({
      self_overall_rating: (review as any).self_overall_rating || 3,
      self_spiritual_health_rating: (review as any).self_spiritual_health_rating || 3,
      self_ministry_effectiveness_rating: (review as any).self_ministry_effectiveness_rating || 3,
      self_character_rating: (review as any).self_character_rating || 3,
      self_skills_rating: (review as any).self_skills_rating || 3,
      self_summary_en: (review as any).self_summary_en || '',
      self_summary_fr: (review as any).self_summary_fr || '',
    });
  }, [review, reset]);

  const onSubmit = async (data: SelfAssessmentFormData) => {
    await updateReview.mutateAsync({
      id: review.id,
      ...data,
      self_submitted_at: new Date().toISOString(),
    } as any);
  };

  // Comparison view for reviewer
  if (isReviewer && selfSubmitted) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <UserCheck className="h-4 w-4" />
          <span>Self-assessment submitted</span>
        </div>

        <div className="space-y-3 border rounded-lg p-4">
          <Label className="text-base font-medium">Rating Comparison</Label>
          <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-2 items-center text-sm">
            <div className="font-medium text-muted-foreground">Dimension</div>
            <div className="font-medium text-center w-16">Self</div>
            <div className="font-medium text-center w-16">Reviewer</div>
            {ratingDimensions.map(({ key, label }) => {
              const selfVal = (review as any)[`self_${key}`] as number | null;
              const reviewerVal = (review as any)[key] as number | null;
              const diff = selfVal && reviewerVal ? selfVal - reviewerVal : 0;
              return (
                <div key={key} className="contents">
                  <div>{t(label)}</div>
                  <div className="text-center">
                    <Badge variant="outline">{selfVal || '—'}</Badge>
                  </div>
                  <div className="text-center">
                    <Badge variant={diff !== 0 ? 'secondary' : 'outline'}>
                      {reviewerVal || '—'}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {((review as any).self_summary_en || (review as any).self_summary_fr) && (
          <div className="space-y-2 border rounded-lg p-4">
            <Label className="text-base font-medium">Self-Assessment Summary</Label>
            {(review as any).self_summary_en && (
              <div>
                <Label className="text-xs text-muted-foreground">English</Label>
                <p className="text-sm whitespace-pre-wrap">{(review as any).self_summary_en}</p>
              </div>
            )}
            {(review as any).self_summary_fr && (
              <div>
                <Label className="text-xs text-muted-foreground">Français</Label>
                <p className="text-sm whitespace-pre-wrap">{(review as any).self_summary_fr}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Self-assessment form for the person being reviewed
  if (isSelf) {
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {selfSubmitted && (
          <Badge variant="secondary" className="gap-1">
            <UserCheck className="h-3 w-3" />
            Submitted
          </Badge>
        )}

        <div className="space-y-3 p-3 border rounded-lg">
          <Label className="text-base font-medium">Self-Ratings</Label>
          {ratingDimensions.map(({ key, label }) => {
            const selfKey = `self_${key}` as keyof SelfAssessmentFormData;
            return (
              <div key={key} className="flex items-center justify-between">
                <Label className="text-sm">{t(label)}</Label>
                <div className="flex gap-1">
                  {ratingOptions.map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setValue(selfKey, rating)}
                      disabled={selfSubmitted}
                      className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                        watch(selfKey) === rating
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      } disabled:opacity-50`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-2">
          <Label>Summary (English)</Label>
          <Textarea
            value={watch('self_summary_en')}
            onChange={(e) => setValue('self_summary_en', e.target.value)}
            rows={3}
            disabled={selfSubmitted}
          />
        </div>

        <div className="space-y-2">
          <Label>Résumé (Français)</Label>
          <Textarea
            value={watch('self_summary_fr')}
            onChange={(e) => setValue('self_summary_fr', e.target.value)}
            rows={3}
            disabled={selfSubmitted}
          />
        </div>

        {!selfSubmitted && (
          <Button type="submit" disabled={updateReview.isPending}>
            <Star className="h-4 w-4 mr-2" />
            {updateReview.isPending ? t('common.loading') : 'Submit Self-Assessment'}
          </Button>
        )}
      </form>
    );
  }

  // Not the person or reviewer
  return (
    <div className="text-center py-8 text-muted-foreground">
      <UserCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
      <p>{selfSubmitted ? 'Self-assessment has been submitted.' : 'Waiting for self-assessment.'}</p>
    </div>
  );
}
