import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePathways, useDeletePathway } from '@/hooks/usePathways';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Plus, Route, BookOpen, Clock, BarChart3, Edit, Trash2 } from 'lucide-react';
import { PathwayFormDialog } from '@/components/pathways/PathwayFormDialog';
import { PathwayDetailDialog } from '@/components/pathways/PathwayDetailDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Pathway } from '@/hooks/usePathways';

export default function Pathways() {
  const { t, getLocalizedField } = useLanguage();
  const { hasAnyRole } = useAuth();
  const { data: pathways, isLoading } = usePathways();
  const deletePathway = useDeletePathway();
  
  const [formOpen, setFormOpen] = useState(false);
  const [editingPathway, setEditingPathway] = useState<Pathway | null>(null);
  const [selectedPathway, setSelectedPathway] = useState<Pathway | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingPathway, setDeletingPathway] = useState<Pathway | null>(null);

  const isAdmin = hasAnyRole(['super_admin', 'admin']);

  const getDifficultyColor = (level: string | null) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleEdit = (pathway: Pathway) => {
    setEditingPathway(pathway);
    setFormOpen(true);
  };

  const handleDelete = (pathway: Pathway) => {
    setDeletingPathway(pathway);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (deletingPathway) {
      deletePathway.mutate(deletingPathway.id);
      setDeleteConfirmOpen(false);
      setDeletingPathway(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={t('pathways.title') || 'Learning Pathways'}
          subtitle={t('pathways.subtitle') || 'Multi-course learning tracks for discipleship'}
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('pathways.title') || 'Learning Pathways'}
        subtitle={t('pathways.subtitle') || 'Multi-course learning tracks for discipleship'}
        actions={
          isAdmin && (
            <Button onClick={() => { setEditingPathway(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              {t('pathways.addPathway') || 'Add Pathway'}
            </Button>
          )
        }
      />

      {!pathways || pathways.length === 0 ? (
        <EmptyState
          icon={<Route className="h-12 w-12" />}
          title={t('pathways.noPathways') || 'No pathways yet'}
          description={t('pathways.noPathwaysDesc') || 'Create learning pathways to guide disciples through structured courses.'}
          action={
            isAdmin ? {
              label: t('pathways.addPathway') || 'Add Pathway',
              onClick: () => setFormOpen(true),
            } : undefined
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pathways.map((pathway) => {
            const courseCount = pathway.courses?.length || 0;
            const totalHours = pathway.courses?.reduce((sum, pc) => 
              sum + (pc.course?.estimated_duration_hours || 0), 0) || 0;

            return (
              <Card 
                key={pathway.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedPathway(pathway)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg line-clamp-1">
                        {getLocalizedField(pathway, 'name')}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {getLocalizedField(pathway, 'description') || 'No description'}
                      </CardDescription>
                    </div>
                    {!pathway.is_active && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getDifficultyColor(pathway.difficulty_level)}>
                      {pathway.difficulty_level || 'intermediate'}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <BookOpen className="h-3 w-3" />
                      {courseCount} {courseCount === 1 ? 'course' : 'courses'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{pathway.estimated_duration_weeks || 12} weeks</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BarChart3 className="h-4 w-4" />
                      <span>{totalHours}h total</span>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex gap-2 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEdit(pathway)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(pathway)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <PathwayFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        pathway={editingPathway}
      />

      <PathwayDetailDialog
        open={!!selectedPathway}
        onOpenChange={(open) => !open && setSelectedPathway(null)}
        pathway={selectedPathway}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pathway</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingPathway && getLocalizedField(deletingPathway, 'name')}"? 
              This will remove the pathway and all course associations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
