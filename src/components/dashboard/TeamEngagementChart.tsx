import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis } from 'recharts';
import { usePeople } from '@/hooks/usePeople';
import { useEngagementMetrics } from '@/hooks/useEngagementMetrics';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { BarChart3, Users, TrendingUp, Loader2 } from 'lucide-react';

// Simple trend indicator for mobile (no recharts)
function SimpleTrendIndicator({ data }: { data: { label: string; meetings: number }[] }) {
  const latest = data[data.length - 1]?.meetings || 0;
  const previous = data[data.length - 2]?.meetings || 0;
  const trend = latest - previous;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
      <div>
        <div className="text-2xl font-bold text-foreground">{latest}</div>
        <div className="text-xs text-muted-foreground">Meetings this month</div>
      </div>
      <div className={`flex items-center gap-1 ${trend >= 0 ? 'text-success' : 'text-destructive'}`}>
        <TrendingUp className={`h-4 w-4 ${trend < 0 ? 'rotate-180' : ''}`} />
        <span className="text-sm font-medium">{trend >= 0 ? '+' : ''}{trend}</span>
      </div>
    </div>
  );
}

export function TeamEngagementChart() {
  const { t } = useLanguage();
  const { data: people, isLoading: peopleLoading } = usePeople();
  const { data: metrics, isLoading: metricsLoading } = useEngagementMetrics();
  const isMobile = useIsMobile();

  const isLoading = peopleLoading || metricsLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            Team Engagement
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Calculate team metrics
  const allPeople = people || [];
  const activeStaff = allPeople.filter(p => p.person_type === 'staff' && p.status === 'active').length;
  const activeVolunteers = allPeople.filter(p => p.person_type === 'volunteer' && p.status === 'active').length;
  const onLeave = allPeople.filter(p => p.status === 'on_leave').length;

  const engagementData = metrics || [];
  const hasData = engagementData.some(m => m.meetings > 0 || m.feedback > 0);

  const chartConfig = {
    meetings: { label: 'Meetings', color: 'hsl(var(--muted-foreground))' },
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            Team Engagement
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Team Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-lg bg-info/10">
            <div className="flex items-center justify-center gap-1">
              <Users className="h-3 w-3 text-info" />
              <span className="text-lg font-bold text-info">{activeStaff}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Staff</span>
          </div>
          <div className="text-center p-2 rounded-lg bg-success/10">
            <div className="flex items-center justify-center gap-1">
              <Users className="h-3 w-3 text-success" />
              <span className="text-lg font-bold text-success">{activeVolunteers}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Volunteers</span>
          </div>
          <div className="text-center p-2 rounded-lg bg-warning/10">
            <div className="flex items-center justify-center gap-1">
              <Users className="h-3 w-3 text-warning" />
              <span className="text-lg font-bold text-warning">{onLeave}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">On Leave</span>
          </div>
        </div>

        {/* Engagement Trend */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-3 w-3 text-success" />
            <span className="text-xs text-muted-foreground">Meeting Activity (Last 6 months)</span>
          </div>
          {!hasData ? (
            <div className="text-center py-4 text-sm text-muted-foreground">
              Not enough data yet
            </div>
          ) : isMobile ? (
            <SimpleTrendIndicator data={engagementData} />
          ) : (
            <ChartContainer config={chartConfig} className="h-[100px] w-full">
              <AreaChart data={engagementData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <defs>
                  <linearGradient id="engagementGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis hide />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="meetings"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={2}
                  fill="url(#engagementGradient)"
                />
              </AreaChart>
            </ChartContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
