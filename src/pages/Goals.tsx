import { useState, useCallback, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useGoals, Goal } from '@/hooks/useGoals';
import { useDevelopmentPlans, PDP } from '@/hooks/useDevelopmentPlans';
import { useMinistries } from '@/hooks/useMinistries';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { GoalCardSkeleton, ListSkeleton } from '@/components/ui/mobile-skeletons';
import {
  Plus, Target, Calendar, User, Building, Search, FileText,
  GitBranch, Loader2, Church, Users,
} from 'lucide-react';
import { GoalFormDialog } from '@/components/goals/GoalFormDialog';
import { PDPFormDialog } from '@/components/development/PDPFormDialog';
import { PDPDetailDialog } from '@/components/development/PDPDetailDialog';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const currentYear = new Date().getFullYear();

const pdpStatusColors: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/20',
  completed: 'bg-info/10 text-info border-info/20',
  on_hold: 'bg-warning/10 text-warning border-warning/20',
  not_started: 'bg-muted text-muted-foreground',
  in_progress: 'bg-info/10 text-info border-info/20',
  dropped: 'bg-destructive/10 text-destructive border-destructive/20',
};

function useUserMinistryIds(personId: string | undefined) {
  return useQuery({
    queryKey: ['user-ministry-ids', personId],
    queryFn: async () => {
      if (!personId) return [];
      const { data, error } = await supabase
        .from('people_ministries')
        .select('ministry_id')
        .eq('person_id', personId);
      if (error) throw error;
      return (data || []).map((d) => d.ministry_id);
    },
    enabled: !!personId,
  });
}

function useUserLeaderMinistryIds(personId: string | undefined) {
  return useQuery({
    queryKey: ['user-leader-ministry-ids', personId],
    queryFn: async () => {
      if (!personId) return [];
      const { data, error } = await supabase
        .from('ministries')
        .select('id')
        .eq('leader_id', personId);
      if (error) throw error;
      return (data || []).map((d) => d.id);
    },
    enabled: !!personId,
  });
}

export default function Goals() {
  const { t, getLocalizedField } = useLanguage();
  const { isAdminOrSuper, person } = useAuth();
  const queryClient = useQueryClient();

  // Determine default tab based on role
  const defaultTab = isAdminOrSuper ? 'church' : 'my';
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Goals state
  const [year, setYear] = useState(currentYear);
  const [status, setStatus] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [presetLevel, setPresetLevel] = useState<'church' | 'ministry' | 'department' | 'individual' | undefined>();

  // PDP state
  const [pdpStatus, setPdpStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPDPFormOpen, setIsPDPFormOpen] = useState(false);
  const [editingPDP, setEditingPDP] = useState<PDP | null>(null);
  const [viewingPDPId, setViewingPDPId] = useState<string | null>(null);

  // User's ministries
  const { data: userMinistryIds } = useUserMinistryIds(person?.id);
  const { data: leaderMinistryIds } = useUserLeaderMinistryIds(person?.id);
  const isMinistryLeader = (leaderMinistryIds && leaderMinistryIds.length > 0) || false;

  // Data queries per tab
  const { data: myGoals, isLoading: myGoalsLoading } = useGoals({
    year,
    goal_level: 'individual',
    status: status !== 'all' ? status : undefined,
    owner_person_id: person?.id,
    exclude_pdp_items: true,
  });

  const { data: allMinistryGoals, isLoading: ministryGoalsLoading } = useGoals({
    year,
    goal_level: 'ministry',
    status: status !== 'all' ? status : undefined,
    exclude_pdp_items: true,
  });

  // Filter ministry goals to user's ministries client-side
  const ministryGoals = (allMinistryGoals || []).filter(
    (g) => !userMinistryIds || userMinistryIds.length === 0 || userMinistryIds.includes(g.owner_ministry_id || '')
  );

  const { data: allDeptGoals, isLoading: deptGoalsLoading } = useGoals({
    year,
    goal_level: 'department',
    status: status !== 'all' ? status : undefined,
    exclude_pdp_items: true,
  });

  // Filter department goals to user's ministries client-side
  const departmentGoals = (allDeptGoals || []).filter(
    (g) => !userMinistryIds || userMinistryIds.length === 0 || userMinistryIds.includes(g.owner_ministry_id || '')
  );

  const { data: churchGoals, isLoading: churchGoalsLoading } = useGoals({
    year,
    goal_level: 'church',
    status: status !== 'all' ? status : undefined,
    exclude_pdp_items: true,
  });

  const { data: pdps, isLoading: pdpsLoading } = useDevelopmentPlans({
    status: pdpStatus === 'all' ? undefined : pdpStatus,
  });

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['goals'] });
  }, [queryClient]);

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setPresetLevel(undefined);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingGoal(null);
    setPresetLevel(undefined);
  };

  const handleCreateWithLevel = (level: 'church' | 'ministry' | 'department' | 'individual') => {
    setEditingGoal(null);
    setPresetLevel(level);
    setIsFormOpen(true);
  };

  // PDP helpers
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

  const getStatusLabel = (s: string) => {
    const labels: Record<string, string> = {
      active: t('people.active'),
      completed: t('goals.completed'),
      on_hold: t('goals.onHold'),
      not_started: t('goals.notStarted'),
      in_progress: t('goals.inProgress'),
      dropped: 'Dropped',
    };
    return labels[s] || s;
  };

  const getLevelIcon = (lvl: string) => {
    switch (lvl) {
      case 'church': return <Church className="h-4 w-4" />;
      case 'ministry': return <Building className="h-4 w-4" />;
      case 'department': return <Users className="h-4 w-4" />;
      case 'individual': return <User className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getLevelColor = (lvl: string) => {
    switch (lvl) {
      case 'church': return 'bg-accent/10 text-accent';
      case 'ministry': return 'bg-info/10 text-info';
      case 'department': return 'bg-warning/10 text-warning';
      case 'individual': return 'bg-success/10 text-success';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  // Status filter bar (reusable across tabs)
  const renderFilters = () => (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder={t('common.year')} />
            </SelectTrigger>
            <SelectContent>
              {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder={t('common.status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              <SelectItem value="not_started">{t('goals.notStarted')}</SelectItem>
              <SelectItem value="in_progress">{t('goals.inProgress')}</SelectItem>
              <SelectItem value="completed">{t('goals.completed')}</SelectItem>
              <SelectItem value="on_hold">{t('goals.onHold')}</SelectItem>
              <SelectItem value="cancelled">{t('goals.cancelled')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );

  // Goal list renderer
  const renderGoalList = (goals: Goal[] | undefined, loading: boolean, emptyAction?: () => void) => {
    if (loading) {
      return <ListSkeleton count={4} ItemComponent={GoalCardSkeleton} />;
    }
    if (!goals || goals.length === 0) {
      return (
        <EmptyState
          icon={<Target className="h-16 w-16" />}
          title={t('common.noResults')}
          description="No goals found for the selected filters"
          action={emptyAction ? { label: t('goals.addGoal'), onClick: emptyAction } : undefined}
        />
      );
    }
    return (
      <div className="space-y-4">
        {goals.map((goal) => (
          <Card
            key={goal.id}
            className="cursor-pointer transition-all hover:shadow-md"
            onClick={() => handleEdit(goal)}
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${getLevelColor(goal.goal_level)}`}>
                      {getLevelIcon(goal.goal_level)}
                      {t(`goals.${goal.goal_level}`)}
                    </span>
                    <StatusBadge status={goal.status} />
                  </div>
                  <h3 className="font-medium text-base sm:text-lg text-foreground leading-snug">
                    {getLocalizedField(goal, 'title')}
                  </h3>
                  {getLocalizedField(goal, 'description') && (
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {getLocalizedField(goal, 'description')}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    {goal.owner_person && (
                      <span className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 shrink-0" />
                        {goal.owner_person.first_name} {goal.owner_person.last_name}
                      </span>
                    )}
                    {goal.due_date && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        {new Date(goal.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:min-w-[100px]">
                  <div className="text-xl sm:text-2xl font-bold text-foreground">
                    {goal.progress_percent}%
                  </div>
                  <Progress value={goal.progress_percent} className="h-2 w-24 sm:w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <MainLayout title={t('goals.title')} subtitle={t('goals.subtitle')}>
      <PullToRefresh onRefresh={handleRefresh} className="min-h-[calc(100vh-12rem)]">
        <div className="space-y-6 animate-fade-in">
          <PageHeader
            title={t('goals.title')}
            subtitle={t('goals.subtitle')}
          />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 sm:w-auto sm:inline-flex">
              <TabsTrigger value="my" className="gap-1.5 touch-target">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">My Goals</span>
                <span className="sm:hidden text-xs">My</span>
              </TabsTrigger>
              <TabsTrigger value="ministry" className="gap-1.5 touch-target">
                <Building className="h-4 w-4" />
                <span className="hidden sm:inline">Ministry</span>
                <span className="sm:hidden text-xs">Ministry</span>
              </TabsTrigger>
              <TabsTrigger value="church" className="gap-1.5 touch-target">
                <Church className="h-4 w-4" />
                <span className="hidden sm:inline">Church</span>
                <span className="sm:hidden text-xs">Church</span>
              </TabsTrigger>
              <TabsTrigger value="cascade" className="gap-1.5 touch-target">
                <GitBranch className="h-4 w-4" />
                <span className="hidden sm:inline">Cascade</span>
                <span className="sm:hidden text-xs">Cascade</span>
              </TabsTrigger>
              <TabsTrigger value="plans" className="gap-1.5 touch-target">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Dev Plans</span>
                <span className="sm:hidden text-xs">Plans</span>
              </TabsTrigger>
            </TabsList>

            {/* ========== My Goals Tab ========== */}
            <TabsContent value="my" className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div />
                <Button onClick={() => handleCreateWithLevel('individual')} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Goal
                </Button>
              </div>
              {renderFilters()}
              {renderGoalList(myGoals, myGoalsLoading, () => handleCreateWithLevel('individual'))}
            </TabsContent>

            {/* ========== Ministry Goals Tab ========== */}
            <TabsContent value="ministry" className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div />
                {(isMinistryLeader || isAdminOrSuper) && (
                  <Button onClick={() => handleCreateWithLevel('ministry')} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Ministry Goal
                  </Button>
                )}
              </div>
              {renderFilters()}
              {renderGoalList(ministryGoals, ministryGoalsLoading)}
            </TabsContent>

            {/* ========== Church Goals Tab ========== */}
            <TabsContent value="church" className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div />
                {isAdminOrSuper && (
                  <Button onClick={() => handleCreateWithLevel('church')} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Church Goal
                  </Button>
                )}
              </div>
              {renderFilters()}
              {renderGoalList(churchGoals, churchGoalsLoading)}
            </TabsContent>

            {/* ========== Cascade View Tab ========== */}
            <TabsContent value="cascade" className="space-y-4">
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <GitBranch className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Cascade View</h3>
                  <p className="text-muted-foreground max-w-md">
                    Coming in Week 4 — A tree visualization showing how individual goals align up through ministry goals to church-wide objectives.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ========== Development Plans Tab ========== */}
            <TabsContent value="plans" className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex gap-2">
                  <Select value={pdpStatus} onValueChange={setPdpStatus}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder={t('common.all')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('common.all')}</SelectItem>
                      <SelectItem value="active">{t('people.active')}</SelectItem>
                      <SelectItem value="completed">{t('goals.completed')}</SelectItem>
                      <SelectItem value="on_hold">{t('goals.onHold')}</SelectItem>
                    </SelectContent>
                  </Select>
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
                                setEditingPDP(pdp);
                                setIsPDPFormOpen(true);
                              }}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-0">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4 shrink-0" />
                          <span>{pdp.person?.first_name} {pdp.person?.last_name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={pdpStatusColors[pdp.status || 'active']}>
                            {getStatusLabel(pdp.status || 'active')}
                          </Badge>
                        </div>
                        {pdp.start_date && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                            <span className="leading-relaxed">
                              {new Date(pdp.start_date).toLocaleDateString()}
                              {pdp.target_date && (
                                <> – {new Date(pdp.target_date).toLocaleDateString()}</>
                              )}
                            </span>
                          </div>
                        )}
                        {pdp.summary_en && (
                          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                            {getLocalizedField(pdp, 'summary')}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </PullToRefresh>

      {/* Dialogs */}
      <GoalFormDialog
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        goal={editingGoal}
        presetLevel={presetLevel}
      />
      <PDPFormDialog
        open={isPDPFormOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsPDPFormOpen(false);
            setEditingPDP(null);
          }
        }}
        pdp={editingPDP}
      />
      <PDPDetailDialog
        open={!!viewingPDPId}
        onOpenChange={(open) => !open && setViewingPDPId(null)}
        pdpId={viewingPDPId}
      />
    </MainLayout>
  );
}
