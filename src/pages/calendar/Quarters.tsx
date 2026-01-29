import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuarters, useCreateQuarter, useDeleteQuarter } from '@/hooks/useQuarters';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Calendar, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import QuarterFormDialog from '@/components/calendar/QuarterFormDialog';

export default function QuartersPage() {
  const navigate = useNavigate();
  const { getLocalizedField, t } = useLanguage();
  const { isAdminOrSuper } = useAuth();
  const { data: quarters, isLoading } = useQuarters();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const groupedByYear = quarters?.reduce((acc, q) => {
    if (!acc[q.year]) acc[q.year] = [];
    acc[q.year].push(q);
    return acc;
  }, {} as Record<number, typeof quarters>);

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title={t('calendar.quarters') || 'Quarters'}
          subtitle={t('calendar.quartersDescription') || 'Manage quarterly themes and planning'}
          actions={
            isAdminOrSuper && (
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('calendar.addQuarter') || 'Add Quarter'}
              </Button>
            )
          }
        />

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : (
          Object.entries(groupedByYear || {})
            .sort(([a], [b]) => Number(b) - Number(a))
            .map(([year, yearQuarters]) => (
              <div key={year} className="space-y-4">
                <h2 className="text-xl font-semibold">{year}</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {yearQuarters
                    ?.sort((a, b) => a.quarter_number - b.quarter_number)
                    .map((quarter) => (
                      <Card
                        key={quarter.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => navigate(`/calendar/quarters/${quarter.id}`)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">Q{quarter.quarter_number}</Badge>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <CardTitle className="text-lg">
                            {getLocalizedField(quarter, 'theme')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {format(new Date(quarter.start_date), 'MMM d')} -{' '}
                              {format(new Date(quarter.end_date), 'MMM d, yyyy')}
                            </span>
                          </div>
                          {quarter.description_en && (
                            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                              {getLocalizedField(quarter, 'description')}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            ))
        )}

        {!isLoading && (!quarters || quarters.length === 0) && (
          <Card className="p-8 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {t('calendar.noQuarters') || 'No quarters found'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {t('calendar.noQuartersDescription') || 'Create your first quarter to start planning'}
            </p>
            {isAdminOrSuper && (
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('calendar.addQuarter') || 'Add Quarter'}
              </Button>
            )}
          </Card>
        )}
      </div>

      <QuarterFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} />
    </MainLayout>
  );
}
