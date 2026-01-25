import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { CampusFormDialog } from '@/components/settings/CampusFormDialog';
import { useOrganizationSettings, useUpdateOrganizationSettings } from '@/hooks/useOrganizationSettings';
import { useCampuses, Campus } from '@/hooks/useCampuses';
import { Building2, Mail, Palette, MapPin, Plus, Loader2, Settings as SettingsIcon, Star } from 'lucide-react';

export default function Settings() {
  const { isAdminOrSuper, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('basic');
  
  // Campus dialog state
  const [isCampusDialogOpen, setIsCampusDialogOpen] = useState(false);
  const [editingCampus, setEditingCampus] = useState<Campus | null>(null);

  // Data hooks
  const { data: settings, isLoading: settingsLoading } = useOrganizationSettings();
  const { data: campuses, isLoading: campusesLoading } = useCampuses();
  const updateSettings = useUpdateOrganizationSettings();

  // Form state for settings
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

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
      });
    }
  });

  if (authLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  if (!isAdminOrSuper) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    if (!settings?.id) return;
    await updateSettings.mutateAsync({ id: settings.id, ...formData });
    setHasChanges(false);
  };

  const handleEditCampus = (campus: Campus) => {
    setEditingCampus(campus);
    setIsCampusDialogOpen(true);
  };

  const handleAddCampus = () => {
    setEditingCampus(null);
    setIsCampusDialogOpen(true);
  };

  const isLoading = settingsLoading || campusesLoading;

  return (
    <MainLayout>
      <PageHeader
        title={t('settings.title')}
        subtitle="Configure your organization's settings"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-lg grid-cols-4">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Basic
          </TabsTrigger>
          <TabsTrigger value="campuses" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Campuses
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Branding
          </TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Basic Info Tab */}
            <TabsContent value="basic">
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
                      <Input
                        id="phone"
                        value={formData.phone || settings?.phone || ''}
                        onChange={(e) => handleFieldChange('phone', e.target.value)}
                        placeholder="+1 514 555 0100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email || settings?.email || ''}
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                        placeholder="info@church.org"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.website || settings?.website || ''}
                      onChange={(e) => handleFieldChange('website', e.target.value)}
                      placeholder="https://www.mychurch.org"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address_line1">Address Line 1</Label>
                    <Input
                      id="address_line1"
                      value={formData.address_line1 || settings?.address_line1 || ''}
                      onChange={(e) => handleFieldChange('address_line1', e.target.value)}
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address_line2">Address Line 2</Label>
                    <Input
                      id="address_line2"
                      value={formData.address_line2 || settings?.address_line2 || ''}
                      onChange={(e) => handleFieldChange('address_line2', e.target.value)}
                      placeholder="Suite 100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city || settings?.city || ''}
                        onChange={(e) => handleFieldChange('city', e.target.value)}
                        placeholder="Montreal"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state_province">Province/State</Label>
                      <Input
                        id="state_province"
                        value={formData.state_province || settings?.state_province || ''}
                        onChange={(e) => handleFieldChange('state_province', e.target.value)}
                        placeholder="Quebec"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="postal_code">Postal Code</Label>
                      <Input
                        id="postal_code"
                        value={formData.postal_code || settings?.postal_code || ''}
                        onChange={(e) => handleFieldChange('postal_code', e.target.value)}
                        placeholder="H1A 1A1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={formData.country || settings?.country || ''}
                        onChange={(e) => handleFieldChange('country', e.target.value)}
                        placeholder="Canada"
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
            </TabsContent>

            {/* Campuses Tab */}
            <TabsContent value="campuses">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Campuses & Locations</CardTitle>
                    <CardDescription>Manage your church's campuses and locations</CardDescription>
                  </div>
                  <Button onClick={handleAddCampus}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Campus
                  </Button>
                </CardHeader>
                <CardContent>
                  {campuses && campuses.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {campuses.map((campus) => (
                        <div
                          key={campus.id}
                          className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => handleEditCampus(campus)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <h4 className="font-medium">{campus.name}</h4>
                                {campus.code && (
                                  <span className="text-xs text-muted-foreground">({campus.code})</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {campus.is_main_campus && (
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  <Star className="h-3 w-3" />
                                  Main
                                </Badge>
                              )}
                              {!campus.is_active && (
                                <Badge variant="outline">Inactive</Badge>
                              )}
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
                      action={{
                        label: 'Add Campus',
                        onClick: handleAddCampus,
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Email Tab */}
            <TabsContent value="email">
              <Card>
                <CardHeader>
                  <CardTitle>Email Preferences</CardTitle>
                  <CardDescription>Configure email sender settings and templates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email_sender_name">Sender Name</Label>
                      <Input
                        id="email_sender_name"
                        value={formData.email_sender_name || settings?.email_sender_name || ''}
                        onChange={(e) => handleFieldChange('email_sender_name', e.target.value)}
                        placeholder="Xpandify"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email_sender_address">Sender Email</Label>
                      <Input
                        id="email_sender_address"
                        type="email"
                        value={formData.email_sender_address || settings?.email_sender_address || ''}
                        onChange={(e) => handleFieldChange('email_sender_address', e.target.value)}
                        placeholder="noreply@church.org"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email_reply_to">Reply-To Address</Label>
                    <Input
                      id="email_reply_to"
                      type="email"
                      value={formData.email_reply_to || settings?.email_reply_to || ''}
                      onChange={(e) => handleFieldChange('email_reply_to', e.target.value)}
                      placeholder="info@church.org"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email_footer_text">Email Footer</Label>
                    <Textarea
                      id="email_footer_text"
                      value={formData.email_footer_text || settings?.email_footer_text || ''}
                      onChange={(e) => handleFieldChange('email_footer_text', e.target.value)}
                      placeholder="This email was sent by My Church. © 2024 All rights reserved."
                      rows={3}
                    />
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

            {/* Branding Tab */}
            <TabsContent value="branding">
              <Card>
                <CardHeader>
                  <CardTitle>Branding & Theme</CardTitle>
                  <CardDescription>Customize your organization's visual identity</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primary_color">Primary Color</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          id="primary_color"
                          value={formData.primary_color || settings?.primary_color || '#1e3a5f'}
                          onChange={(e) => handleFieldChange('primary_color', e.target.value)}
                          className="w-10 h-10 rounded border cursor-pointer"
                        />
                        <Input
                          value={formData.primary_color || settings?.primary_color || '#1e3a5f'}
                          onChange={(e) => handleFieldChange('primary_color', e.target.value)}
                          placeholder="#1e3a5f"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="secondary_color">Secondary Color</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          id="secondary_color"
                          value={formData.secondary_color || settings?.secondary_color || '#6b7280'}
                          onChange={(e) => handleFieldChange('secondary_color', e.target.value)}
                          className="w-10 h-10 rounded border cursor-pointer"
                        />
                        <Input
                          value={formData.secondary_color || settings?.secondary_color || '#6b7280'}
                          onChange={(e) => handleFieldChange('secondary_color', e.target.value)}
                          placeholder="#6b7280"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accent_color">Accent Color</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          id="accent_color"
                          value={formData.accent_color || settings?.accent_color || '#f59e0b'}
                          onChange={(e) => handleFieldChange('accent_color', e.target.value)}
                          className="w-10 h-10 rounded border cursor-pointer"
                        />
                        <Input
                          value={formData.accent_color || settings?.accent_color || '#f59e0b'}
                          onChange={(e) => handleFieldChange('accent_color', e.target.value)}
                          placeholder="#f59e0b"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="font_family">Font Family</Label>
                    <Input
                      id="font_family"
                      value={formData.font_family || settings?.font_family || 'Inter'}
                      onChange={(e) => handleFieldChange('font_family', e.target.value)}
                      placeholder="Inter"
                    />
                  </div>

                  {/* Color Preview */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <h4 className="font-medium text-sm">Preview</h4>
                    <div className="flex items-center gap-4">
                      <div
                        className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-xs"
                        style={{ backgroundColor: formData.primary_color || settings?.primary_color || '#1e3a5f' }}
                      >
                        Primary
                      </div>
                      <div
                        className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-xs"
                        style={{ backgroundColor: formData.secondary_color || settings?.secondary_color || '#6b7280' }}
                      >
                        Secondary
                      </div>
                      <div
                        className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-xs"
                        style={{ backgroundColor: formData.accent_color || settings?.accent_color || '#f59e0b' }}
                      >
                        Accent
                      </div>
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
          </>
        )}
      </Tabs>

      <CampusFormDialog
        open={isCampusDialogOpen}
        onOpenChange={setIsCampusDialogOpen}
        campus={editingCampus}
      />
    </MainLayout>
  );
}
