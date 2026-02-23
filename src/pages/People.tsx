import { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamMembersWithDetails } from '@/hooks/useTeamMembers';
import { useTeammates } from '@/hooks/useTeammates';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { SwipeableTabs } from '@/components/ui/swipeable-tabs';
import { Users, UsersRound, Crown, BookOpen, Network } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { DirectoryTab } from '@/components/people/DirectoryTab';
import { MyTeamTab } from '@/components/people/MyTeamTab';
import { PeersTab } from '@/components/people/PeersTab';
import { SupervisorTab } from '@/components/people/SupervisorTab';
import { OrgChartTab } from '@/components/people/OrgChartTab';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

export default function People() {
  const { t } = useLanguage();
  const { hasAnyRole } = useAuth();
  const { data: teamMembers, isLoading: isLoadingTeam } = useTeamMembersWithDetails();
  const { data: teammates, isLoading: isLoadingTeammates } = useTeammates();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>('directory');
  const { orgChart } = useFeatureFlags();

  const isSupervisor = hasAnyRole(['super_admin', 'admin', 'pastor_supervisor']);
  const hasDirectReports = teamMembers && teamMembers.length > 0;
  const hasTeammates = teammates && teammates.length > 0;

  // Simple mode = orgChart disabled
  const isInSimpleMode = !orgChart;

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['people'] });
    await queryClient.invalidateQueries({ queryKey: ['team-members'] });
    await queryClient.invalidateQueries({ queryKey: ['teammates'] });
    await queryClient.invalidateQueries({ queryKey: ['supervisor'] });
  }, [queryClient]);

  // Simple mode: 2 tabs (Directory, My Team)
  // Advanced mode: 5 tabs (Directory, Org Chart, My Team, Peers, Supervisor)
  const tabValues = isInSimpleMode
    ? ['directory', ...(isSupervisor ? ['my-team'] : [])] as const
    : ['directory', ...(orgChart ? ['org-chart'] : []), ...(isSupervisor ? ['my-team'] : []), 'peers', 'supervisor'] as const;

  return (
    <MainLayout title={t('people.title')} subtitle={t('people.subtitle')}>
      <PullToRefresh onRefresh={handleRefresh} className="min-h-[calc(100vh-12rem)]">
        <div className="space-y-4 md:space-y-6 animate-fade-in">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* Simple mode: 2 tabs (Directory, My Team)
                Advanced mode: 5 tabs (Directory, Org Chart, My Team, Peers, Supervisor) */}
            <TabsList className={`grid w-full ${isInSimpleMode ? 'grid-cols-2' : 'grid-cols-4 sm:grid-cols-5'} sm:w-auto sm:inline-flex`}>
              <TabsTrigger value="directory" className="gap-1.5 touch-target">
                <BookOpen className="h-4 w-4 shrink-0" />
                <span className="text-sm hidden sm:inline">{t('people.directory')}</span>
              </TabsTrigger>
              {/* Org Chart - advanced mode only */}
              {orgChart && (
                <TabsTrigger value="org-chart" className="gap-1.5 touch-target">
                  <Network className="h-4 w-4 shrink-0" />
                  <span className="text-sm hidden sm:inline">{t('people.orgChart')}</span>
                </TabsTrigger>
              )}
              {isSupervisor && (
                <TabsTrigger value="my-team" className="gap-1.5 touch-target">
                  <Users className="h-4 w-4 shrink-0" />
                  <span className="text-sm hidden sm:inline">{t('people.reports')}</span>
                  {hasDirectReports && (
                    <Badge variant="secondary" className="ml-1 text-xs h-5 px-1.5">{teamMembers.length}</Badge>
                  )}
                </TabsTrigger>
              )}
              {/* Peers - advanced mode only */}
              {!isInSimpleMode && (
                <TabsTrigger value="peers" className="gap-1.5 touch-target">
                  <UsersRound className="h-4 w-4 shrink-0" />
                  <span className="text-sm hidden sm:inline">{t('people.peers')}</span>
                  {hasTeammates && (
                    <Badge variant="secondary" className="ml-1 text-xs h-5 px-1.5">{teammates.length}</Badge>
                  )}
                </TabsTrigger>
              )}
              {/* Supervisor - advanced mode only */}
              {!isInSimpleMode && (
                <TabsTrigger value="supervisor" className="gap-1.5 touch-target">
                  <Crown className="h-4 w-4 shrink-0" />
                  <span className="text-sm hidden sm:inline">{t('people.supervisor')}</span>
                </TabsTrigger>
              )}
            </TabsList>

            <SwipeableTabs
              value={activeTab}
              onValueChange={setActiveTab}
              tabs={[...tabValues]}
            >
              <TabsContent value="directory" className="mt-4 md:mt-6">
                <DirectoryTab />
              </TabsContent>

              {/* Org Chart - advanced mode only */}
              {orgChart && (
                <TabsContent value="org-chart" className="mt-4 md:mt-6">
                  <OrgChartTab />
                </TabsContent>
              )}

              {isSupervisor && (
                <TabsContent value="my-team" className="mt-4 md:mt-6">
                  <MyTeamTab />
                </TabsContent>
              )}

              {/* Peers - advanced mode only */}
              {!isInSimpleMode && (
                <TabsContent value="peers" className="mt-4 md:mt-6">
                  <PeersTab />
                </TabsContent>
              )}

              {/* Supervisor - advanced mode only */}
              {!isInSimpleMode && (
                <TabsContent value="supervisor" className="mt-4 md:mt-6">
                  <SupervisorTab />
                </TabsContent>
              )}
            </SwipeableTabs>
          </Tabs>
        </div>
      </PullToRefresh>
    </MainLayout>
  );
}
