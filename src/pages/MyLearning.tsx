import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMyCourseProgress, useUpdateCourseProgress, useStartCourse } from '@/hooks/useCourseProgress';
import { usePathways } from '@/hooks/usePathways';
import { useCourses } from '@/hooks/useCourses';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  BookOpen, 
  GraduationCap, 
  Route, 
  Clock, 
  CheckCircle2, 
  Play,
  TrendingUp,
  Award,
} from 'lucide-react';
import { format } from 'date-fns';

export default function MyLearning() {
  const { t, getLocalizedField } = useLanguage();
  const { person } = useAuth();
  const { data: progress, isLoading } = useMyCourseProgress();
  const { data: pathways } = usePathways();
  const { data: allCourses } = useCourses();
  const startCourse = useStartCourse();
  const updateProgress = useUpdateCourseProgress();

  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedPathwayId, setSelectedPathwayId] = useState<string>('');

  const inProgressCourses = progress?.filter(p => 
    (p.completion_percentage || 0) > 0 && (p.completion_percentage || 0) < 100
  ) || [];

  const completedCourses = progress?.filter(p => 
    p.completion_percentage === 100
  ) || [];

  const notStartedCourses = progress?.filter(p => 
    (p.completion_percentage || 0) === 0
  ) || [];

  // Courses user hasn't started at all
  const enrolledCourseIds = new Set(progress?.map(p => p.course_id) || []);
  const availableCourses = allCourses?.filter(c => !enrolledCourseIds.has(c.id)) || [];

  const handleStartCourse = () => {
    if (selectedCourseId && person) {
      startCourse.mutate({
        courseId: selectedCourseId,
        pathwayId: selectedPathwayId || undefined,
        personId: person.id,
      });
      setSelectedCourseId('');
      setSelectedPathwayId('');
    }
  };

  const handleUpdateProgress = (id: string, newPercentage: number) => {
    updateProgress.mutate({ id, completion_percentage: newPercentage });
  };

  // Calculate stats
  const totalCourses = progress?.length || 0;
  const completedCount = completedCourses.length;
  const averageProgress = totalCourses > 0 
    ? Math.round(progress!.reduce((sum, p) => sum + (p.completion_percentage || 0), 0) / totalCourses)
    : 0;

  if (isLoading) {
    return (
      <MainLayout title={t('myLearning.title') || 'My Learning'} subtitle={t('myLearning.subtitle') || 'Track your course progress and continue learning'}>
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={t('myLearning.title') || 'My Learning'} subtitle={t('myLearning.subtitle') || 'Track your course progress and continue learning'}>
      <div className="space-y-6">

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalCourses}</p>
                <p className="text-sm text-muted-foreground">Enrolled Courses</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedCount}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{averageProgress}%</p>
                <p className="text-sm text-muted-foreground">Avg. Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enroll in new course */}
      {availableCourses.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Start a New Course</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a course..." />
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
              <Select value={selectedPathwayId} onValueChange={setSelectedPathwayId}>
                <SelectTrigger className="sm:w-48">
                  <SelectValue placeholder="Pathway (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Pathway</SelectItem>
                  {pathways?.filter(p => p.is_active).map(pathway => (
                    <SelectItem key={pathway.id} value={pathway.id}>
                      {getLocalizedField(pathway, 'name')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={handleStartCourse} 
                disabled={!selectedCourseId || startCourse.isPending}
              >
                <Play className="h-4 w-4 mr-2" />
                Start
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Course Tabs */}
      {totalCourses === 0 ? (
        <EmptyState
          icon={<GraduationCap className="h-12 w-12" />}
          title="No courses yet"
          description="Start your learning journey by enrolling in a course above."
        />
      ) : (
        <Tabs defaultValue="in-progress" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="in-progress" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              In Progress ({inProgressCourses.length})
            </TabsTrigger>
            <TabsTrigger value="not-started" className="gap-2">
              <Clock className="h-4 w-4" />
              Not Started ({notStartedCourses.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <Award className="h-4 w-4" />
              Completed ({completedCourses.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="in-progress" className="space-y-4">
            {inProgressCourses.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No courses in progress</p>
            ) : (
              inProgressCourses.map(course => (
                <CourseProgressCard 
                  key={course.id} 
                  progress={course} 
                  onUpdateProgress={handleUpdateProgress}
                  getLocalizedField={getLocalizedField}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="not-started" className="space-y-4">
            {notStartedCourses.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">All courses started!</p>
            ) : (
              notStartedCourses.map(course => (
                <CourseProgressCard 
                  key={course.id} 
                  progress={course} 
                  onUpdateProgress={handleUpdateProgress}
                  getLocalizedField={getLocalizedField}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedCourses.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No completed courses yet</p>
            ) : (
              completedCourses.map(course => (
                <CourseProgressCard 
                  key={course.id} 
                  progress={course} 
                  onUpdateProgress={handleUpdateProgress}
                  getLocalizedField={getLocalizedField}
                  isCompleted
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
      </div>
    </MainLayout>
  );
}

interface CourseProgressCardProps {
  progress: {
    id: string;
    completion_percentage: number | null;
    started_at: string | null;
    completed_at: string | null;
    last_activity_at: string | null;
    course?: {
      id: string;
      title_en: string;
      title_fr: string | null;
      code: string | null;
      category: string | null;
      estimated_duration_hours: number | null;
    };
    pathway?: {
      id: string;
      name_en: string;
      name_fr: string | null;
      code: string;
    };
  };
  onUpdateProgress: (id: string, percentage: number) => void;
  getLocalizedField: (obj: unknown, field: string) => string;
  isCompleted?: boolean;
}

function CourseProgressCard({ progress, onUpdateProgress, getLocalizedField, isCompleted }: CourseProgressCardProps) {
  const percentage = progress.completion_percentage || 0;

  const handleQuickProgress = (increment: number) => {
    const newValue = Math.min(100, Math.max(0, percentage + increment));
    onUpdateProgress(progress.id, newValue);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {progress.course?.code && (
                <Badge variant="outline" className="shrink-0">
                  {progress.course.code}
                </Badge>
              )}
              <h3 className="font-semibold truncate">
                {getLocalizedField(progress.course, 'title')}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {progress.pathway && (
                <span className="flex items-center gap-1">
                  <Route className="h-3 w-3" />
                  {getLocalizedField(progress.pathway, 'name')}
                </span>
              )}
              {progress.course?.estimated_duration_hours && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {progress.course.estimated_duration_hours}h
                </span>
              )}
              {progress.last_activity_at && (
                <span>
                  Last active: {format(new Date(progress.last_activity_at), 'MMM d, yyyy')}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 sm:w-64">
            <div className="flex-1 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{percentage}%</span>
                {isCompleted && progress.completed_at && (
                  <span className="text-green-600 dark:text-green-400">
                    Completed {format(new Date(progress.completed_at), 'MMM d')}
                  </span>
                )}
              </div>
              <Progress value={percentage} className="h-2" />
            </div>

            {!isCompleted && (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuickProgress(10)}
                  disabled={percentage >= 100}
                >
                  +10%
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleQuickProgress(100 - percentage)}
                  disabled={percentage >= 100}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
