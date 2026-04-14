import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { 
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePeople } from '@/hooks/usePeople';
import { useGoals } from '@/hooks/useGoals';
import { useCourseAssignments } from '@/hooks/useCourseAssignments';
import { useCourses } from '@/hooks/useCourses';
import { useMinistries } from '@/hooks/useMinistries';
import { useMeetings } from '@/hooks/useMeetings';
import { 
  BarChart3, Download, Calendar, Users, Target, GraduationCap, 
  Building2, TrendingUp, FileText, Loader2, Filter
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

const COLORS = {
  primary: 'hsl(var(--primary))',
  accent: 'hsl(var(--accent))',
  success: 'hsl(var(--success))',
  warning: 'hsl(var(--warning))',
  info: 'hsl(var(--info))',
  destructive: 'hsl(var(--destructive))',
  muted: 'hsl(var(--muted-foreground))',
};

export default function Analytics() {
  const { t, getLocalizedField } = useLanguage();
  const [dateRange, setDateRange] = useState({
    start: format(subMonths(new Date(), 6), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });
  const [selectedMinistry, setSelectedMinistry] = useState<string>('all');

  // Fetch data
  const { data: people, isLoading: peopleLoading } = usePeople();
  const { data: goals, isLoading: goalsLoading } = useGoals();
  const { data: assignments, isLoading: assignmentsLoading } = useCourseAssignments();
  const { data: courses, isLoading: coursesLoading } = useCourses();
  const { data: ministries, isLoading: ministriesLoading } = useMinistries();
  const { data: meetings, isLoading: meetingsLoading } = useMeetings();

  const isLoading = peopleLoading || goalsLoading || assignmentsLoading || coursesLoading || ministriesLoading || meetingsLoading;

  // Calculate People Stats
  const peopleStats = {
    total: people?.length || 0,
    staff: (people || []).filter(p => p.person_type === 'staff').length,
    volunteers: (people || []).filter(p => p.person_type === 'volunteer').length,
    active: (people || []).filter(p => p.status === 'active').length,
    inactive: (people || []).filter(p => p.status === 'inactive').length,
    onLeave: (people || []).filter(p => p.status === 'on_leave').length,
  };

  // Calculate Goal Stats
  const goalStats = {
    total: goals?.length || 0,
    completed: (goals || []).filter(g => g.status === 'completed').length,
    inProgress: (goals || []).filter(g => g.status === 'in_progress').length,
    notStarted: (goals || []).filter(g => g.status === 'not_started').length,
    onHold: (goals || []).filter(g => g.status === 'on_hold').length,
    cancelled: (goals || []).filter(g => g.status === 'cancelled').length,
  };

  // Calculate Training Stats
  const trainingStats = {
    totalAssignments: assignments?.length || 0,
    completed: (assignments || []).filter(a => a.status === 'completed').length,
    inProgress: (assignments || []).filter(a => a.status === 'in_progress').length,
    notStarted: (assignments || []).filter(a => a.status === 'not_started').length,
    dropped: (assignments || []).filter(a => a.status === 'dropped').length,
    totalCourses: courses?.length || 0,
    activeCourses: (courses || []).filter(c => c.is_active).length,
  };

  // Chart Data
  const goalStatusData = [
    { name: t('goals.completed'), value: goalStats.completed, fill: COLORS.success },
    { name: t('goals.inProgress'), value: goalStats.inProgress, fill: COLORS.info },
    { name: t('goals.notStarted'), value: goalStats.notStarted, fill: COLORS.muted },
    { name: t('goals.onHold'), value: goalStats.onHold, fill: COLORS.warning },
    { name: t('goals.cancelled'), value: goalStats.cancelled, fill: COLORS.destructive },
  ].filter(d => d.value > 0);

  const trainingStatusData = [
    { name: t('goals.completed'), value: trainingStats.completed, fill: COLORS.success },
    { name: t('goals.inProgress'), value: trainingStats.inProgress, fill: COLORS.info },
    { name: t('goals.notStarted'), value: trainingStats.notStarted, fill: COLORS.muted },
    { name: 'Dropped', value: trainingStats.dropped, fill: COLORS.destructive },
  ].filter(d => d.value > 0);

  const personTypeData = [
    { name: 'Staff', value: peopleStats.staff, fill: COLORS.info },
    { name: 'Volunteers', value: peopleStats.volunteers, fill: COLORS.success },
  ];

  const personStatusData = [
    { name: t('people.active'), value: peopleStats.active, fill: COLORS.success },
    { name: t('people.inactive'), value: peopleStats.inactive, fill: COLORS.muted },
    { name: t('people.onLeave'), value: peopleStats.onLeave, fill: COLORS.warning },
  ].filter(d => d.value > 0);

  // Goals by level
  const goalsByLevel = [
    { level: 'Church', count: (goals || []).filter(g => g.goal_level === 'church').length },
    { level: 'Ministry', count: (goals || []).filter(g => g.goal_level === 'ministry').length },
    { level: 'Department', count: (goals || []).filter(g => g.goal_level === 'department').length },
    { level: 'Individual', count: (goals || []).filter(g => g.goal_level === 'individual').length },
  ];

  // Course categories distribution
  const coursesByCategory = (courses || []).reduce((acc, course) => {
    const cat = course.category || 'other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const courseCategoryData = Object.entries(coursesByCategory).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '),
    value,
  }));

  // Export functions
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const exportPeopleReport = () => {
    const data = (people || []).map(p => ({
      Name: `${p.first_name} ${p.last_name}`,
      Type: p.person_type,
      Status: p.status,
      Email: p.email || '',
      Phone: p.phone || '',
      Campus: p.campus || '',
      StartDate: p.start_date || '',
    }));
    exportToCSV(data, 'people_report');
  };

  const exportGoalsReport = () => {
    const data = (goals || []).map(g => ({
      Title: g.title_en,
      Level: g.goal_level,
      Status: g.status,
      Progress: `${g.progress_percent || 0}%`,
      Year: g.year,
      StartDate: g.start_date || '',
      DueDate: g.due_date || '',
    }));
    exportToCSV(data, 'goals_report');
  };

  const exportTrainingReport = () => {
    const data = (assignments || []).map(a => ({
      Person: `${a.person?.first_name || ''} ${a.person?.last_name || ''}`,
      Course: a.course?.title_en || '',
      CourseCode: a.course?.code || '',
      Status: a.status,
      AssignedDate: a.assigned_date || '',
      CompletionDate: a.completion_date || '',
    }));
    exportToCSV(data, 'training_report');
  };

  const chartConfig = {
    value: { label: 'Count' },
    count: { label: 'Count' },
  };

  return (
    <MainLayout>
      <PageHeader
        title="Analytics & Reports"
        subtitle="Comprehensive insights and exportable data"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportPeopleReport}>
              <Download className="h-4 w-4 mr-2" />
              Export People
            </Button>
            <Button variant="outline" onClick={exportGoalsReport}>
              <Download className="h-4 w-4 mr-2" />
              Export Goals
            </Button>
            <Button variant="outline" onClick={exportTrainingReport}>
              <Download className="h-4 w-4 mr-2" />
              Export Training
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Start Date</Label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-[150px]"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">End Date</Label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-[150px]"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Ministry</Label>
              <Select value={selectedMinistry} onValueChange={setSelectedMinistry}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Ministries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ministries</SelectItem>
                  {(ministries || []).map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {getLocalizedField(m, 'name')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 sm:w-auto sm:inline-flex">
            <TabsTrigger value="overview" className="touch-target">Overview</TabsTrigger>
            <TabsTrigger value="people" className="touch-target">People</TabsTrigger>
            <TabsTrigger value="goals" className="touch-target">Goals</TabsTrigger>
            <TabsTrigger value="training" className="touch-target">Training</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-info" />
                    <div>
                      <p className="text-2xl font-bold">{peopleStats.active}</p>
                      <p className="text-xs text-muted-foreground">Active People</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-2xl font-bold">{goalStats.total}</p>
                      <p className="text-xs text-muted-foreground">Total Goals</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-success" />
                    <div>
                      <p className="text-2xl font-bold">
                        {goalStats.total > 0 ? Math.round((goalStats.completed / goalStats.total) * 100) : 0}%
                      </p>
                      <p className="text-xs text-muted-foreground">Goals Complete</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-warning" />
                    <div>
                      <p className="text-2xl font-bold">{trainingStats.totalAssignments}</p>
                      <p className="text-xs text-muted-foreground">Course Assignments</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{trainingStats.activeCourses}</p>
                      <p className="text-xs text-muted-foreground">Active Courses</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-destructive" />
                    <div>
                      <p className="text-2xl font-bold">{ministries?.length || 0}</p>
                      <p className="text-xs text-muted-foreground">Ministries</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Goal Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Goal Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[220px]">
                    <PieChart>
                      <Pie data={goalStatusData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={2}>
                        {goalStatusData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} stroke="transparent" />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend verticalAlign="bottom" height={36} formatter={(v) => <span className="text-xs">{v}</span>} />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Training Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Training Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[220px]">
                    <PieChart>
                      <Pie data={trainingStatusData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={2}>
                        {trainingStatusData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} stroke="transparent" />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend verticalAlign="bottom" height={36} formatter={(v) => <span className="text-xs">{v}</span>} />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Person Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Team Composition</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[220px]">
                    <PieChart>
                      <Pie data={personTypeData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={2}>
                        {personTypeData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} stroke="transparent" />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend verticalAlign="bottom" height={36} formatter={(v) => <span className="text-xs">{v}</span>} />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Goals by Level */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Goals by Level</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[250px]">
                  <BarChart data={goalsByLevel}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="level" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* People Tab */}
          <TabsContent value="people" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">People by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[250px]">
                    <PieChart>
                      <Pie data={personTypeData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                        {personTypeData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} stroke="transparent" />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">People by Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[250px]">
                    <PieChart>
                      <Pie data={personStatusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                        {personStatusData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} stroke="transparent" />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* People Table */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">People Directory</CardTitle>
                <Button variant="outline" size="sm" onClick={exportPeopleReport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Start Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(people || []).slice(0, 10).map((person) => (
                      <TableRow key={person.id}>
                        <TableCell className="font-medium">
                          {person.first_name} {person.last_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{person.person_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={
                              person.status === 'active' ? 'bg-success/10 text-success border-success/20' :
                              person.status === 'on_leave' ? 'bg-warning/10 text-warning border-warning/20' :
                              'bg-muted text-muted-foreground'
                            }
                          >
                            {person.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{person.email || '-'}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {person.start_date ? format(new Date(person.start_date), 'MMM d, yyyy') : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {(people?.length || 0) > 10 && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Showing 10 of {people?.length} records. Export for full data.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Goal Completion Rate</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-success">
                      {goalStats.total > 0 ? Math.round((goalStats.completed / goalStats.total) * 100) : 0}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {goalStats.completed} of {goalStats.total} goals completed
                    </p>
                  </div>
                  <Progress 
                    value={goalStats.total > 0 ? (goalStats.completed / goalStats.total) * 100 : 0} 
                    className="h-3"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Goals Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { label: t('goals.completed'), value: goalStats.completed, color: 'text-success' },
                      { label: t('goals.inProgress'), value: goalStats.inProgress, color: 'text-info' },
                      { label: t('goals.notStarted'), value: goalStats.notStarted, color: 'text-muted-foreground' },
                      { label: t('goals.onHold'), value: goalStats.onHold, color: 'text-warning' },
                      { label: t('goals.cancelled'), value: goalStats.cancelled, color: 'text-destructive' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <span className="text-sm">{item.label}</span>
                        <span className={`font-semibold ${item.color}`}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Goals Table */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Goals List</CardTitle>
                <Button variant="outline" size="sm" onClick={exportGoalsReport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Goal</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Due Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(goals || []).slice(0, 10).map((goal) => (
                      <TableRow key={goal.id}>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {getLocalizedField(goal, 'title')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{goal.goal_level}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={
                              goal.status === 'completed' ? 'bg-success/10 text-success border-success/20' :
                              goal.status === 'in_progress' ? 'bg-info/10 text-info border-info/20' :
                              goal.status === 'on_hold' ? 'bg-warning/10 text-warning border-warning/20' :
                              goal.status === 'cancelled' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                              'bg-muted text-muted-foreground'
                            }
                          >
                            {goal.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={goal.progress_percent || 0} className="w-16 h-2" />
                            <span className="text-xs text-muted-foreground">{goal.progress_percent || 0}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {goal.due_date ? format(new Date(goal.due_date), 'MMM d, yyyy') : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {(goals?.length || 0) > 10 && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Showing 10 of {goals?.length} records. Export for full data.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Training Tab */}
          <TabsContent value="training" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Training Completion Rate</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-info">
                      {trainingStats.totalAssignments > 0 
                        ? Math.round((trainingStats.completed / trainingStats.totalAssignments) * 100) 
                        : 0}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {trainingStats.completed} of {trainingStats.totalAssignments} courses completed
                    </p>
                  </div>
                  <Progress 
                    value={trainingStats.totalAssignments > 0 
                      ? (trainingStats.completed / trainingStats.totalAssignments) * 100 
                      : 0} 
                    className="h-3"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Courses by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[200px]">
                    <BarChart data={courseCategoryData} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={100}
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Training Table */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Course Assignments</CardTitle>
                <Button variant="outline" size="sm" onClick={exportTrainingReport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Person</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned</TableHead>
                      <TableHead>Completed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(assignments || []).slice(0, 10).map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell className="font-medium">
                          {assignment.person?.first_name} {assignment.person?.last_name}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {assignment.course?.code && `${assignment.course.code} - `}
                          {getLocalizedField(assignment.course || {}, 'title')}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={
                              assignment.status === 'completed' ? 'bg-success/10 text-success border-success/20' :
                              assignment.status === 'in_progress' ? 'bg-info/10 text-info border-info/20' :
                              assignment.status === 'dropped' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                              'bg-muted text-muted-foreground'
                            }
                          >
                            {assignment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {assignment.assigned_date ? format(new Date(assignment.assigned_date), 'MMM d, yyyy') : '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {assignment.completion_date ? format(new Date(assignment.completion_date), 'MMM d, yyyy') : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {(assignments?.length || 0) > 10 && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Showing 10 of {assignments?.length} records. Export for full data.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </MainLayout>
  );
}
