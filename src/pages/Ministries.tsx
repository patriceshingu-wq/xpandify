import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMinistries, Ministry, MinistryTreeNode, buildMinistryTree, getAncestorChain } from '@/hooks/useMinistries';
import { useMinistryMembers } from '@/hooks/useMinistryMembers';
import { usePeople } from '@/hooks/usePeople';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/ui/status-badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Church, User, ArrowLeft, Pencil, ChevronRight, Building2, Target, Calendar, Users as UsersIcon, UsersRound, UserCheck, UserX } from 'lucide-react';
import { useGoals, Goal } from '@/hooks/useGoals';
import { useOrgMinistries, useOrgPeople, OrgMinistry, OrgPerson } from '@/hooks/useOrgChartAPI';
import { MinistryFormDialog } from '@/components/ministries/MinistryFormDialog';
import { MinistryMembersList } from '@/components/ministries/MinistryMembersList';
import React from 'react';

function MinistryTreeItem({
  node,
  onSelect,
  getLocalizedField,
  t,
  depth = 0,
  orgMinistries,
  orgLeaders,
  personIdByName,
}: {
  node: MinistryTreeNode;
  onSelect: (m: Ministry) => void;
  getLocalizedField: (obj: Record<string, unknown>, field: string) => string;
  t: (key: string) => string;
  depth?: number;
  orgMinistries?: OrgMinistry[];
  orgLeaders?: OrgPerson[];
  personIdByName?: Map<string, string>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = node.children.length > 0;

  // Find the org chart leader for this ministry/department by matching names
  const orgLeader = orgLeaders ? (() => {
    const localName = (node.name_en || node.name_fr || '').toLowerCase();
    return orgLeaders.find(p =>
      p.title.toLowerCase().includes(localName) || localName.includes(p.title.toLowerCase())
    );
  })() : undefined;

  const displayLeaderName = orgLeader?.personName
    || (node.leader ? `${node.leader.first_name} ${node.leader.last_name}` : null);
  const hasLeader = !!displayLeaderName;

  return (
    <div className={depth > 0 ? 'ml-6 border-l border-border pl-4' : ''}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="transition-all hover:shadow-md hover:-translate-y-0.5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {hasChildren && (
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={isOpen ? t('common.collapse') : t('common.expand')}
                  >
                    <ChevronRight
                      className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                    />
                  </Button>
                </CollapsibleTrigger>
              )}
              {!hasChildren && <div className="w-8 shrink-0" />}

              <div
                className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
                onClick={() => onSelect(node)}
              >
                <div className="p-2.5 rounded-xl bg-muted shrink-0">
                  {depth === 0 ? (
                    <Church className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-foreground truncate">
                    {getLocalizedField(node as unknown as Record<string, unknown>, 'name')}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                    {hasLeader ? (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <UserCheck className="h-3.5 w-3.5" />
                        {(() => {
                          const personId = node.leader?.id || (displayLeaderName && personIdByName?.get(displayLeaderName.toLowerCase()));
                          const linkTo = personId
                            ? `/people/${personId}`
                            : `/org-chart?search=${encodeURIComponent(displayLeaderName || '')}`;
                          return (
                            <Link
                              to={linkTo}
                              className="text-xs font-medium hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {displayLeaderName}
                            </Link>
                          );
                        })()}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-600">
                        <UserX className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">{t('ministries.noLeader')}</span>
                      </span>
                    )}
                    {hasChildren && (
                      <span className="text-xs">
                        {node.children.length} {node.children.length === 1 ? t('ministries.department') : t('ministries.departments')}
                      </span>
                    )}
                    {orgMinistries && (() => {
                      const localName = (node.name_en || node.name_fr || '').toLowerCase();
                      const orgData = orgMinistries.find(om => om.title.toLowerCase().includes(localName) || localName.includes(om.title.toLowerCase()));
                      if (!orgData) return null;
                      return (
                        <span className="text-xs flex items-center gap-1">
                          <UsersRound className="h-3 w-3" />
                          {orgData.peopleCount} {t('ministries.people')}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {hasChildren && (
          <CollapsibleContent className="mt-2 space-y-2">
            {node.children.map((child) => (
              <MinistryTreeItem
                key={child.id}
                node={child}
                onSelect={onSelect}
                getLocalizedField={getLocalizedField}
                t={t}
                depth={depth + 1}
                orgMinistries={orgMinistries}
                orgLeaders={orgLeaders}
                personIdByName={personIdByName}
              />
            ))}
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
}

const currentYear = new Date().getFullYear();

const QUARTER_LABELS: Record<string, { months: number[]; label: string }> = {
  Q1: { months: [0, 1, 2], label: 'Q1' },
  Q2: { months: [3, 4, 5], label: 'Q2' },
  Q3: { months: [6, 7, 8], label: 'Q3' },
  Q4: { months: [9, 10, 11], label: 'Q4' },
};

function getGoalQuarter(goal: Goal): string | null {
  if (!goal.start_date) return null;
  const month = new Date(goal.start_date).getMonth();
  for (const [q, info] of Object.entries(QUARTER_LABELS)) {
    if (info.months.includes(month)) return q;
  }
  return null;
}

function MinistryGoalsSection({
  ministryId,
  childMinistryIds,
  t,
  getLocalizedField,
}: {
  ministryId: string;
  childMinistryIds: string[];
  t: (key: string) => string;
  getLocalizedField: (obj: Record<string, unknown>, field: string) => string;
}) {
  const [quarterFilter, setQuarterFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState(currentYear);

  // Fetch ministry-level goals for this ministry
  const { data: ministryGoals, isLoading: ministryLoading } = useGoals({
    year: yearFilter,
    goal_level: 'ministry',
    owner_ministry_id: ministryId,
    exclude_pdp_items: true,
  });

  // Fetch department-level goals for child ministries
  const { data: allDeptGoals, isLoading: deptLoading } = useGoals({
    year: yearFilter,
    goal_level: 'department',
    exclude_pdp_items: true,
  });

  // Filter dept goals to only child ministries of this ministry
  const deptGoals = (allDeptGoals || []).filter(
    (g) => g.owner_ministry_id && childMinistryIds.includes(g.owner_ministry_id)
  );

  const allGoals = [...(ministryGoals || []), ...deptGoals];
  const isLoading = ministryLoading || deptLoading;

  // Filter by quarter
  const filteredGoals = quarterFilter === 'all'
    ? allGoals
    : allGoals.filter((g) => getGoalQuarter(g) === quarterFilter);

  // Group by quarter for display
  const goalsByQuarter = new Map<string, Goal[]>();
  for (const goal of filteredGoals) {
    const q = getGoalQuarter(goal) || 'Other';
    if (!goalsByQuarter.has(q)) goalsByQuarter.set(q, []);
    goalsByQuarter.get(q)!.push(goal);
  }

  // Sort quarters in order
  const sortedQuarters = Array.from(goalsByQuarter.entries()).sort(([a], [b]) => {
    const order = ['Q1', 'Q2', 'Q3', 'Q4', 'Other'];
    return order.indexOf(a) - order.indexOf(b);
  });

  const getLevelColor = (lvl: string) => {
    switch (lvl) {
      case 'ministry': return 'bg-info/10 text-info';
      case 'department': return 'bg-warning/10 text-warning';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={yearFilter.toString()} onValueChange={(v) => setYearFilter(parseInt(v))}>
          <SelectTrigger className="w-full sm:w-32" aria-label="Filter by year">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
              <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={quarterFilter} onValueChange={setQuarterFilter}>
          <SelectTrigger className="w-full sm:w-40" aria-label="Filter by quarter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('goals.allQuarters')}</SelectItem>
            <SelectItem value="Q1">{t('goals.q1')}</SelectItem>
            <SelectItem value="Q2">{t('goals.q2')}</SelectItem>
            <SelectItem value="Q3">{t('goals.q3')}</SelectItem>
            <SelectItem value="Q4">{t('goals.q4')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="spinner" />
        </div>
      ) : filteredGoals.length === 0 ? (
        <EmptyState
          icon={<Target className="h-12 w-12" />}
          title={t('ministries.noGoals')}
          description=""
        />
      ) : (
        <div className="space-y-6">
          {sortedQuarters.map(([quarterKey, goals]) => (
            <div key={quarterKey} className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm font-semibold">
                  {quarterKey}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {goals.length} {goals.length === 1 ? 'goal' : 'goals'}
                </span>
              </div>
              <div className="space-y-2">
                {goals.map((goal) => (
                  <Card key={goal.id} className="transition-all hover:shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getLevelColor(goal.goal_level)}`}>
                              {goal.goal_level === 'ministry' ? t('goals.ministry') : t('goals.department')}
                            </span>
                            <StatusBadge status={goal.status} />
                            {goal.category && (
                              <Badge variant="outline" className="text-xs">
                                {t(`goals.category.${goal.category}`) || goal.category}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium text-foreground leading-snug">
                            {getLocalizedField(goal as unknown as Record<string, unknown>, 'title')}
                          </p>
                          {goal.owner_ministry && goal.goal_level === 'department' && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {getLocalizedField(goal.owner_ministry as unknown as Record<string, unknown>, 'name')}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-bold">{goal.progress_percent || 0}%</span>
                          <Progress value={goal.progress_percent || 0} className="h-2 w-16" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Ministries() {
  const { id: ministryId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { t, getLocalizedField } = useLanguage();
  const { isAdminOrSuper, person } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMinistry, setEditingMinistry] = useState<Ministry | null>(null);
  const [parentForNewMinistry, setParentForNewMinistry] = useState<string | undefined>();

  const { data: ministries, isLoading } = useMinistries();
  const { data: orgMinistries } = useOrgMinistries();
  // Fetch ministry-system and department leaders from org chart API
  const { data: orgMinistryLeaders } = useOrgPeople({ category: 'ministry-system' });
  const { data: orgDeptLeaders } = useOrgPeople({ category: 'department' });
  const orgLeaders = [...(orgMinistryLeaders || []), ...(orgDeptLeaders || [])];

  // Build a name→ID lookup from local people for linking org API leaders to profiles
  const { data: allPeople } = usePeople();
  const personIdByName = useMemo(() => {
    const map = new Map<string, string>();
    if (allPeople) {
      for (const p of allPeople) {
        const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
        map.set(fullName, p.id);
        if (p.preferred_name) {
          map.set(`${p.preferred_name} ${p.last_name}`.toLowerCase(), p.id);
        }
      }
    }
    return map;
  }, [allPeople]);

  // Helper to find org API ministry data matching a local ministry by name
  const getOrgMinistryData = (ministry: Ministry): OrgMinistry | undefined => {
    if (!orgMinistries) return undefined;
    const localName = (ministry.name_en || ministry.name_fr || '').toLowerCase();
    return orgMinistries.find(om => om.title.toLowerCase().includes(localName) || localName.includes(om.title.toLowerCase()));
  };

  // Find the selected ministry from URL param
  const selectedMinistry = ministryId && ministries
    ? ministries.find(m => m.id === ministryId) || null
    : null;

  const { data: members = [], isLoading: membersLoading } = useMinistryMembers(selectedMinistry?.id);

  const isLeaderOfSelected = selectedMinistry?.leader_id && person?.id === selectedMinistry.leader_id;
  const canManageMembers = isAdminOrSuper || !!isLeaderOfSelected;

  const tree = ministries ? buildMinistryTree(ministries) : [];
  const childMinistries = ministries?.filter(m => m.parent_ministry_id === selectedMinistry?.id) || [];

  const handleEdit = (ministry: Ministry) => {
    setEditingMinistry(ministry);
    setParentForNewMinistry(undefined);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingMinistry(null);
    setParentForNewMinistry(undefined);
  };

  const handleAddDepartment = (parentId: string) => {
    setEditingMinistry(null);
    setParentForNewMinistry(parentId);
    setIsFormOpen(true);
  };

  const handleBreadcrumbNavigate = (ministry: Ministry | null) => {
    if (ministry) {
      navigate(`/ministries/${ministry.id}`);
    } else {
      navigate('/ministries');
    }
  };

  // Detail view
  if (selectedMinistry) {
    const ancestors = ministries ? getAncestorChain(ministries, selectedMinistry.id) : [];

    return (
      <MainLayout title={getLocalizedField(selectedMinistry, 'name')} subtitle={t('ministries.ministryDetails')}>
        <div className="space-y-6 animate-fade-in">
          {/* Breadcrumbs */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  className="cursor-pointer"
                  onClick={() => handleBreadcrumbNavigate(null)}
                >
                  {t('nav.ministries')}
                </BreadcrumbLink>
              </BreadcrumbItem>
              {ancestors.map((ancestor) => (
                <React.Fragment key={ancestor.id}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      className="cursor-pointer"
                      onClick={() => handleBreadcrumbNavigate(ancestor)}
                    >
                      {getLocalizedField(ancestor, 'name')}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </React.Fragment>
              ))}
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{getLocalizedField(selectedMinistry, 'name')}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => {
              if (selectedMinistry.parent_ministry_id) {
                navigate(`/ministries/${selectedMinistry.parent_ministry_id}`);
              } else {
                navigate('/ministries');
              }
            }}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{getLocalizedField(selectedMinistry, 'name')}</h1>
              {getLocalizedField(selectedMinistry, 'description') && (
                <p className="text-muted-foreground mt-1">{getLocalizedField(selectedMinistry, 'description')}</p>
              )}
            </div>
            {isAdminOrSuper && (
              <Button variant="outline" size="sm" onClick={() => handleEdit(selectedMinistry)} className="gap-2">
                <Pencil className="h-4 w-4" />
                {t('common.edit')}
              </Button>
            )}
          </div>

          {/* Ministry Leader — prefer org API data, fallback to local DB */}
          {(() => {
            const localName = (selectedMinistry.name_en || selectedMinistry.name_fr || '').toLowerCase();
            const orgLeader = orgLeaders.find(p =>
              p.title.toLowerCase().includes(localName) || localName.includes(p.title.toLowerCase())
            );
            const leaderName = orgLeader?.personName
              || (selectedMinistry.leader ? `${selectedMinistry.leader.first_name} ${selectedMinistry.leader.last_name}` : null);
            const leaderTitle = orgLeader?.personTitle;

            const leaderId = selectedMinistry.leader?.id || personIdByName.get(leaderName?.toLowerCase() || '');
            const displayName = leaderTitle ? `${leaderTitle} ${leaderName}` : leaderName;

            return leaderName ? (
              <div className="flex items-center gap-2 text-sm">
                <UserCheck className="h-4 w-4 text-emerald-600" />
                <span className="text-muted-foreground">{t('ministries.ledBy')}</span>
                <Link
                  to={leaderId ? `/people/${leaderId}` : `/org-chart?search=${encodeURIComponent(leaderName)}`}
                  className="font-medium text-primary hover:underline"
                >
                  {displayName}
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <UserX className="h-4 w-4 text-amber-600" />
                <span className="text-amber-600 font-medium">{t('ministries.noLeader')}</span>
              </div>
            );
          })()}

          {/* Live stats from Org Chart API */}
          {(() => {
            const orgData = getOrgMinistryData(selectedMinistry);
            if (!orgData) return null;
            return (
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-semibold">{orgData.peopleCount}</p>
                  <p className="text-xs text-muted-foreground">{t('ministries.totalPeople')}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-semibold">{orgData.departmentCount}</p>
                  <p className="text-xs text-muted-foreground">{t('ministries.totalDepartments')}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-semibold">
                    {orgData.departments.filter(d => d.status === 'active').length}
                  </p>
                  <p className="text-xs text-muted-foreground">{t('ministries.activeDepartments')}</p>
                </div>
              </div>
            );
          })()}

          <Separator />

          {/* Sub-Ministries / Departments */}
          {(childMinistries.length > 0 || isAdminOrSuper) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{t('ministries.subMinistries')}</h2>
                {isAdminOrSuper && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddDepartment(selectedMinistry.id)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    {t('ministries.addDepartment')}
                  </Button>
                )}
              </div>
              {childMinistries.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {childMinistries.map((child) => {
                    // Find org API leader for this department
                    const childLocalName = (child.name_en || child.name_fr || '').toLowerCase();
                    const deptOrgLeader = orgLeaders.find(p =>
                      p.title.toLowerCase().includes(childLocalName) || childLocalName.includes(p.title.toLowerCase())
                    );
                    const deptLeaderName = deptOrgLeader?.personName
                      || (child.leader ? `${child.leader.first_name} ${child.leader.last_name}` : null);

                    // Find org ministry data for people count
                    const orgData = getOrgMinistryData(selectedMinistry);
                    const deptOrgData = orgData?.departments.find(d =>
                      d.title.toLowerCase().includes(childLocalName) || childLocalName.includes(d.title.toLowerCase())
                    );

                    return (
                      <Card
                        key={child.id}
                        className="transition-all hover:shadow-md cursor-pointer hover:-translate-y-0.5"
                        onClick={() => navigate(`/ministries/${child.id}`)}
                      >
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-muted">
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-foreground truncate">
                              {getLocalizedField(child, 'name')}
                            </h3>
                            <div className="flex items-center gap-2 flex-wrap mt-0.5">
                              {deptLeaderName ? (
                                <span className="text-xs text-emerald-600 flex items-center gap-1">
                                  <UserCheck className="h-3 w-3" />
                                  {(() => {
                                    const deptLeaderId = child.leader?.id || personIdByName.get(deptLeaderName.toLowerCase());
                                    const deptLinkTo = deptLeaderId
                                      ? `/people/${deptLeaderId}`
                                      : `/org-chart?search=${encodeURIComponent(deptLeaderName)}`;
                                    return (
                                      <Link
                                        to={deptLinkTo}
                                        className="hover:underline"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {deptLeaderName}
                                      </Link>
                                    );
                                  })()}
                                </span>
                              ) : (
                                <span className="text-xs text-amber-600 flex items-center gap-1">
                                  <UserX className="h-3 w-3" />
                                  {t('ministries.noLeader')}
                                </span>
                              )}
                              {deptOrgData && deptOrgData.peopleCount > 0 && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <UsersRound className="h-3 w-3" />
                                  {deptOrgData.peopleCount}
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t('ministries.noDepartments')}</p>
              )}
              <Separator />
            </div>
          )}

          {/* Tabs: Goals + Members */}
          <Tabs defaultValue="goals" className="space-y-4">
            <TabsList>
              <TabsTrigger value="goals" className="gap-1.5">
                <Target className="h-4 w-4" />
                {t('ministries.goals')}
              </TabsTrigger>
              <TabsTrigger value="members" className="gap-1.5">
                <UsersIcon className="h-4 w-4" />
                {t('ministries.members')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="goals">
              <MinistryGoalsSection
                ministryId={selectedMinistry.id}
                childMinistryIds={childMinistries.map(c => c.id)}
                t={t}
                getLocalizedField={getLocalizedField}
              />
            </TabsContent>

            <TabsContent value="members">
              <MinistryMembersList
                ministryId={selectedMinistry.id}
                members={members}
                isLoading={membersLoading}
                canManage={canManageMembers}
              />
            </TabsContent>
          </Tabs>
        </div>

        {isAdminOrSuper && (
          <MinistryFormDialog
            open={isFormOpen}
            onOpenChange={handleCloseForm}
            ministry={editingMinistry}
            ministries={ministries || []}
            defaultParentId={parentForNewMinistry}
          />
        )}
      </MainLayout>
    );
  }

  // List view
  return (
    <MainLayout title={t('nav.ministries')} subtitle={t('ministries.subtitle')}>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title={t('nav.ministries')}
          subtitle={t('ministries.subtitle')}
          actions={
            isAdminOrSuper && (
              <Button onClick={() => { setParentForNewMinistry(undefined); setIsFormOpen(true); }} className="gap-2">
                <Plus className="h-4 w-4" />
                {t('ministries.addMinistry')}
              </Button>
            )
          }
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner" />
          </div>
        ) : tree.length > 0 ? (
          <div className="space-y-3">
            {tree.map((node) => (
              <MinistryTreeItem
                key={node.id}
                node={node}
                onSelect={(m) => navigate(`/ministries/${m.id}`)}
                getLocalizedField={getLocalizedField}
                t={t}
                orgMinistries={orgMinistries}
                orgLeaders={orgLeaders}
                personIdByName={personIdByName}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Church className="h-16 w-16" />}
            title={t('common.noResults')}
            description={t('ministries.noMinistries')}
            action={isAdminOrSuper ? {
              label: t('ministries.addMinistry'),
              onClick: () => setIsFormOpen(true),
            } : undefined}
          />
        )}
      </div>

      {isAdminOrSuper && (
        <MinistryFormDialog
          open={isFormOpen}
          onOpenChange={handleCloseForm}
          ministry={editingMinistry}
          ministries={ministries || []}
          defaultParentId={parentForNewMinistry}
        />
      )}
    </MainLayout>
  );
}
