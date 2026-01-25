import { useLanguage } from '@/contexts/LanguageContext';
import { useReviewPeriodData } from '@/hooks/useReviewMeetingHistory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Target, GraduationCap, BookOpen, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface ReviewPeriodDataPanelProps {
  personId: string;
  startDate?: string;
  endDate?: string;
}

const statusColors: Record<string, string> = {
  not_started: 'bg-muted text-muted-foreground',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  on_hold: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  dropped: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const statusIcons: Record<string, React.ReactNode> = {
  not_started: <Clock className="h-3 w-3" />,
  in_progress: <AlertCircle className="h-3 w-3" />,
  completed: <CheckCircle className="h-3 w-3" />,
  on_hold: <Clock className="h-3 w-3" />,
  cancelled: <AlertCircle className="h-3 w-3" />,
  dropped: <AlertCircle className="h-3 w-3" />,
};

export function ReviewPeriodDataPanel({ personId, startDate, endDate }: ReviewPeriodDataPanelProps) {
  const { getLocalizedField } = useLanguage();
  const { data, isLoading } = useReviewPeriodData(personId, startDate, endDate);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  const goals = data?.goals || [];
  const pdpItems = data?.pdpItems || [];
  const courseAssignments = data?.courseAssignments || [];

  return (
    <div className="space-y-4">
      {/* Goals Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4" />
            Goals
            <Badge variant="secondary" className="ml-2">{goals.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No goals found for this person
            </p>
          ) : (
            <Accordion type="multiple" className="space-y-2">
              {goals.map((goal) => (
                <AccordionItem
                  key={goal.id}
                  value={goal.id}
                  className="border rounded-lg px-3"
                >
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-medium text-sm truncate">
                          {getLocalizedField(goal, 'title')}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`text-xs ${statusColors[goal.status || 'not_started']}`}>
                            {statusIcons[goal.status || 'not_started']}
                            <span className="ml-1">{goal.status?.replace(/_/g, ' ')}</span>
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {goal.progress_percent || 0}% complete
                          </span>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span>Progress</span>
                          <span>{goal.progress_percent || 0}%</span>
                        </div>
                        <Progress value={goal.progress_percent || 0} className="h-2" />
                      </div>
                      {(goal.description_en || goal.description_fr) && (
                        <p className="text-sm text-muted-foreground">
                          {getLocalizedField(goal, 'description')}
                        </p>
                      )}
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Level: {goal.goal_level}</span>
                        {goal.category && <span>Category: {goal.category}</span>}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* PDP Items Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="h-4 w-4" />
            Development Plan Items
            <Badge variant="secondary" className="ml-2">{pdpItems.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pdpItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No development plan items found
            </p>
          ) : (
            <div className="space-y-3">
              {pdpItems.map((item: any) => (
                <div key={item.id} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {getLocalizedField(item, 'title')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.pdp_title}
                      </p>
                    </div>
                    <Badge className={`text-xs shrink-0 ${statusColors[item.status || 'not_started']}`}>
                      {statusIcons[item.status || 'not_started']}
                      <span className="ml-1">{item.status?.replace(/_/g, ' ')}</span>
                    </Badge>
                  </div>
                  {item.item_type && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      {item.item_type}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Course Assignments Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4" />
            Course Assignments
            <Badge variant="secondary" className="ml-2">{courseAssignments.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {courseAssignments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No course assignments found
            </p>
          ) : (
            <div className="space-y-3">
              {courseAssignments.map((assignment: any) => (
                <div key={assignment.id} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {assignment.course ? getLocalizedField(assignment.course, 'title') : 'Unknown Course'}
                      </p>
                      {assignment.assigned_date && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Assigned: {new Date(assignment.assigned_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Badge className={`text-xs shrink-0 ${statusColors[assignment.status || 'not_started']}`}>
                      {statusIcons[assignment.status || 'not_started']}
                      <span className="ml-1">{assignment.status?.replace(/_/g, ' ')}</span>
                    </Badge>
                  </div>
                  {assignment.completion_date && (
                    <p className="text-xs text-success mt-2">
                      Completed: {new Date(assignment.completion_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
