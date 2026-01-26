import { useState, useCallback } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useFeedback, Feedback, useDeleteFeedback } from '@/hooks/useFeedback';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { FeedbackFormDialog } from '@/components/feedback/FeedbackFormDialog';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { FeedbackCardSkeleton, ListSkeleton } from '@/components/ui/mobile-skeletons';
import { Plus, MessageSquare, Heart, Lightbulb, AlertCircle, Trash2, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useQueryClient } from '@tanstack/react-query';

const typeIcons: Record<string, React.ReactNode> = {
  encouragement: <Heart className="h-4 w-4 text-success" />,
  coaching: <Lightbulb className="h-4 w-4 text-info" />,
  concern: <AlertCircle className="h-4 w-4 text-warning" />,
};

const typeColors: Record<string, string> = {
  encouragement: 'bg-success/10 text-success border-success/20',
  coaching: 'bg-info/10 text-info border-info/20',
  concern: 'bg-warning/10 text-warning border-warning/20',
};

export default function FeedbackPage() {
  const { t, getLocalizedField } = useLanguage();
  const { isAdminOrSuper, person } = useAuth();
  const queryClient = useQueryClient();
  const [feedbackType, setFeedbackType] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deletingFeedback, setDeletingFeedback] = useState<Feedback | null>(null);

  const { data: feedback, isLoading } = useFeedback({
    feedback_type: feedbackType,
  });

  const deleteFeedback = useDeleteFeedback();

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['feedback'] });
  }, [queryClient]);

  const handleDelete = async () => {
    if (deletingFeedback) {
      await deleteFeedback.mutateAsync(deletingFeedback.id);
      setDeletingFeedback(null);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <MainLayout title={t('feedback.title')} subtitle={t('feedback.subtitle')}>
      <PullToRefresh onRefresh={handleRefresh} className="min-h-[calc(100vh-12rem)]">
        <div className="space-y-6 animate-fade-in">
        <PageHeader
          title={t('feedback.title')}
          subtitle={t('feedback.subtitle')}
          actions={
            <Button onClick={() => setIsFormOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              {t('feedback.addFeedback')}
            </Button>
          }
        />

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={feedbackType} onValueChange={setFeedbackType}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder={t('common.type')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  <SelectItem value="encouragement">{t('feedback.encouragement')}</SelectItem>
                  <SelectItem value="coaching">{t('feedback.coaching')}</SelectItem>
                  <SelectItem value="concern">{t('feedback.concern')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Feedback List */}
        {isLoading ? (
          <ListSkeleton count={3} ItemComponent={FeedbackCardSkeleton} />
        ) : feedback && feedback.length > 0 ? (
          <div className="space-y-4">
            {feedback.map((item) => (
              <Card key={item.id} className="transition-all hover:shadow-md">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="bg-accent/10 text-accent">
                        {item.person ? getInitials(item.person.first_name, item.person.last_name) : '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 space-y-3">
                      {/* Header row */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="space-y-1">
                          <h3 className="font-medium text-foreground text-base">
                            {item.person
                              ? `${item.person.preferred_name || item.person.first_name} ${item.person.last_name}`
                              : t('feedback.unknownPerson')}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {t('feedback.from')} {item.given_by
                              ? `${item.given_by.preferred_name || item.given_by.first_name} ${item.given_by.last_name}`
                              : t('feedback.unknownPerson')}
                            {' • '}
                            {format(new Date(item.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={typeColors[item.feedback_type || 'encouragement']}>
                            {typeIcons[item.feedback_type || 'encouragement']}
                            <span className="ml-1 capitalize">{item.feedback_type}</span>
                          </Badge>
                          {item.visible_to_person ? (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          )}
                          {(isAdminOrSuper || item.given_by?.id === person?.id) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive touch-target"
                              onClick={() => setDeletingFeedback(item)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      {/* Content */}
                      {(item.title_en || item.title_fr) && (
                        <h4 className="font-medium text-foreground">{getLocalizedField(item, 'title')}</h4>
                      )}
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {getLocalizedField(item, 'content') || t('feedback.noContent')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<MessageSquare className="h-16 w-16" />}
            title={t('common.noResults')}
            description={t('feedback.noFeedback')}
            action={{
              label: t('feedback.addFeedback'),
              onClick: () => setIsFormOpen(true),
            }}
          />
        )}
        </div>
      </PullToRefresh>

      <FeedbackFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} />

      <AlertDialog open={!!deletingFeedback} onOpenChange={() => setDeletingFeedback(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('feedback.deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('feedback.deleteWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
