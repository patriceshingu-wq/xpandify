import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useEvent, useUpdateEvent, useDeleteEvent } from '@/hooks/useEvents';
import { useRecurrenceRule, useDeleteRecurringEvent } from '@/hooks/useRecurringEvents';
import EditScopeDialog, { type EditScope } from '@/components/calendar/EditScopeDialog';
import { describeRecurrenceRule } from '@/lib/recurrence';
import { useEventRoles } from '@/hooks/useEventRoles';
import { useEventGoals } from '@/hooks/useEventGoals';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Edit, Trash2, Calendar, Clock, MapPin, Flag, Users, Target, BookOpen, MessageSquare, CheckCircle, Building, User } from 'lucide-react';
import { format, parseISO, addDays } from 'date-fns';
import { getStatusBadgeVariant } from '@/components/calendar/EventStatusBadge';
import EventRoleDialog from '@/components/calendar/EventRoleDialog';
import EventGoalDialog from '@/components/calendar/EventGoalDialog';

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const monthParam = searchParams.get('month');
  const { getLocalizedField, t, language } = useLanguage();
  const { isAdminOrSuper } = useAuth();
  const { data: event, isLoading } = useEvent(id);
  const { data: roles, isLoading: rolesLoading } = useEventRoles(id);
  const { data: eventGoals, isLoading: goalsLoading } = useEventGoals(id);
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [showDeleteScope, setShowDeleteScope] = useState(false);

  // Recurrence info
  const recurrenceRuleId = (event as any)?.recurrence_rule_id;
  const recurringSeriesId = (event as any)?.recurring_series_id;
  const { data: recurrenceRule } = useRecurrenceRule(recurrenceRuleId);
  const deleteRecurring = useDeleteRecurringEvent();

  const handleDelete = async () => {
    if (recurringSeriesId) {
      setShowDeleteScope(true);
      return;
    }
    await deleteEvent.mutateAsync(id!);
    navigate(`/calendar/events${monthParam ? `?month=${monthParam}` : ''}`);
  };

  const handleDeleteScope = async (scope: EditScope) => {
    setShowDeleteScope(false);
    await deleteRecurring.mutateAsync({
      eventId: id!,
      scope,
      seriesId: recurringSeriesId,
      eventDate: event!.date,
    });
    navigate(`/calendar/events${monthParam ? `?month=${monthParam}` : ''}`);
  };

  const handleMarkComplete = async () => {
    await updateEvent.mutateAsync({
      id: id!,
      status: 'Completed',
      completion_percentage: 100,
    });
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-48" />
        </div>
      </MainLayout>
    );
  }

  if (!event) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">{t('calendar.eventNotFound') || 'Event not found'}</h2>
          <Button onClick={() => navigate(`/calendar/events${monthParam ? `?month=${monthParam}` : ''}`)} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <PageHeader
            title={getLocalizedField(event, 'title')}
            subtitle={format(parseISO(event.date), 'EEEE, MMMM d, yyyy')}
            actions={
              isAdminOrSuper && (
                <div className="flex gap-2">
                  {event.status !== 'Completed' && (
                    <Button variant="outline" onClick={handleMarkComplete}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {t('calendar.markComplete') || 'Mark Complete'}
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => navigate(`/calendar/events/${id}/edit${monthParam ? `?month=${monthParam}` : ''}`)}>
                    <Edit className="h-4 w-4 mr-2" />
                    {t('common.edit')}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t('common.delete')}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('common.confirmDelete') || 'Delete Event?'}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('calendar.deleteEventWarning') || 'This will permanently delete this event.'}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>{t('common.delete')}</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )
            }
          />
        </div>

        {/* Status and Progress */}
        <div className="flex flex-wrap items-center gap-4">
          <Badge variant={getStatusBadgeVariant(event.status)} className="text-sm">
            {event.status}
          </Badge>
          {event.language && event.language !== 'Bilingual' && (
            <Badge variant="outline">{event.language}</Badge>
          )}
          {event.is_all_day && (
            <Badge variant="secondary">{t('calendar.allDay') || 'All Day'}</Badge>
          )}
          {recurringSeriesId && recurrenceRule && (
            <Badge variant="outline" className="flex items-center gap-1">
              🔄 {describeRecurrenceRule(recurrenceRule, language as 'en' | 'fr')}
            </Badge>
          )}
          <div className="flex-1 max-w-xs">
            <div className="flex items-center justify-between text-sm mb-1">
              <span>{t('calendar.progress') || 'Progress'}</span>
              <span>{event.completion_percentage}%</span>
            </div>
            <Progress value={event.completion_percentage} />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Event Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('calendar.details') || 'Details'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{format(parseISO(event.date), 'MMMM d, yyyy')}</p>
                  {!event.is_all_day && event.start_time && (
                    <p className="text-sm text-muted-foreground">
                      {event.start_time}{event.end_time && ` - ${event.end_time}`}
                      {event.end_time && event.end_date && event.end_time <= event.start_time &&
                        format(parseISO(event.end_date), 'yyyy-MM-dd') === format(addDays(parseISO(event.date), 1), 'yyyy-MM-dd') &&
                        <span className="ml-1 text-xs font-medium text-muted-foreground">(+1 day)</span>
                      }
                    </p>
                  )}
                </div>
              </div>

              {event.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <p>{event.location}</p>
                </div>
              )}

              {event.ministry && (
                <div className="flex items-start gap-3">
                  <Flag className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <p>{getLocalizedField(event.ministry, 'name')}</p>
                </div>
              )}

              {event.campus && (
                <div className="flex items-start gap-3">
                  <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <p>{event.campus.name}{event.campus.code ? ` (${event.campus.code})` : ''}</p>
                </div>
              )}

              {event.organizer && (
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('calendar.organizer') || 'Organizer'}</p>
                    <p>{event.organizer.first_name} {event.organizer.last_name}</p>
                  </div>
                </div>
              )}

              {event.program && (
                <div className="flex items-start gap-3">
                  <Flag className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <Badge variant="secondary">{event.program.code}</Badge>
                    <span className="ml-2">{getLocalizedField(event.program, 'name')}</span>
                  </div>
                </div>
              )}

              {event.quarter && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <p>Q{event.quarter.quarter_number} {event.quarter.year}: {event.quarter.theme_en}</p>
                </div>
              )}

              {event.activity_category && (
                <div className="flex items-start gap-3">
                  <Badge variant="outline">{getLocalizedField(event.activity_category, 'name')}</Badge>
                </div>
              )}

              {event.description_en && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">{t('common.description') || 'Description'}</h4>
                  <p className="text-muted-foreground">{getLocalizedField(event, 'description')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team Assignments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t('calendar.teamAssignments') || 'Team Assignments'}
              </CardTitle>
              {isAdminOrSuper && (
                <Button variant="outline" size="sm" onClick={() => setIsRoleDialogOpen(true)}>
                  {t('calendar.addAssignment') || 'Add'}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {rolesLoading ? (
                <Skeleton className="h-20" />
              ) : roles && roles.length > 0 ? (
                <div className="space-y-3">
                  {roles.map((role) => (
                    <div key={role.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">
                          {role.person?.preferred_name || role.person?.first_name} {role.person?.last_name}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline">{role.role}</Badge>
                          {role.from_country && <span>({role.from_country})</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  {t('calendar.noAssignments') || 'No team assignments yet'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Related Goals */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                {t('calendar.relatedGoals') || 'Related Goals'}
              </CardTitle>
              {isAdminOrSuper && (
                <Button variant="outline" size="sm" onClick={() => setIsGoalDialogOpen(true)}>
                  {t('calendar.linkGoal') || 'Link'}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {goalsLoading ? (
                <Skeleton className="h-20" />
              ) : eventGoals && eventGoals.length > 0 ? (
                <div className="space-y-3">
                  {eventGoals.map((eg) => eg.goal && (
                    <div key={eg.id} className="p-3 bg-muted/50 rounded-lg">
                      <p className="font-medium">{getLocalizedField(eg.goal, 'title')}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Progress value={eg.goal.progress_percent} className="flex-1 h-2" />
                        <span className="text-sm text-muted-foreground">{eg.goal.progress_percent}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  {t('calendar.noLinkedGoals') || 'No linked goals'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Related Course */}
          {event.course && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {t('calendar.relatedCourse') || 'Related Course'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{getLocalizedField(event.course, 'title')}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Internal Notes (admin only) */}
        {isAdminOrSuper && event.notes_internal && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('calendar.internalNotes') || 'Internal Notes'}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{event.notes_internal}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <EventRoleDialog
        open={isRoleDialogOpen}
        onOpenChange={setIsRoleDialogOpen}
        eventId={id!}
      />

      <EventGoalDialog
        open={isGoalDialogOpen}
        onOpenChange={setIsGoalDialogOpen}
        eventId={id!}
        existingGoalIds={eventGoals?.map((eg) => eg.goal_id) || []}
      />

      <EditScopeDialog
        open={showDeleteScope}
        onOpenChange={setShowDeleteScope}
        onSelect={handleDeleteScope}
        mode="delete"
      />
    </MainLayout>
  );
}
