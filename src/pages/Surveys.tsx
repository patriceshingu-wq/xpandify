import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth, AppRoleType } from '@/contexts/AuthContext';
import { useSurveys, Survey, useDeleteSurvey, useUpdateSurvey } from '@/hooks/useSurveys';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { Switch } from '@/components/ui/switch';
import { SurveyFormDialog } from '@/components/surveys/SurveyFormDialog';
import { Plus, BarChart3, Search, Users, Heart, Trash2, MessageCircle, Shield, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const targetIcons: Record<string, React.ReactNode> = {
  all_staff: <Users className="h-4 w-4" />,
  all_volunteers: <Heart className="h-4 w-4" />,
  custom: <Users className="h-4 w-4" />,
};

export default function Surveys() {
  const { t } = useLanguage();
  const { isAdminOrSuper } = useAuth();
  const [search, setSearch] = useState('');
  const [targetGroup, setTargetGroup] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [deletingSurvey, setDeletingSurvey] = useState<Survey | null>(null);

  const { data: surveys, isLoading } = useSurveys({
    search: search || undefined,
    target_group: targetGroup,
  });

  const deleteSurvey = useDeleteSurvey();
  const updateSurvey = useUpdateSurvey();

  const handleEdit = (survey: Survey) => {
    setEditingSurvey(survey);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingSurvey(null);
  };

  const handleDelete = async () => {
    if (deletingSurvey) {
      await deleteSurvey.mutateAsync(deletingSurvey.id);
      setDeletingSurvey(null);
    }
  };

  const handleToggleActive = async (survey: Survey, isActive: boolean) => {
    await updateSurvey.mutateAsync({
      id: survey.id,
      is_active: isActive,
    });
  };

  return (
    <MainLayout title={t('surveys.title')} subtitle={t('surveys.subtitle')}>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title={t('surveys.title')}
          subtitle={t('surveys.subtitle')}
          actions={
            isAdminOrSuper && (
              <Button onClick={() => setIsFormOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                {t('surveys.addSurvey')}
              </Button>
            )
          }
        />

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('surveys.search')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={targetGroup} onValueChange={setTargetGroup}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder={t('surveys.targetGroup')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  <SelectItem value="all_staff">{t('surveys.allStaff')}</SelectItem>
                  <SelectItem value="all_volunteers">{t('surveys.allVolunteers')}</SelectItem>
                  <SelectItem value="custom">{t('surveys.custom')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Surveys Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner" />
          </div>
        ) : surveys && surveys.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {surveys.map((survey) => (
              <Card
                key={survey.id}
                className="cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5"
                onClick={() => handleEdit(survey)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <Badge
                      variant={survey.is_active ? 'default' : 'secondary'}
                      className={survey.is_active ? 'bg-success/10 text-success border-success/20' : ''}
                    >
                      {survey.is_active ? t('surveys.active') : t('surveys.inactive')}
                    </Badge>
                    <div className="flex items-center gap-2">
                      {isAdminOrSuper && (
                        <>
                          <Switch
                            checked={survey.is_active ?? false}
                            onCheckedChange={(checked) => {
                              handleToggleActive(survey, checked);
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingSurvey(survey);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <h3 className="font-medium text-foreground mb-2">{survey.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {survey.description || t('surveys.noDescription')}
                  </p>
                  
                  {/* Role Badges */}
                  {isAdminOrSuper && survey.visible_roles && survey.visible_roles.length > 0 && (
                    <div className="mb-3">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5">
                              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                              <div className="flex flex-wrap gap-1">
                                {survey.visible_roles.slice(0, 2).map((role) => (
                                  <Badge key={role} variant="outline" className="text-xs px-1.5 py-0">
                                    {t(`roles.${role}`)}
                                  </Badge>
                                ))}
                                {survey.visible_roles.length > 2 && (
                                  <Badge variant="outline" className="text-xs px-1.5 py-0">
                                    +{survey.visible_roles.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium mb-1">{t('surveys.visibleToRoles')}:</p>
                            <ul className="text-xs">
                              {survey.visible_roles.map((role) => (
                                <li key={role}>{t(`roles.${role}`)}</li>
                              ))}
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      {targetIcons[survey.target_group || 'all_staff']}
                      <span className="capitalize">{survey.target_group?.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MessageCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{survey.response_count || 0}</span>
                      <span className="text-muted-foreground">{t('surveys.responses')}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    {t('surveys.created')} {format(new Date(survey.created_at), 'MMM d, yyyy')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<BarChart3 className="h-16 w-16" />}
            title={t('common.noResults')}
            description={t('surveys.noSurveys')}
            action={
              isAdminOrSuper
                ? {
                    label: t('surveys.addSurvey'),
                    onClick: () => setIsFormOpen(true),
                  }
                : undefined
            }
          />
        )}
      </div>

      <SurveyFormDialog
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        survey={editingSurvey}
      />

      <AlertDialog open={!!deletingSurvey} onOpenChange={() => setDeletingSurvey(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('surveys.deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('surveys.deleteWarning')}
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
