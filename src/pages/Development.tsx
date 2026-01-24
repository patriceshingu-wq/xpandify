import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { PDPFormDialog } from '@/components/development/PDPFormDialog';
import { PDPDetailDialog } from '@/components/development/PDPDetailDialog';
import { CourseAssignmentDialog } from '@/components/development/CourseAssignmentDialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useDevelopmentPlans, PDP } from '@/hooks/useDevelopmentPlans';
import { useCourseAssignments, CourseAssignment } from '@/hooks/useCourseAssignments';
import {
  Plus,
  Search,
  FileText,
  GraduationCap,
  User,
  Calendar,
  Target,
  Loader2,
  BookOpen,
  Clock,
  CheckCircle2,
  Circle,
} from 'lucide-react';

const statusColors: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/20',
  completed: 'bg-info/10 text-info border-info/20',
  on_hold: 'bg-warning/10 text-warning border-warning/20',
  not_started: 'bg-muted text-muted-foreground',
  in_progress: 'bg-info/10 text-info border-info/20',
  dropped: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function Development() {
  const { t, getLocalizedField } = useLanguage();
  const { isAdminOrSuper } = useAuth();

  // Filters
  const [pdpStatus, setPdpStatus] = useState<string>('');
  const [assignmentStatus, setAssignmentStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Dialogs
  const [isPDPFormOpen, setIsPDPFormOpen] = useState(false);
  const [editingPDP, setEditingPDP] = useState<PDP | null>(null);
  const [viewingPDPId, setViewingPDPId] = useState<string | null>(null);
  const [isAssignmentFormOpen, setIsAssignmentFormOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<CourseAssignment | null>(null);

  // Data
  const { data: pdps, isLoading: pdpsLoading } = useDevelopmentPlans({ status: pdpStatus || undefined });
  const { data: assignments, isLoading: assignmentsLoading } = useCourseAssignments({ status: assignmentStatus || undefined });

  // Filter PDPs by search
  const filteredPDPs = (pdps || []).filter((pdp) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      pdp.plan_title_en.toLowerCase().includes(search) ||
      pdp.plan_title_fr?.toLowerCase().includes(search) ||
      pdp.person?.first_name.toLowerCase().includes(search) ||
      pdp.person?.last_name.toLowerCase().includes(search)
    );
  });

  // Filter assignments by search
  const filteredAssignments = (assignments || []).filter((assignment) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      assignment.course?.title_en.toLowerCase().includes(search) ||
      assignment.course?.title_fr?.toLowerCase().includes(search) ||
      assignment.person?.first_name.toLowerCase().includes(search) ||
      assignment.person?.last_name.toLowerCase().includes(search)
    );
  });

  const handleEditPDP = (pdp: PDP) => {
    setEditingPDP(pdp);
    setIsPDPFormOpen(true);
  };

  const handleClosePDPForm = () => {
    setIsPDPFormOpen(false);
    setEditingPDP(null);
  };

  const handleEditAssignment = (assignment: CourseAssignment) => {
    setEditingAssignment(assignment);
    setIsAssignmentFormOpen(true);
  };

  const handleCloseAssignmentForm = () => {
    setIsAssignmentFormOpen(false);
    setEditingAssignment(null);
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: t('people.active'),
      completed: t('goals.completed'),
      on_hold: t('goals.onHold'),
      not_started: t('goals.notStarted'),
      in_progress: t('goals.inProgress'),
      dropped: 'Dropped',
    };
    return labels[status] || status;
  };

  return (
    <MainLayout>
      <PageHeader
        title={t('development.title')}
        subtitle={t('development.subtitle')}
      />

      <Tabs defaultValue="plans" className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <TabsList>
            <TabsTrigger value="plans" className="gap-2">
              <FileText className="h-4 w-4" />
              Development Plans
            </TabsTrigger>
            <TabsTrigger value="assignments" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              Course Assignments
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-[200px]"
              />
            </div>
          </div>
        </div>

        {/* Development Plans Tab */}
        <TabsContent value="plans" className="space-y-4">
          <div className="flex items-center justify-between">
            <Select value={pdpStatus} onValueChange={setPdpStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t('common.all')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('common.all')}</SelectItem>
                <SelectItem value="active">{t('people.active')}</SelectItem>
                <SelectItem value="completed">{t('goals.completed')}</SelectItem>
                <SelectItem value="on_hold">{t('goals.onHold')}</SelectItem>
              </SelectContent>
            </Select>

            {isAdminOrSuper && (
              <Button onClick={() => setIsPDPFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('development.addPlan')}
              </Button>
            )}
          </div>

          {pdpsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPDPs.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-12 w-12" />}
              title="No development plans found"
              description="Create development plans to track personal growth and training"
              action={
                isAdminOrSuper ? {
                  label: t('development.addPlan'),
                  onClick: () => setIsPDPFormOpen(true),
                } : undefined
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPDPs.map((pdp) => (
                <Card
                  key={pdp.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setViewingPDPId(pdp.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base font-semibold line-clamp-1">
                        {getLocalizedField(pdp, 'plan_title')}
                      </CardTitle>
                      {isAdminOrSuper && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 -mt-1 -mr-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditPDP(pdp);
                          }}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>
                        {pdp.person?.first_name} {pdp.person?.last_name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={statusColors[pdp.status || 'active']}>
                        {getStatusLabel(pdp.status || 'active')}
                      </Badge>
                    </div>

                    {pdp.start_date && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(pdp.start_date).toLocaleDateString()}
                          {pdp.target_date && ` → ${new Date(pdp.target_date).toLocaleDateString()}`}
                        </span>
                      </div>
                    )}

                    {pdp.summary_en && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {getLocalizedField(pdp, 'summary')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Course Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4">
          <div className="flex items-center justify-between">
            <Select value={assignmentStatus} onValueChange={setAssignmentStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t('common.all')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('common.all')}</SelectItem>
                <SelectItem value="not_started">{t('goals.notStarted')}</SelectItem>
                <SelectItem value="in_progress">{t('goals.inProgress')}</SelectItem>
                <SelectItem value="completed">{t('goals.completed')}</SelectItem>
                <SelectItem value="dropped">Dropped</SelectItem>
              </SelectContent>
            </Select>

            {isAdminOrSuper && (
              <Button onClick={() => setIsAssignmentFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Assign Course
              </Button>
            )}
          </div>

          {assignmentsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredAssignments.length === 0 ? (
            <EmptyState
              icon={<GraduationCap className="h-12 w-12" />}
              title="No course assignments found"
              description="Assign courses to team members to track their training progress"
              action={
                isAdminOrSuper ? {
                  label: 'Assign Course',
                  onClick: () => setIsAssignmentFormOpen(true),
                } : undefined
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredAssignments.map((assignment) => (
                <Card
                  key={assignment.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleEditAssignment(assignment)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <BookOpen className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-semibold line-clamp-1">
                            {assignment.course?.code && `${assignment.course.code} - `}
                            {getLocalizedField(assignment.course || {}, 'title')}
                          </CardTitle>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>
                        {assignment.person?.first_name} {assignment.person?.last_name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusBadge status={assignment.status as 'not_started' | 'in_progress' | 'completed' | 'dropped'} />
                      {assignment.course?.estimated_duration_hours && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {assignment.course.estimated_duration_hours}h
                        </Badge>
                      )}
                    </div>

                    {assignment.assigned_date && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Assigned: {new Date(assignment.assigned_date).toLocaleDateString()}</span>
                      </div>
                    )}

                    {assignment.completion_date && (
                      <div className="flex items-center gap-2 text-xs text-success">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Completed: {new Date(assignment.completion_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <PDPFormDialog
        open={isPDPFormOpen}
        onOpenChange={handleClosePDPForm}
        pdp={editingPDP}
      />

      <PDPDetailDialog
        open={!!viewingPDPId}
        onOpenChange={(open) => !open && setViewingPDPId(null)}
        pdpId={viewingPDPId}
      />

      <CourseAssignmentDialog
        open={isAssignmentFormOpen}
        onOpenChange={handleCloseAssignmentForm}
        assignment={editingAssignment}
      />
    </MainLayout>
  );
}
