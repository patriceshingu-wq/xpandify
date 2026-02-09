import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useReviews, Review, useDeleteReview, useUpdateReview } from '@/hooks/useReviews';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReviewFormDialog } from '@/components/reviews/ReviewFormDialog';
import { FeedbackTab } from '@/components/reviews/FeedbackTab';
import { Plus, ClipboardCheck, Star, Trash2, CheckCircle, Clock, Calendar, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function Reviews() {
  const { t, getLocalizedField } = useLanguage();
  const { isAdminOrSuper, person } = useAuth();
  const [activeTab, setActiveTab] = useState('reviews');
  const [finalizedFilter, setFinalizedFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [deletingReview, setDeletingReview] = useState<Review | null>(null);

  const { data: reviews, isLoading } = useReviews({
    finalized: finalizedFilter === 'all' ? undefined : finalizedFilter === 'finalized',
  });

  const deleteReview = useDeleteReview();
  const updateReview = useUpdateReview();

  const handleEdit = (review: Review) => {
    setEditingReview(review);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingReview(null);
  };

  const handleDelete = async () => {
    if (deletingReview) {
      await deleteReview.mutateAsync(deletingReview.id);
      setDeletingReview(null);
    }
  };

  const handleFinalize = async (review: Review) => {
    await updateReview.mutateAsync({
      id: review.id,
      finalized: true,
      submitted_at: new Date().toISOString(),
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const renderStars = (rating: number | null) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className={`h-3.5 w-3.5 ${star <= (rating || 0) ? 'fill-warning text-warning' : 'text-muted-foreground/30'}`} />
      ))}
    </div>
  );

  return (
    <MainLayout title={t('reviews.title')} subtitle={t('reviews.subtitle')}>
      <div className="space-y-4 md:space-y-6 animate-fade-in">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:inline-flex">
            <TabsTrigger value="reviews" className="gap-1.5 touch-target">
              <ClipboardCheck className="h-4 w-4 shrink-0" />
              <span className="text-sm">{t('reviews.title')}</span>
            </TabsTrigger>
            <TabsTrigger value="feedback" className="gap-1.5 touch-target">
              <MessageSquare className="h-4 w-4 shrink-0" />
              <span className="text-sm">{t('feedback.title')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reviews" className="mt-4 md:mt-6 space-y-6">
            {/* Reviews filters & actions */}
            <div className="flex items-center justify-between gap-4">
              <Select value={finalizedFilter} onValueChange={setFinalizedFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={t('common.status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  <SelectItem value="draft">{t('reviews.draft')}</SelectItem>
                  <SelectItem value="finalized">{t('reviews.finalized')}</SelectItem>
                </SelectContent>
              </Select>
              {isAdminOrSuper && (
                <Button onClick={() => setIsFormOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t('reviews.addReview')}
                </Button>
              )}
            </div>

            {/* Reviews List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="spinner" />
              </div>
            ) : reviews && reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Card key={review.id} className="cursor-pointer transition-all hover:shadow-md" onClick={() => handleEdit(review)}>
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                        <Avatar className="h-12 w-12 shrink-0">
                          <AvatarFallback className="bg-accent/10 text-accent">
                            {review.person ? getInitials(review.person.first_name, review.person.last_name) : '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                            <div className="space-y-1">
                              <h3 className="font-medium text-foreground text-base">
                                {review.person ? `${review.person.preferred_name || review.person.first_name} ${review.person.last_name}` : t('reviews.unknownPerson')}
                              </h3>
                              <p className="text-sm text-muted-foreground">{review.period_label || t('reviews.noPeriod')}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {review.finalized ? (
                                <Badge className="bg-success/10 text-success border-success/20">
                                  <CheckCircle className="h-3 w-3 mr-1" />{t('reviews.finalized')}
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  <Clock className="h-3 w-3 mr-1" />{t('reviews.draft')}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">{t('reviews.overallRating')}:</span>
                              {renderStars(review.overall_rating)}
                            </div>
                            {review.start_period_date && review.end_period_date && (
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5 shrink-0" />
                                <span>{format(new Date(review.start_period_date), 'MMM yyyy')} – {format(new Date(review.end_period_date), 'MMM yyyy')}</span>
                              </div>
                            )}
                          </div>

                          {(review.summary_en || review.summary_fr) && (
                            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                              {getLocalizedField(review, 'summary')}
                            </p>
                          )}

                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 pt-1">
                            <p className="text-xs text-muted-foreground">
                              {t('reviews.reviewedBy')} {review.reviewer ? `${review.reviewer.preferred_name || review.reviewer.first_name} ${review.reviewer.last_name}` : t('reviews.unknownPerson')}
                            </p>
                            <div className="flex-1" />
                            <div className="flex items-center gap-2">
                              {!review.finalized && (review.reviewer?.id === person?.id || isAdminOrSuper) && (
                                <Button size="sm" variant="outline" className="touch-target" onClick={(e) => { e.stopPropagation(); handleFinalize(review); }}>
                                  <CheckCircle className="h-3.5 w-3.5 mr-1" />{t('reviews.finalize')}
                                </Button>
                              )}
                              {isAdminOrSuper && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive touch-target" onClick={(e) => { e.stopPropagation(); setDeletingReview(review); }}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<ClipboardCheck className="h-16 w-16" />}
                title={t('common.noResults')}
                description={t('reviews.noReviews')}
                action={isAdminOrSuper ? { label: t('reviews.addReview'), onClick: () => setIsFormOpen(true) } : undefined}
              />
            )}
          </TabsContent>

          <TabsContent value="feedback" className="mt-4 md:mt-6">
            <FeedbackTab />
          </TabsContent>
        </Tabs>
      </div>

      <ReviewFormDialog open={isFormOpen} onOpenChange={handleCloseForm} review={editingReview} />

      <AlertDialog open={!!deletingReview} onOpenChange={() => setDeletingReview(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('reviews.deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>{t('reviews.deleteWarning')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
