import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis } from 'recharts';
import { useSurveys } from '@/hooks/useSurveys';
import { usePeople } from '@/hooks/usePeople';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { BarChart3, Users, TrendingUp, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Simple trend indicator for mobile (no recharts)
function SimpleTrendIndicator({ data }: { data: { month: string; engagement: number }[] }) {
  const latest = data[data.length - 1]?.engagement || 0;
  const previous = data[data.length - 2]?.engagement || 0;
  const trend = latest - previous;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-accent/10">
      <div>
        <div className="text-2xl font-bold text-accent">{latest}%</div>
        <div className="text-xs text-muted-foreground">Current engagement</div>
      </div>
      <div className={`flex items-center gap-1 ${trend >= 0 ? 'text-success' : 'text-destructive'}`}>
        <TrendingUp className={`h-4 w-4 ${trend < 0 ? 'rotate-180' : ''}`} />
        <span className="text-sm font-medium">{trend >= 0 ? '+' : ''}{trend}%</span>
      </div>
    </div>
  );
}

export function TeamEngagementChart() {
  const { t } = useLanguage();
  const { data: surveys, isLoading: surveysLoading } = useSurveys();
  const { data: people, isLoading: peopleLoading } = usePeople();
  const isMobile = useIsMobile();

  const isLoading = surveysLoading || peopleLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-accent" />
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
  const totalActive = activeStaff + activeVolunteers;

  // Calculate engagement metrics
  const activeSurveys = (surveys || []).filter(s => s.is_active).length;
  
  // Create sample engagement data (in a real app, this would come from pulse_responses)
  const engagementData = [
    { month: 'Jan', engagement: 75 },
    { month: 'Feb', engagement: 82 },
    { month: 'Mar', engagement: 78 },
    { month: 'Apr', engagement: 85 },
    { month: 'May', engagement: 88 },
    { month: 'Jun', engagement: 92 },
  ];

  const chartConfig = {
    engagement: { label: 'Engagement %', color: 'hsl(var(--accent))' },
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-accent" />
            Team Engagement
          </span>
          {activeSurveys > 0 && (
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              {activeSurveys} Active Survey{activeSurveys > 1 ? 's' : ''}
            </Badge>
          )}
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
            <span className="text-xs text-muted-foreground">Engagement Trend (Last 6 months)</span>
          </div>
          {isMobile ? (
            <SimpleTrendIndicator data={engagementData} />
          ) : (
            <ChartContainer config={chartConfig} className="h-[100px] w-full">
              <AreaChart data={engagementData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <defs>
                  <linearGradient id="engagementGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis hide domain={[60, 100]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="engagement"
                  stroke="hsl(var(--accent))"
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
