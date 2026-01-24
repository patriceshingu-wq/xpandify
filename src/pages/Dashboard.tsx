import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DevelopmentProgressWidget } from '@/components/dashboard/DevelopmentProgressWidget';
import { Users, Target, Calendar, GraduationCap } from 'lucide-react';

export default function Dashboard() {
  const { t } = useLanguage();
  const { person } = useAuth();

  const displayName = person?.preferred_name || person?.first_name || 'User';

  return (
    <MainLayout
      title={`${t('dashboard.welcome')}, ${displayName}!`}
      subtitle={t('dashboard.overview')}
    >
      <div className="space-y-6 animate-fade-in">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title={t('dashboard.totalPeople')}
            value="48"
            subtitle="12 staff, 36 volunteers"
            icon={<Users className="h-6 w-6 text-accent" />}
            trend={{ value: 8, isPositive: true }}
          />
          <StatCard
            title={t('dashboard.activeStaff')}
            value="12"
            icon={<Users className="h-6 w-6 text-info" />}
          />
          <StatCard
            title={t('dashboard.activeVolunteers')}
            value="36"
            icon={<Users className="h-6 w-6 text-success" />}
          />
          <StatCard
            title={t('dashboard.goalsInProgress')}
            value="15"
            icon={<Target className="h-6 w-6 text-warning" />}
          />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Meetings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-accent" />
                {t('dashboard.upcomingMeetings')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Team Meeting</p>
                    <p className="text-sm text-muted-foreground">Today at 2:00 PM</p>
                  </div>
                  <span className="text-xs bg-info/10 text-info px-2 py-1 rounded">Team</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">1:1 with Sarah</p>
                    <p className="text-sm text-muted-foreground">Tomorrow at 10:00 AM</p>
                  </div>
                  <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded">1:1</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-accent" />
                {t('dashboard.recentGoals')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Launch Youth Alpha</p>
                    <span className="text-sm text-muted-foreground">75%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: '75%' }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Train 10 New Leaders</p>
                    <span className="text-sm text-muted-foreground">40%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-info rounded-full" style={{ width: '40%' }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Development Progress Widget */}
        <DevelopmentProgressWidget />
      </div>
    </MainLayout>
  );
}
