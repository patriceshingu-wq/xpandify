import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { useGoals } from '@/hooks/useGoals';
import { useLanguage } from '@/contexts/LanguageContext';
import { Target, Loader2 } from 'lucide-react';

const COLORS = {
  completed: 'hsl(var(--success))',
  in_progress: 'hsl(var(--info))',
  not_started: 'hsl(var(--muted-foreground))',
  on_hold: 'hsl(var(--warning))',
  cancelled: 'hsl(var(--destructive))',
};

export function GoalCompletionChart() {
  const { t } = useLanguage();
  const { data: goals, isLoading } = useGoals();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-accent" />
            Goal Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Calculate status counts
  const statusCounts = (goals || []).reduce((acc, goal) => {
    const status = goal.status || 'not_started';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = [
    { name: t('goals.completed'), value: statusCounts.completed || 0, status: 'completed' },
    { name: t('goals.inProgress'), value: statusCounts.in_progress || 0, status: 'in_progress' },
    { name: t('goals.notStarted'), value: statusCounts.not_started || 0, status: 'not_started' },
    { name: t('goals.onHold'), value: statusCounts.on_hold || 0, status: 'on_hold' },
    { name: t('goals.cancelled'), value: statusCounts.cancelled || 0, status: 'cancelled' },
  ].filter(item => item.value > 0);

  const totalGoals = goals?.length || 0;
  const completedGoals = statusCounts.completed || 0;
  const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-accent" />
            Goal Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-sm text-muted-foreground">No goals data available</p>
        </CardContent>
      </Card>
    );
  }

  const chartConfig = {
    completed: { label: t('goals.completed'), color: COLORS.completed },
    in_progress: { label: t('goals.inProgress'), color: COLORS.in_progress },
    not_started: { label: t('goals.notStarted'), color: COLORS.not_started },
    on_hold: { label: t('goals.onHold'), color: COLORS.on_hold },
    cancelled: { label: t('goals.cancelled'), color: COLORS.cancelled },
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Target className="h-4 w-4 text-accent" />
            Goal Status Overview
          </span>
          <span className="text-2xl font-bold text-success">{completionRate}%</span>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {completedGoals} of {totalGoals} goals completed
        </p>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[entry.status as keyof typeof COLORS]} 
                  stroke="transparent"
                />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value) => <span className="text-xs text-foreground">{value}</span>}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
