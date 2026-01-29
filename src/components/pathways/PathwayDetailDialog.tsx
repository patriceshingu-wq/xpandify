import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCourses } from '@/hooks/useCourses';
import { useAddCourseToPathway, useRemoveCourseFromPathway, type Pathway } from '@/hooks/usePathways';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BookOpen, Clock, Plus, X, GripVertical } from 'lucide-react';

interface PathwayDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pathway: Pathway | null;
}

export function PathwayDetailDialog({ open, onOpenChange, pathway }: PathwayDetailDialogProps) {
  const { getLocalizedField } = useLanguage();
  const { hasAnyRole } = useAuth();
  const { data: allCourses } = useCourses();
  const addCourse = useAddCourseToPathway();
  const removeCourse = useRemoveCourseFromPathway();
  
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');

  const isAdmin = hasAnyRole(['super_admin', 'admin']);

  if (!pathway) return null;

  const pathwayCourseIds = new Set(pathway.courses?.map(pc => pc.course_id) || []);
  const availableCourses = allCourses?.filter(c => !pathwayCourseIds.has(c.id)) || [];
  const sortedCourses = [...(pathway.courses || [])].sort((a, b) => 
    (a.order_index || 0) - (b.order_index || 0)
  );

  const totalHours = sortedCourses.reduce((sum, pc) => 
    sum + (pc.course?.estimated_duration_hours || 0), 0);

  const handleAddCourse = () => {
    if (selectedCourseId && pathway) {
      addCourse.mutate({
        pathwayId: pathway.id,
        courseId: selectedCourseId,
        orderIndex: sortedCourses.length,
      });
      setSelectedCourseId('');
    }
  };

  const handleRemoveCourse = (courseId: string) => {
    if (pathway) {
      removeCourse.mutate({ pathwayId: pathway.id, courseId });
    }
  };

  const getDifficultyColor = (level: string | null) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {getLocalizedField(pathway, 'name')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Pathway info */}
          <div className="space-y-3">
            <p className="text-muted-foreground">
              {getLocalizedField(pathway, 'description') || 'No description available'}
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge className={getDifficultyColor(pathway.difficulty_level)}>
                {pathway.difficulty_level || 'intermediate'}
              </Badge>
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                {pathway.estimated_duration_weeks} weeks
              </Badge>
              <Badge variant="outline">
                <BookOpen className="h-3 w-3 mr-1" />
                {sortedCourses.length} courses • {totalHours}h total
              </Badge>
            </div>
          </div>

          {/* Course list */}
          <div className="space-y-3">
            <h3 className="font-semibold">Courses in this Pathway</h3>
            
            {sortedCourses.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">
                No courses added yet
              </p>
            ) : (
              <div className="space-y-2">
                {sortedCourses.map((pc, index) => (
                  <Card key={pc.id}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="text-muted-foreground">
                        <GripVertical className="h-4 w-4" />
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        {index + 1}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {pc.course?.code && (
                            <span className="text-muted-foreground mr-2">{pc.course.code}</span>
                          )}
                          {getLocalizedField(pc.course, 'title')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {pc.course?.estimated_duration_hours || 0}h • {pc.course?.category || 'Other'}
                          {!pc.is_required && ' • Optional'}
                        </p>
                      </div>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveCourse(pc.course_id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Add course */}
            {isAdmin && availableCourses.length > 0 && (
              <div className="flex gap-2 pt-2">
                <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a course to add..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCourses.map(course => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.code && `${course.code} - `}
                        {getLocalizedField(course, 'title')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleAddCourse} 
                  disabled={!selectedCourseId || addCourse.isPending}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
