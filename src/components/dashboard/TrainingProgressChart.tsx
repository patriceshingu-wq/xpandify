import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { useCourseAssignments } from '@/hooks/useCourseAssignments';
import { useLanguage } from '@/contexts/LanguageContext';
import { GraduationCap, Loader2 } from 'lucide-react';

export function TrainingProgressChart() {
  const { t } = useLanguage();
  const { data: assignments, isLoading } = useCourseAssignments();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="h-4 w-4 text-accent" />
            Training Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Group by status
  const statusCounts = (assignments || []).reduce((acc, assignment) => {
    const status = assignment.status || 'not_started';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = [
    { 
      name: t('goals.notStarted'), 
      value: statusCounts.not_started || 0, 
      fill: 'hsl(var(--muted-foreground))' 
    },
    { 
      name: t('goals.inProgress'), 
      value: statusCounts.in_progress || 0, 
      fill: 'hsl(var(--info))' 
    },
    { 
      name: t('goals.completed'), 
      value: statusCounts.completed || 0, 
      fill: 'hsl(var(--success))' 
    },
    { 
      name: 'Dropped', 
      value: statusCounts.dropped || 0, 
      fill: 'hsl(var(--destructive))' 
    },
  ].filter(item => item.value > 0);

  const totalAssignments = assignments?.length || 0;
  const completedAssignments = statusCounts.completed || 0;
  const completionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="h-4 w-4 text-accent" />
            Training Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-sm text-muted-foreground">No training data available</p>
        </CardContent>
      </Card>
    );
  }

  const chartConfig = {
    value: { label: 'Courses' },
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-accent" />
            Training Progress
          </span>
          <span className="text-2xl font-bold text-info">{completionRate}%</span>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {completedAssignments} of {totalAssignments} courses completed
        </p>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 16 }}>
            <XAxis type="number" hide />
            <YAxis 
              type="category" 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              width={90}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
