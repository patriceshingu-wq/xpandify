import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminUsers, useAppRoles } from '@/hooks/useAdminUsers';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { UserManagementTable } from '@/components/admin/UserManagementTable';
import { MeetingTemplateManagement } from '@/components/admin/MeetingTemplateManagement';
import { MinistryRolesManagement } from '@/components/admin/MinistryRolesManagement';
import { FeatureUpgradesTab } from '@/components/admin/FeatureUpgradesTab';
import { InviteUserDialog } from '@/components/admin/InviteUserDialog';
import { OrgchartSyncTab } from '@/components/admin/OrgchartSyncTab';
import { Search, Users, Shield, Settings, ShieldAlert, FileText, UserPlus, Tag, Sparkles, Network } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export default function Admin() {
  const { t } = useLanguage();
  const { isAdminOrSuper, hasAnyRole, isLoading: authLoading } = useAuth();
  const [search, setSearch] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') ?? 'users');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  useEffect(() => {
    const next = searchParams.get('tab');
    if (next && next !== activeTab) setActiveTab(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const next = new URLSearchParams(searchParams);
    next.set('tab', value);
    setSearchParams(next, { replace: true });
  };

  const { data: users, isLoading: usersLoading } = useAdminUsers();
  const { data: roles, isLoading: rolesLoading } = useAppRoles();

  // Allow pastor_supervisor to access the admin page (for invite functionality)
  const canAccessAdmin = isAdminOrSuper || hasAnyRole(['pastor_supervisor']);

  // Redirect non-admins (but allow pastor_supervisors)
  if (!authLoading && !canAccessAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const filteredUsers = users?.filter((user) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      user.email.toLowerCase().includes(searchLower) ||
      user.person?.first_name.toLowerCase().includes(searchLower) ||
      user.person?.last_name.toLowerCase().includes(searchLower) ||
      user.roles.some((role) => role.includes(searchLower))
    );
  });

  const activeUsers = users?.filter((u) => u.is_active).length || 0;
  const totalRoles = roles?.length || 0;
  const unlinkedUsers = users?.filter((u) => !u.person).length || 0;

  return (
    <MainLayout title={t('admin.title')} subtitle={t('admin.subtitle')}>
      <div className="space-y-4 md:space-y-6 animate-fade-in">
        <PageHeader
          title={t('admin.title')}
          subtitle={t('admin.subtitle')}
        />

        {/* Stats - Horizontal scroll on mobile */}
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          <Card>
            <CardContent className="p-3 md:p-4 flex items-center gap-2 md:gap-4">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                <Users className="h-5 w-5 md:h-6 md:w-6 text-success" />
              </div>
              <div className="min-w-0">
                <p className="text-lg md:text-2xl font-bold">{activeUsers}</p>
                <p className="text-xs md:text-sm text-muted-foreground truncate">{t('admin.activeUsers')}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 md:p-4 flex items-center gap-2 md:gap-4">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0">
                <Shield className="h-5 w-5 md:h-6 md:w-6 text-info" />
              </div>
              <div className="min-w-0">
                <p className="text-lg md:text-2xl font-bold">{totalRoles}</p>
                <p className="text-xs md:text-sm text-muted-foreground truncate">{t('admin.systemRoles')}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 md:p-4 flex items-center gap-2 md:gap-4">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
                <ShieldAlert className="h-5 w-5 md:h-6 md:w-6 text-warning" />
              </div>
              <div className="min-w-0">
                <p className="text-lg md:text-2xl font-bold">{unlinkedUsers}</p>
                <p className="text-xs md:text-sm text-muted-foreground truncate">{t('admin.unlinkedUsers')}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs - Full width grid on mobile */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-7 md:w-auto md:inline-flex">
            <TabsTrigger value="users" className="gap-1.5 touch-target">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">{t('admin.userManagement')}</span>
              <span className="sm:hidden">Users</span>
            </TabsTrigger>
            <TabsTrigger value="roles" className="gap-1.5 touch-target">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">{t('admin.roleManagement')}</span>
              <span className="sm:hidden">Roles</span>
            </TabsTrigger>
            <TabsTrigger value="ministry-roles" className="gap-1.5 touch-target">
              <Tag className="h-4 w-4" />
              <span className="hidden sm:inline">{t('admin.ministryRoles')}</span>
              <span className="sm:hidden">M. Roles</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-1.5 touch-target">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Meeting Templates</span>
              <span className="sm:hidden">Templates</span>
            </TabsTrigger>
            <TabsTrigger value="upgrades" className="gap-1.5 touch-target">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">{t('admin.featureUpgrades')}</span>
              <span className="sm:hidden">Upgrades</span>
            </TabsTrigger>
            <TabsTrigger value="orgchart-sync" className="gap-1.5 touch-target">
              <Network className="h-4 w-4" />
              <span className="hidden sm:inline">{t('orgchartSync.tabLabel')}</span>
              <span className="sm:hidden">Org Sync</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5 touch-target">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">{t('admin.systemSettings')}</span>
              <span className="sm:hidden">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-4 md:mt-6 space-y-4">
            <Card>
              <CardContent className="p-3 md:p-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                  <div className="relative flex-1 sm:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t('admin.searchUsers')}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 touch-target w-full"
                    />
                  </div>
                  <Button onClick={() => setIsInviteDialogOpen(true)} className="touch-target">
                    <UserPlus className="h-4 w-4 mr-2" />
                    {t('admin.inviteUser')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {usersLoading || rolesLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="spinner" />
              </div>
            ) : filteredUsers && filteredUsers.length > 0 ? (
              <UserManagementTable users={filteredUsers} roles={roles || []} />
            ) : (
              <EmptyState
                icon={<Users className="h-16 w-16" />}
                title={t('common.noResults')}
                description={t('admin.noUsersFound')}
              />
            )}
          </TabsContent>

          <TabsContent value="roles" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.systemRoles')}</CardTitle>
                <CardDescription>{t('admin.rolesDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                {rolesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="spinner" />
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {roles?.map((role) => (
                      <div
                        key={role.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Shield className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium capitalize">{role.name.replace('_', ' ')}</p>
                            <p className="text-sm text-muted-foreground">
                              {role.description || t('admin.noDescription')}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {users?.filter((u) => u.roles.includes(role.name)).length || 0} {t('admin.usersWithRole')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ministry-roles" className="mt-6">
            <MinistryRolesManagement />
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <MeetingTemplateManagement />
          </TabsContent>

          <TabsContent value="upgrades" className="mt-6">
            <FeatureUpgradesTab />
          </TabsContent>

          <TabsContent value="orgchart-sync" className="mt-6">
            {isAdminOrSuper ? (
              <OrgchartSyncTab />
            ) : (
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">{t('common.adminOnly')}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.systemSettings')}</CardTitle>
                <CardDescription>{t('admin.settingsDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{t('admin.defaultLanguage')}</p>
                      <p className="text-sm text-muted-foreground">{t('admin.defaultLanguageDescription')}</p>
                    </div>
                    <Badge>English</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{t('admin.emailConfirmation')}</p>
                      <p className="text-sm text-muted-foreground">{t('admin.emailConfirmationDescription')}</p>
                    </div>
                    <Badge variant="outline">{t('admin.disabled')}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{t('admin.signupEnabled')}</p>
                      <p className="text-sm text-muted-foreground">{t('admin.signupEnabledDescription')}</p>
                    </div>
                    <Badge variant="default">{t('admin.enabled')}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <InviteUserDialog
          open={isInviteDialogOpen}
          onOpenChange={setIsInviteDialogOpen}
        />
      </div>
    </MainLayout>
  );
}
