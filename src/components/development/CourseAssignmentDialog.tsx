import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePeople } from '@/hooks/usePeople';
import { useCourses } from '@/hooks/useCourses';
import { useCreateCourseAssignment, useUpdateCourseAssignment, useDeleteCourseAssignment, CourseAssignment } from '@/hooks/useCourseAssignments';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Trash2 } from 'lucide-react';

interface CourseAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment?: CourseAssignment | null;
  defaultPersonId?: string;
  defaultCourseId?: string;
}

export function CourseAssignmentDialog({ open, onOpenChange, assignment, defaultPersonId, defaultCourseId }: CourseAssignmentDialogProps) {
  const { t, getLocalizedField } = useLanguage();
  const { person } = useAuth();
  const { data: staffPeople } = usePeople({ person_type: 'staff' });
  const { data: volunteerPeople } = usePeople({ person_type: 'volunteer' });
  const { data: courses } = useCourses({ is_active: true });
  const createAssignment = useCreateCourseAssignment();
  const updateAssignment = useUpdateCourseAssignment();
  const deleteAssignment = useDeleteCourseAssignment();

  const allPeople = [...(staffPeople || []), ...(volunteerPeople || [])].sort((a, b) =>
    `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`)
  );

  const [formData, setFormData] = useState({
    person_id: '',
    course_id: '',
    assigned_date: '',
    status: 'not_started' as 'not_started' | 'in_progress' | 'completed' | 'dropped',
    completion_date: '',
    notes: '',
  });

  useEffect(() => {
    if (open) {
      if (assignment) {
        setFormData({
          person_id: assignment.person_id,
          course_id: assignment.course_id,
          assigned_date: assignment.assigned_date || '',
          status: assignment.status || 'not_started',
          completion_date: assignment.completion_date || '',
          notes: assignment.notes || '',
        });
      } else {
        setFormData({
          person_id: defaultPersonId || '',
          course_id: defaultCourseId || '',
          assigned_date: new Date().toISOString().split('T')[0],
          status: 'not_started',
          completion_date: '',
          notes: '',
        });
      }
    }
  }, [assignment, open, defaultPersonId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      person_id: formData.person_id,
      course_id: formData.course_id,
      assigned_by_id: person?.id || null,
      assigned_date: formData.assigned_date || null,
      status: formData.status,
      completion_date: formData.completion_date || null,
      notes: formData.notes || null,
    };

    if (assignment) {
      await updateAssignment.mutateAsync({ id: assignment.id, ...payload });
    } else {
      await createAssignment.mutateAsync(payload);
    }

    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (assignment) {
      await deleteAssignment.mutateAsync(assignment.id);
      onOpenChange(false);
    }
  };

  const isLoading = createAssignment.isPending || updateAssignment.isPending || deleteAssignment.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{assignment ? 'Edit Assignment' : 'Assign Course'}</DialogTitle>
          <DialogDescription>
            {assignment ? 'Update the course assignment details' : 'Assign a course to a team member'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Person *</Label>
            <Select
              value={formData.person_id}
              onValueChange={(value) => setFormData({ ...formData, person_id: value })}
              disabled={!!assignment}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a person" />
              </SelectTrigger>
              <SelectContent>
                {allPeople.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.first_name} {p.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Course *</Label>
            <Select
              value={formData.course_id}
              onValueChange={(value) => setFormData({ ...formData, course_id: value })}
              disabled={!!assignment}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {(courses || []).map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.code ? `${course.code} - ` : ''}{getLocalizedField(course, 'title')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Assigned Date</Label>
              <Input
                type="date"
                value={formData.assigned_date}
                onChange={(e) => setFormData({ ...formData, assigned_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('common.status')}</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'not_started' | 'in_progress' | 'completed' | 'dropped') =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">{t('goals.notStarted')}</SelectItem>
                  <SelectItem value="in_progress">{t('goals.inProgress')}</SelectItem>
                  <SelectItem value="completed">{t('goals.completed')}</SelectItem>
                  <SelectItem value="dropped">Dropped</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.status === 'completed' && (
            <div className="space-y-2">
              <Label>Completion Date</Label>
              <Input
                type="date"
                value={formData.completion_date}
                onChange={(e) => setFormData({ ...formData, completion_date: e.target.value })}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>{t('common.notes')}</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any notes about this assignment..."
              rows={3}
            />
          </div>

          <DialogFooter className="flex justify-between">
            <div>
              {assignment && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Assignment?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>{t('common.delete')}</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading || !formData.person_id || !formData.course_id}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('common.save')}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
