import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminUsers, useAppRoles } from '@/hooks/useAdminUsers';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { UserManagementTable } from '@/components/admin/UserManagementTable';
import { Search, Users, Shield, Settings, ShieldAlert } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export default function Admin() {
  const { t } = useLanguage();
  const { isAdminOrSuper, isLoading: authLoading } = useAuth();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('users');

  const { data: users, isLoading: usersLoading } = useAdminUsers();
  const { data: roles, isLoading: rolesLoading } = useAppRoles();

  // Redirect non-admins
  if (!authLoading && !isAdminOrSuper) {
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
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title={t('admin.title')}
          subtitle={t('admin.subtitle')}
        />

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeUsers}</p>
                <p className="text-sm text-muted-foreground">{t('admin.activeUsers')}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-info/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalRoles}</p>
                <p className="text-sm text-muted-foreground">{t('admin.systemRoles')}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center">
                <ShieldAlert className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{unlinkedUsers}</p>
                <p className="text-sm text-muted-foreground">{t('admin.unlinkedUsers')}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              {t('admin.userManagement')}
            </TabsTrigger>
            <TabsTrigger value="roles" className="gap-2">
              <Shield className="h-4 w-4" />
              {t('admin.roleManagement')}
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              {t('admin.systemSettings')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6 space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('admin.searchUsers')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 max-w-sm"
                  />
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
      </div>
    </MainLayout>
  );
}
