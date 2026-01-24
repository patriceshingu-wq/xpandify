import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDevelopmentPlans } from '@/hooks/useDevelopmentPlans';
import { useCourseAssignments } from '@/hooks/useCourseAssignments';
import { 
  GraduationCap, 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  FileText,
  User,
  AlertCircle,
  Loader2
} from 'lucide-react';

export function DevelopmentProgressWidget() {
  const { t, getLocalizedField } = useLanguage();
  const { data: pdps, isLoading: pdpsLoading } = useDevelopmentPlans({ status: 'active' });
  const { data: assignments, isLoading: assignmentsLoading } = useCourseAssignments();

  const isLoading = pdpsLoading || assignmentsLoading;

  // Get in-progress assignments (not completed, not dropped)
  const activeAssignments = (assignments || []).filter(
    a => a.status === 'not_started' || a.status === 'in_progress'
  ).slice(0, 4);

  // Get active PDPs with calculated progress
  const activePDPsWithProgress = (pdps || []).slice(0, 3);

  // Calculate stats
  const totalAssignments = assignments?.length || 0;
  const completedAssignments = (assignments || []).filter(a => a.status === 'completed').length;
  const inProgressAssignments = (assignments || []).filter(a => a.status === 'in_progress').length;

  if (isLoading) {
    return (
      <Card className="col-span-full lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <GraduationCap className="h-5 w-5 text-accent" />
            Development & Training
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <GraduationCap className="h-5 w-5 text-accent" />
            Development & Training
          </CardTitle>
          <Link to="/development">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              View All <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-foreground">{totalAssignments}</div>
            <div className="text-xs text-muted-foreground">Total Courses</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-info/10">
            <div className="text-2xl font-bold text-info">{inProgressAssignments}</div>
            <div className="text-xs text-muted-foreground">In Progress</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-success/10">
            <div className="text-2xl font-bold text-success">{completedAssignments}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Active Development Plans */}
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Active Development Plans
            </h4>
            {activePDPsWithProgress.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4 bg-muted/30 rounded-lg">
                No active development plans
              </div>
            ) : (
              <div className="space-y-3">
                {activePDPsWithProgress.map((pdp) => (
                  <div key={pdp.id} className="p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {getLocalizedField(pdp, 'plan_title')}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          {pdp.person?.first_name} {pdp.person?.last_name}
                        </div>
                      </div>
                      <Badge variant="outline" className="shrink-0 bg-success/10 text-success border-success/20">
                        {t('people.active')}
                      </Badge>
                    </div>
                    {pdp.target_date && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                        <Clock className="h-3 w-3" />
                        Target: {new Date(pdp.target_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Course Assignments */}
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              Pending Course Assignments
            </h4>
            {activeAssignments.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4 bg-muted/30 rounded-lg">
                No pending assignments
              </div>
            ) : (
              <div className="space-y-3">
                {activeAssignments.map((assignment) => (
                  <div key={assignment.id} className="p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {assignment.course?.code && `${assignment.course.code} - `}
                          {getLocalizedField(assignment.course || {}, 'title')}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          {assignment.person?.first_name} {assignment.person?.last_name}
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={
                          assignment.status === 'in_progress' 
                            ? 'bg-info/10 text-info border-info/20' 
                            : 'bg-muted text-muted-foreground'
                        }
                      >
                        {assignment.status === 'in_progress' ? t('goals.inProgress') : t('goals.notStarted')}
                      </Badge>
                    </div>
                    {assignment.course?.estimated_duration_hours && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                        <Clock className="h-3 w-3" />
                        {assignment.course.estimated_duration_hours}h estimated
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
