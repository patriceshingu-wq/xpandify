import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuarter, useDeleteQuarter } from '@/hooks/useQuarters';
import { usePrograms } from '@/hooks/usePrograms';
import { useEvents } from '@/hooks/useEvents';
import { useMinistries } from '@/hooks/useMinistries';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Calendar, Edit, Trash2, Flag, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import QuarterFormDialog from '@/components/calendar/QuarterFormDialog';
import { getStatusBadgeVariant } from '@/components/calendar/EventStatusBadge';

export default function QuarterDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getLocalizedField, t } = useLanguage();
  const { isAdminOrSuper } = useAuth();
  const { data: quarter, isLoading: quarterLoading } = useQuarter(id);
  const { data: programs, isLoading: programsLoading } = usePrograms({ quarter_id: id });
  const { data: allEvents, isLoading: eventsLoading } = useEvents({ quarter_id: id });
  const { data: ministries } = useMinistries();
  const deleteQuarter = useDeleteQuarter();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [ministryFilter, setMinistryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const events = allEvents?.filter((e) => {
    if (ministryFilter !== 'all' && e.ministry_id !== ministryFilter) return false;
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    return true;
  });

  const handleDelete = async () => {
    await deleteQuarter.mutateAsync(id!);
    navigate('/calendar/quarters');
  };

  if (quarterLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-48" />
        </div>
      </MainLayout>
    );
  }

  if (!quarter) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">{t('calendar.quarterNotFound') || 'Quarter not found'}</h2>
          <Button onClick={() => navigate('/calendar/quarters')} className="mt-4">
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
          <Button variant="ghost" size="icon" onClick={() => navigate('/calendar/quarters')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        <PageHeader
            title={`Q${quarter.quarter_number} ${quarter.year}: ${getLocalizedField(quarter, 'theme')}`}
            subtitle={`${format(new Date(quarter.start_date), 'MMMM d')} - ${format(new Date(quarter.end_date), 'MMMM d, yyyy')}`}
            actions={
              isAdminOrSuper && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsEditOpen(true)}>
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
                        <AlertDialogTitle>{t('common.confirmDelete') || 'Delete Quarter?'}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('calendar.deleteQuarterWarning') || 'This will permanently delete this quarter and cannot be undone.'}
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

        {quarter.description_en && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">{getLocalizedField(quarter, 'description')}</p>
            </CardContent>
          </Card>
        )}

        {/* Programs Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Flag className="h-5 w-5" />
              {t('calendar.programs') || 'Programs'}
            </h2>
            <Button variant="outline" size="sm" onClick={() => navigate('/calendar/programs')}>
              {t('calendar.managePrograms') || 'Manage Programs'}
            </Button>
          </div>

          {programsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
            </div>
          ) : programs && programs.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {programs.map((program) => (
                <Card key={program.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/calendar/programs?id=${program.id}`)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{program.code}</Badge>
                      <Badge variant="outline">{program.primary_language}</Badge>
                    </div>
                    <CardTitle className="text-base">{getLocalizedField(program, 'name')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {program.theme_en && (
                      <p className="text-sm text-muted-foreground">{getLocalizedField(program, 'theme')}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-6 text-center text-muted-foreground">
              {t('calendar.noProgramsInQuarter') || 'No programs in this quarter'}
            </Card>
          )}
        </div>

        {/* Events Section */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('calendar.events') || 'Events'}
            </h2>
            <div className="flex gap-2">
              <Select value={ministryFilter} onValueChange={setMinistryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={t('calendar.allMinistries') || 'All Ministries'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('calendar.allMinistries') || 'All Ministries'}</SelectItem>
                  {ministries?.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{getLocalizedField(m, 'name')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder={t('calendar.allStatus') || 'All Status'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('calendar.allStatus') || 'All Status'}</SelectItem>
                  <SelectItem value="Planned">{t('calendar.planned') || 'Planned'}</SelectItem>
                  <SelectItem value="Confirmed">{t('calendar.confirmed') || 'Confirmed'}</SelectItem>
                  <SelectItem value="Completed">{t('calendar.completed') || 'Completed'}</SelectItem>
                  <SelectItem value="Canceled">{t('calendar.canceled') || 'Canceled'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {eventsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : events && events.length > 0 ? (
            <div className="space-y-2">
              {events.map((event) => (
                <Card
                  key={event.id}
                  className="cursor-pointer hover:shadow-sm transition-shadow"
                  onClick={() => navigate(`/calendar/events/${event.id}`)}
                >
                  <CardContent className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[60px]">
                        <div className="text-sm font-medium">{format(new Date(event.date), 'MMM d')}</div>
                        <div className="text-xs text-muted-foreground">{format(new Date(event.date), 'EEE')}</div>
                      </div>
                      <div>
                        <p className="font-medium">{getLocalizedField(event, 'title')}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {event.ministry && <span>{getLocalizedField(event.ministry, 'name')}</span>}
                          {event.program && <Badge variant="outline" className="text-xs">{event.program.code}</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusBadgeVariant(event.status)}>{event.status}</Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-6 text-center text-muted-foreground">
              {t('calendar.noEventsInQuarter') || 'No events in this quarter'}
            </Card>
          )}
        </div>
      </div>

      <QuarterFormDialog open={isEditOpen} onOpenChange={setIsEditOpen} quarter={quarter} />
    </MainLayout>
  );
}
