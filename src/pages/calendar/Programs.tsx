import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePrograms, useDeleteProgram } from '@/hooks/usePrograms';
import { useQuarters } from '@/hooks/useQuarters';
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
import { Plus, Flag, Edit, Trash2, Calendar } from 'lucide-react';
import ProgramFormDialog from '@/components/calendar/ProgramFormDialog';
import type { Program } from '@/hooks/usePrograms';

export default function ProgramsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getLocalizedField, t } = useLanguage();
  const { isAdminOrSuper } = useAuth();
  const { data: quarters } = useQuarters();
  const { data: ministries } = useMinistries();

  const [quarterFilter, setQuarterFilter] = useState<string>('all');
  const { data: programs, isLoading } = usePrograms(
    quarterFilter !== 'all' ? { quarter_id: quarterFilter } : undefined
  );
  const deleteProgram = useDeleteProgram();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);

  const handleEdit = (program: Program) => {
    setEditingProgram(program);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteProgram.mutateAsync(id);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingProgram(null);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title={t('calendar.programs') || 'Programs'}
          subtitle={t('calendar.programsDescription') || 'Manage major event series and programs'}
          actions={
            isAdminOrSuper && (
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('calendar.addProgram') || 'Add Program'}
              </Button>
            )
          }
        />

        <div className="flex gap-4">
          <Select value={quarterFilter} onValueChange={setQuarterFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t('calendar.allQuarters') || 'All Quarters'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('calendar.allQuarters') || 'All Quarters'}</SelectItem>
              {quarters?.map((q) => (
                <SelectItem key={q.id} value={q.id}>
                  Q{q.quarter_number} {q.year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : programs && programs.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {programs.map((program) => (
              <Card key={program.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{program.code}</Badge>
                    <Badge variant="outline">{program.primary_language}</Badge>
                  </div>
                  <CardTitle className="text-lg">{getLocalizedField(program, 'name')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {program.theme_en && (
                    <p className="text-sm text-muted-foreground">{getLocalizedField(program, 'theme')}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-2 text-xs">
                    {program.quarter && (
                      <Badge variant="outline" className="gap-1">
                        <Calendar className="h-3 w-3" />
                        Q{program.quarter.quarter_number} {program.quarter.year}
                      </Badge>
                    )}
                    {program.ministry && (
                      <Badge variant="outline">
                        {getLocalizedField(program.ministry, 'name')}
                      </Badge>
                    )}
                  </div>

                  {program.description_en && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {getLocalizedField(program, 'description')}
                    </p>
                  )}

                  {isAdminOrSuper && (
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(program)}>
                        <Edit className="h-3 w-3 mr-1" />
                        {t('common.edit')}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-3 w-3 mr-1" />
                            {t('common.delete')}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('common.confirmDelete') || 'Delete Program?'}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('calendar.deleteProgramWarning') || 'This will permanently delete this program.'}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(program.id)}>
                              {t('common.delete')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <Flag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {t('calendar.noPrograms') || 'No programs found'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {t('calendar.noProgramsDescription') || 'Create your first program to organize events'}
            </p>
            {isAdminOrSuper && (
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('calendar.addProgram') || 'Add Program'}
              </Button>
            )}
          </Card>
        )}
      </div>

      <ProgramFormDialog
        open={isFormOpen}
        onOpenChange={handleFormClose}
        program={editingProgram}
        quarters={quarters || []}
        ministries={ministries || []}
      />
    </MainLayout>
  );
}
