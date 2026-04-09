import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCourses, Course, useDeleteCourse } from '@/hooks/useCourses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { CourseFormDialog } from '@/components/courses/CourseFormDialog';
import { CourseAssignmentDialog } from '@/components/development/CourseAssignmentDialog';
import { Plus, Search, GraduationCap, Clock, Laptop, Users, Book, Trash2, UserPlus } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const deliveryIcons: Record<string, React.ReactNode> = {
  in_person: <Users className="h-4 w-4" />,
  online: <Laptop className="h-4 w-4" />,
  hybrid: <Users className="h-4 w-4" />,
  reading_plan: <Book className="h-4 w-4" />,
};

export default function CourseCatalogTab() {
  const { t, getLocalizedField } = useLanguage();
  const { isAdminOrSuper } = useAuth();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [deliveryType, setDeliveryType] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  const [assigningCourseId, setAssigningCourseId] = useState<string | null>(null);

  const { data: courses, isLoading } = useCourses({
    search: search || undefined,
    category,
    delivery_type: deliveryType,
  });

  const deleteCourse = useDeleteCourse();

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCourse(null);
  };

  const handleDelete = async () => {
    if (deletingCourse) {
      await deleteCourse.mutateAsync(deletingCourse.id);
      setDeletingCourse(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t('courses.search')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder={t('common.category')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="theology">{t('courses.theology')}</SelectItem>
                <SelectItem value="leadership">{t('courses.leadership')}</SelectItem>
                <SelectItem value="ministry_skills">{t('courses.ministrySkills')}</SelectItem>
                <SelectItem value="pastoral_skills">{t('courses.pastoralSkills')}</SelectItem>
                <SelectItem value="character">{t('courses.character')}</SelectItem>
                <SelectItem value="other">{t('common.other')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={deliveryType} onValueChange={setDeliveryType}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder={t('courses.deliveryType')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="in_person">{t('courses.inPerson')}</SelectItem>
                <SelectItem value="online">{t('courses.online')}</SelectItem>
                <SelectItem value="hybrid">{t('courses.hybrid')}</SelectItem>
                <SelectItem value="reading_plan">{t('courses.readingPlan')}</SelectItem>
              </SelectContent>
            </Select>
            {isAdminOrSuper && (
              <Button onClick={() => setIsFormOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                {t('courses.addCourse')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Courses Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12"><div className="spinner" /></div>
      ) : courses && courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <Card key={course.id} className="cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5" onClick={() => handleEdit(course)}>
              <CardContent className="p-4 sm:p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {course.code && <Badge variant="outline" className="font-mono text-xs">{course.code}</Badge>}
                    {!course.is_active && <Badge variant="secondary">{t('courses.inactive')}</Badge>}
                  </div>
                  {isAdminOrSuper && (
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8 touch-target" onClick={(e) => { e.stopPropagation(); setAssigningCourseId(course.id); }}>
                        <UserPlus className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive touch-target" onClick={(e) => { e.stopPropagation(); setDeletingCourse(course); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <h3 className="font-medium text-foreground text-base leading-snug">{getLocalizedField(course, 'title')}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{getLocalizedField(course, 'description') || t('courses.noDescription')}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                  <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 shrink-0" /><span>{course.estimated_duration_hours}h</span></div>
                  <div className="flex items-center gap-1.5">{deliveryIcons[course.delivery_type || 'in_person']}<span className="capitalize">{course.delivery_type?.replace('_', ' ')}</span></div>
                </div>
                <div><Badge variant="secondary" className="capitalize">{course.category?.replace('_', ' ')}</Badge></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<GraduationCap className="h-16 w-16" />}
          title={t('common.noResults')}
          description={t('courses.noCourses')}
          action={isAdminOrSuper ? { label: t('courses.addCourse'), onClick: () => setIsFormOpen(true) } : undefined}
        />
      )}

      <CourseFormDialog open={isFormOpen} onOpenChange={handleCloseForm} course={editingCourse} />

      <CourseAssignmentDialog
        open={!!assigningCourseId}
        onOpenChange={() => setAssigningCourseId(null)}
        defaultCourseId={assigningCourseId || undefined}
      />

      <AlertDialog open={!!deletingCourse} onOpenChange={() => setDeletingCourse(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('courses.deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>{t('courses.deleteWarning')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
