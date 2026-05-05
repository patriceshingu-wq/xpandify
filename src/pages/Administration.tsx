import { useState, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminUsers, useAppRoles } from '@/hooks/useAdminUsers';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { UserManagementTable } from '@/components/admin/UserManagementTable';
import { MeetingTemplateManagement } from '@/components/admin/MeetingTemplateManagement';
import { MinistryRolesManagement } from '@/components/admin/MinistryRolesManagement';
import { FeatureUpgradesTab } from '@/components/admin/FeatureUpgradesTab';
import { InviteUserDialog } from '@/components/admin/InviteUserDialog';
import { OrgchartSyncTab } from '@/components/admin/OrgchartSyncTab';
import { CampusFormDialog } from '@/components/settings/CampusFormDialog';
import { useOrganizationSettings, useUpdateOrganizationSettings } from '@/hooks/useOrganizationSettings';
import { useCampuses, Campus } from '@/hooks/useCampuses';
import {
  Search, Users, Shield, Settings, ShieldAlert, FileText,
  Building2, Mail, Palette, MapPin, Plus, Loader2, Star, UserPlus, Tag, Sparkles, Network,
} from 'lucide-react';

export default function Administration() {
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

  // Admin data
  const { data: users, isLoading: usersLoading } = useAdminUsers();
  const { data: roles, isLoading: rolesLoading } = useAppRoles();

  // Settings data
  const { data: settings } = useOrganizationSettings();
  const { data: campuses, isLoading: campusesLoading } = useCampuses();
  const updateSettings = useUpdateOrganizationSettings();

  // Settings form state
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Campus dialog state
  const [isCampusDialogOpen, setIsCampusDialogOpen] = useState(false);
  const [editingCampus, setEditingCampus] = useState<Campus | null>(null);

  // Initialize form data when settings load
  useState(() => {
    if (settings) {
      setFormData({
        organization_name: settings.organization_name || '',
        address_line1: settings.address_line1 || '',
        address_line2: settings.address_line2 || '',
        city: settings.city || '',
        state_province: settings.state_province || '',
        postal_code: settings.postal_code || '',
        country: settings.country || '',
        phone: settings.phone || '',
        email: settings.email || '',
        website: settings.website || '',
        email_sender_name: settings.email_sender_name || '',
        email_sender_address: settings.email_sender_address || '',
        email_reply_to: settings.email_reply_to || '',
        email_footer_text: settings.email_footer_text || '',
        primary_color: settings.primary_color || '#1e3a5f',
        secondary_color: settings.secondary_color || '#6b7280',
        accent_color: settings.accent_color || '#f59e0b',
        font_family: settings.font_family || 'Inter',
        yearly_theme_en: settings.yearly_theme_en || '',
        yearly_theme_fr: settings.yearly_theme_fr || '',
        yearly_vision_en: settings.yearly_vision_en || '',
        yearly_vision_fr: settings.yearly_vision_fr || '',
        theme_year: settings.theme_year?.toString() || new Date().getFullYear().toString(),
        theme_scripture: settings.theme_scripture || '',
      });
    }
  });

  // Allow pastor_supervisor to access the admin page (for invite functionality)
  const canAccessAdmin = isAdminOrSuper || hasAnyRole(['pastor_supervisor']);

  if (!authLoading && !canAccessAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    if (!settings?.id) return;
    const { theme_year, ...rest } = formData;
    await updateSettings.mutateAsync({
      id: settings.id,
      ...rest,
      theme_year: theme_year ? parseInt(theme_year, 10) : null,
    });
    setHasChanges(false);
  };

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

        {/* Stats */}
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

        {/* Tabs - Consolidated: Users+Roles, Templates, Ministry Roles, Organization+Campuses, Email, Settings+Branding, Upgrades */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <TabsList className="inline-flex w-auto min-w-full md:min-w-0">
              <TabsTrigger value="users" className="gap-1.5 touch-target">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">{t('admin.userManagement')}</span>
                <span className="sm:hidden">Users</span>
              </TabsTrigger>
              <TabsTrigger value="ministry-roles" className="gap-1.5 touch-target">
                <Tag className="h-4 w-4" />
                <span className="hidden sm:inline">{t('admin.ministryRoles')}</span>
                <span className="sm:hidden">M. Roles</span>
              </TabsTrigger>
              <TabsTrigger value="templates" className="gap-1.5 touch-target">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Templates</span>
                <span className="sm:hidden">Templates</span>
              </TabsTrigger>
              <TabsTrigger value="organization" className="gap-1.5 touch-target">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Organization</span>
                <span className="sm:hidden">Org</span>
              </TabsTrigger>
              <TabsTrigger value="email" className="gap-1.5 touch-target">
                <Mail className="h-4 w-4" />
                <span className="hidden sm:inline">Email</span>
                <span className="sm:hidden">Email</span>
              </TabsTrigger>
              <TabsTrigger value="system" className="gap-1.5 touch-target">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">{t('admin.systemSettings')}</span>
                <span className="sm:hidden">System</span>
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
            </TabsList>
          </div>

          {/* Users Tab (includes Roles) */}
          <TabsContent value="users" className="mt-4 md:mt-6 space-y-6">
            {/* User Management Section */}
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

            {/* Roles Section (moved from separate tab) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {t('admin.systemRoles')}
                </CardTitle>
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
                      <div key={role.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Shield className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{t(`roles.${role.name}`)}</p>
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

          {/* Ministry Roles Tab */}
          <TabsContent value="ministry-roles" className="mt-6">
            <MinistryRolesManagement />
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="mt-6">
            <MeetingTemplateManagement />
          </TabsContent>

          {/* Organization Tab (includes Campuses) */}
          <TabsContent value="organization" className="mt-6 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Your organization's general information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="organization_name">Organization Name</Label>
                  <Input
                    id="organization_name"
                    value={formData.organization_name || settings?.organization_name || ''}
                    onChange={(e) => handleFieldChange('organization_name', e.target.value)}
                    placeholder="My Church"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={formData.phone || settings?.phone || ''} onChange={(e) => handleFieldChange('phone', e.target.value)} placeholder="+1 514 555 0100" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={formData.email || settings?.email || ''} onChange={(e) => handleFieldChange('email', e.target.value)} placeholder="info@church.org" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" value={formData.website || settings?.website || ''} onChange={(e) => handleFieldChange('website', e.target.value)} placeholder="https://www.mychurch.org" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_line1">Address Line 1</Label>
                  <Input id="address_line1" value={formData.address_line1 || settings?.address_line1 || ''} onChange={(e) => handleFieldChange('address_line1', e.target.value)} placeholder="123 Main Street" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_line2">Address Line 2</Label>
                  <Input id="address_line2" value={formData.address_line2 || settings?.address_line2 || ''} onChange={(e) => handleFieldChange('address_line2', e.target.value)} placeholder="Suite 100" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={formData.city || settings?.city || ''} onChange={(e) => handleFieldChange('city', e.target.value)} placeholder="Montreal" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state_province">Province/State</Label>
                    <Input id="state_province" value={formData.state_province || settings?.state_province || ''} onChange={(e) => handleFieldChange('state_province', e.target.value)} placeholder="Quebec" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Postal Code</Label>
                    <Input id="postal_code" value={formData.postal_code || settings?.postal_code || ''} onChange={(e) => handleFieldChange('postal_code', e.target.value)} placeholder="H1A 1A1" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" value={formData.country || settings?.country || ''} onChange={(e) => handleFieldChange('country', e.target.value)} placeholder="Canada" />
                  </div>
                </div>
                {hasChanges && (
                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSaveSettings} disabled={updateSettings.isPending}>
                      {updateSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Changes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Yearly Theme */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Yearly Theme</CardTitle>
                    <CardDescription>Set your organization's annual theme, vision, and guiding scripture</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme_year">Theme Year</Label>
                  <Input
                    id="theme_year"
                    type="number"
                    value={formData.theme_year || settings?.theme_year?.toString() || ''}
                    onChange={(e) => handleFieldChange('theme_year', e.target.value)}
                    placeholder={new Date().getFullYear().toString()}
                    className="max-w-[120px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="yearly_theme_en">Theme (English)</Label>
                    <Input
                      id="yearly_theme_en"
                      value={formData.yearly_theme_en || settings?.yearly_theme_en || ''}
                      onChange={(e) => handleFieldChange('yearly_theme_en', e.target.value)}
                      placeholder="e.g., EXPANSION"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yearly_theme_fr">Theme (French)</Label>
                    <Input
                      id="yearly_theme_fr"
                      value={formData.yearly_theme_fr || settings?.yearly_theme_fr || ''}
                      onChange={(e) => handleFieldChange('yearly_theme_fr', e.target.value)}
                      placeholder="e.g., EXPANSION"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="theme_scripture">Guiding Scripture</Label>
                  <Input
                    id="theme_scripture"
                    value={formData.theme_scripture || settings?.theme_scripture || ''}
                    onChange={(e) => handleFieldChange('theme_scripture', e.target.value)}
                    placeholder="e.g., Isaiah 54:1–3"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="yearly_vision_en">Vision Statement (English)</Label>
                    <Textarea
                      id="yearly_vision_en"
                      value={formData.yearly_vision_en || settings?.yearly_vision_en || ''}
                      onChange={(e) => handleFieldChange('yearly_vision_en', e.target.value)}
                      placeholder="Describe the vision for this year..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yearly_vision_fr">Vision Statement (French)</Label>
                    <Textarea
                      id="yearly_vision_fr"
                      value={formData.yearly_vision_fr || settings?.yearly_vision_fr || ''}
                      onChange={(e) => handleFieldChange('yearly_vision_fr', e.target.value)}
                      placeholder="Décrivez la vision pour cette année..."
                      rows={3}
                    />
                  </div>
                </div>
                {hasChanges && (
                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSaveSettings} disabled={updateSettings.isPending}>
                      {updateSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Changes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Campuses Section (moved from separate tab) */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Campuses & Locations
                  </CardTitle>
                  <CardDescription>Manage your church's campuses and locations</CardDescription>
                </div>
                <Button onClick={() => { setEditingCampus(null); setIsCampusDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Campus
                </Button>
              </CardHeader>
              <CardContent>
                {campusesLoading ? (
                  <div className="flex items-center justify-center py-8"><div className="spinner" /></div>
                ) : campuses && campuses.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {campuses.map((campus) => (
                      <div
                        key={campus.id}
                        className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => { setEditingCampus(campus); setIsCampusDialogOpen(true); }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <h4 className="font-medium">{campus.name}</h4>
                              {campus.code && <span className="text-xs text-muted-foreground">({campus.code})</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {campus.is_main_campus && (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <Star className="h-3 w-3" />Main
                              </Badge>
                            )}
                            {!campus.is_active && <Badge variant="outline">Inactive</Badge>}
                          </div>
                        </div>
                        {(campus.city || campus.state_province) && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {[campus.city, campus.state_province].filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<MapPin className="h-10 w-10" />}
                    title="No campuses yet"
                    description="Add your first campus or location"
                    action={{ label: 'Add Campus', onClick: () => { setEditingCampus(null); setIsCampusDialogOpen(true); } }}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Tab */}
          <TabsContent value="email" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Preferences</CardTitle>
                <CardDescription>Configure email sender settings and templates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email_sender_name">Sender Name</Label>
                    <Input id="email_sender_name" value={formData.email_sender_name || settings?.email_sender_name || ''} onChange={(e) => handleFieldChange('email_sender_name', e.target.value)} placeholder="Xpandify" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email_sender_address">Sender Email</Label>
                    <Input id="email_sender_address" type="email" value={formData.email_sender_address || settings?.email_sender_address || ''} onChange={(e) => handleFieldChange('email_sender_address', e.target.value)} placeholder="noreply@church.org" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email_reply_to">Reply-To Address</Label>
                  <Input id="email_reply_to" type="email" value={formData.email_reply_to || settings?.email_reply_to || ''} onChange={(e) => handleFieldChange('email_reply_to', e.target.value)} placeholder="info@church.org" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email_footer_text">Email Footer</Label>
                  <Textarea id="email_footer_text" value={formData.email_footer_text || settings?.email_footer_text || ''} onChange={(e) => handleFieldChange('email_footer_text', e.target.value)} placeholder="This email was sent by My Church. © 2024 All rights reserved." rows={3} />
                </div>
                {hasChanges && (
                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSaveSettings} disabled={updateSettings.isPending}>
                      {updateSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Changes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings Tab (includes Branding) */}
          <TabsContent value="system" className="mt-6 space-y-6">
            {/* System Settings */}
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

            {/* Branding Section (moved from separate tab) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Branding & Theme
                </CardTitle>
                <CardDescription>Customize your organization's visual identity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  {(['primary_color', 'secondary_color', 'accent_color'] as const).map((colorKey) => {
                    const labels: Record<string, string> = { primary_color: 'Primary Color', secondary_color: 'Secondary Color', accent_color: 'Accent Color' };
                    const defaults: Record<string, string> = { primary_color: '#1e3a5f', secondary_color: '#6b7280', accent_color: '#f59e0b' };
                    return (
                      <div key={colorKey} className="space-y-2">
                        <Label htmlFor={colorKey}>{labels[colorKey]}</Label>
                        <div className="flex items-center gap-2">
                          <input type="color" id={colorKey} value={formData[colorKey] || (settings as any)?.[colorKey] || defaults[colorKey]} onChange={(e) => handleFieldChange(colorKey, e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                          <Input value={formData[colorKey] || (settings as any)?.[colorKey] || defaults[colorKey]} onChange={(e) => handleFieldChange(colorKey, e.target.value)} placeholder={defaults[colorKey]} className="flex-1" />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="font_family">Font Family</Label>
                  <Input id="font_family" value={formData.font_family || settings?.font_family || 'Inter'} onChange={(e) => handleFieldChange('font_family', e.target.value)} placeholder="Inter" />
                </div>
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-sm">Preview</h4>
                  <div className="flex items-center gap-4">
                    {['primary_color', 'secondary_color', 'accent_color'].map((key) => {
                      const defaults: Record<string, string> = { primary_color: '#1e3a5f', secondary_color: '#6b7280', accent_color: '#f59e0b' };
                      const label = key.replace('_color', '').charAt(0).toUpperCase() + key.replace('_color', '').slice(1);
                      return (
                        <div key={key} className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-xs" style={{ backgroundColor: formData[key] || (settings as any)?.[key] || defaults[key] }}>
                          {label}
                        </div>
                      );
                    })}
                  </div>
                </div>
                {hasChanges && (
                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSaveSettings} disabled={updateSettings.isPending}>
                      {updateSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Changes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feature Upgrades Tab */}
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
        </Tabs>
      </div>

      <InviteUserDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
      />

      <CampusFormDialog
        open={isCampusDialogOpen}
        onOpenChange={setIsCampusDialogOpen}
        campus={editingCampus}
      />
    </MainLayout>
  );
}
