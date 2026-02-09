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
import { Users, UsersRound, Crown, BookOpen } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { DirectoryTab } from '@/components/people/DirectoryTab';
import { MyTeamTab } from '@/components/people/MyTeamTab';
import { PeersTab } from '@/components/people/PeersTab';
import { SupervisorTab } from '@/components/people/SupervisorTab';

export default function People() {
  const { t } = useLanguage();
  const { hasAnyRole } = useAuth();
  const { data: teamMembers, isLoading: isLoadingTeam } = useTeamMembersWithDetails();
  const { data: teammates, isLoading: isLoadingTeammates } = useTeammates();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>('directory');

  const isSupervisor = hasAnyRole(['super_admin', 'admin', 'pastor_supervisor']);
  const hasDirectReports = teamMembers && teamMembers.length > 0;
  const hasTeammates = teammates && teammates.length > 0;

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['people'] });
    await queryClient.invalidateQueries({ queryKey: ['team-members'] });
    await queryClient.invalidateQueries({ queryKey: ['teammates'] });
    await queryClient.invalidateQueries({ queryKey: ['supervisor'] });
  }, [queryClient]);

  const tabValues = ['directory', ...(isSupervisor ? ['my-team'] : []), 'peers', 'supervisor'] as const;

  return (
    <MainLayout title={t('people.title')} subtitle={t('people.subtitle')}>
      <PullToRefresh onRefresh={handleRefresh} className="min-h-[calc(100vh-12rem)]">
        <div className="space-y-4 md:space-y-6 animate-fade-in">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 sm:w-auto sm:inline-flex">
              <TabsTrigger value="directory" className="gap-1.5 touch-target">
                <BookOpen className="h-4 w-4 shrink-0" />
                <span className="text-sm">Directory</span>
              </TabsTrigger>
              {isSupervisor && (
                <TabsTrigger value="my-team" className="gap-1.5 touch-target">
                  <Users className="h-4 w-4 shrink-0" />
                  <span className="text-sm">Reports</span>
                  {hasDirectReports && (
                    <Badge variant="secondary" className="ml-1 text-xs h-5 px-1.5">{teamMembers.length}</Badge>
                  )}
                </TabsTrigger>
              )}
              <TabsTrigger value="peers" className="gap-1.5 touch-target">
                <UsersRound className="h-4 w-4 shrink-0" />
                <span className="text-sm">Peers</span>
                {hasTeammates && (
                  <Badge variant="secondary" className="ml-1 text-xs h-5 px-1.5">{teammates.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="supervisor" className="gap-1.5 touch-target">
                <Crown className="h-4 w-4 shrink-0" />
                <span className="text-sm">Supervisor</span>
              </TabsTrigger>
            </TabsList>

            <SwipeableTabs
              value={activeTab}
              onValueChange={setActiveTab}
              tabs={[...tabValues]}
            >
              <TabsContent value="directory" className="mt-4 md:mt-6">
                <DirectoryTab />
              </TabsContent>

              {isSupervisor && (
                <TabsContent value="my-team" className="mt-4 md:mt-6">
                  <MyTeamTab />
                </TabsContent>
              )}

              <TabsContent value="peers" className="mt-4 md:mt-6">
                <PeersTab />
              </TabsContent>

              <TabsContent value="supervisor" className="mt-4 md:mt-6">
                <SupervisorTab />
              </TabsContent>
            </SwipeableTabs>
          </Tabs>
        </div>
      </PullToRefresh>
    </MainLayout>
  );
}
