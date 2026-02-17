import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth, AppRoleType } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { User, Mail, Phone, Globe, Shield, ShieldCheck, UserCog, Users, Heart, Save, Loader2, Lock } from 'lucide-react';

const roleIcons: Record<AppRoleType, React.ReactNode> = {
  super_admin: <ShieldCheck className="h-4 w-4" />,
  admin: <Shield className="h-4 w-4" />,
  pastor_supervisor: <UserCog className="h-4 w-4" />,
  staff: <Users className="h-4 w-4" />,
  volunteer: <Heart className="h-4 w-4" />,
};

const roleColors: Record<AppRoleType, string> = {
  super_admin: 'bg-destructive/10 text-destructive border-destructive/20',
  admin: 'bg-warning/10 text-warning border-warning/20',
  pastor_supervisor: 'bg-info/10 text-info border-info/20',
  staff: 'bg-success/10 text-success border-success/20',
  volunteer: 'bg-accent/10 text-accent border-accent/20',
};

export default function Profile() {
  const { t, language, setLanguage } = useLanguage();
  const { user, profile, person, roles } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Form state for person data
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [callingDescription, setCallingDescription] = useState('');
  const [strengths, setStrengths] = useState('');
  const [growthAreas, setGrowthAreas] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Load initial data
  useEffect(() => {
    if (person) {
      setFirstName(person.first_name || '');
      setLastName(person.last_name || '');
      setPreferredName(person.preferred_name || '');
      setEmail(person.email || '');
    }
  }, [person]);

  // Load full person data
  useEffect(() => {
    const loadFullPersonData = async () => {
      if (!person?.id) return;

      const { data } = await supabase
        .from('people')
        .select('phone, calling_description, strengths, growth_areas')
        .eq('id', person.id)
        .single();

      if (data) {
        setPhone(data.phone || '');
        setCallingDescription(data.calling_description || '');
        setStrengths(data.strengths || '');
        setGrowthAreas(data.growth_areas || '');
      }
    };

    loadFullPersonData();
  }, [person?.id]);

  const handleSaveProfile = async () => {
    if (!person?.id) {
      toast({
        title: t('profile.error'),
        description: t('profile.noPersonLinked'),
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('people')
        .update({
          first_name: firstName,
          last_name: lastName,
          preferred_name: preferredName || null,
          email: email || null,
          phone: phone || null,
          calling_description: callingDescription || null,
          strengths: strengths || null,
          growth_areas: growthAreas || null,
        })
        .eq('id', person.id);

      if (error) throw error;

      toast({
        title: t('profile.saved'),
        description: t('profile.savedDescription'),
      });
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLanguageChange = async (useFrench: boolean) => {
    const newLang = useFrench ? 'fr' : 'en';
    setLanguage(newLang);

    if (profile?.id) {
      await supabase
        .from('profiles')
        .update({ primary_language: newLang })
        .eq('id', profile.id);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: t('common.error'), description: t('profile.passwordTooShort'), variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: t('common.error'), description: t('profile.passwordsMismatch'), variant: 'destructive' });
      return;
    }
    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: t('profile.passwordUpdated') });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getInitials = () => {
    if (person) {
      return `${person.first_name.charAt(0)}${person.last_name.charAt(0)}`.toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  const displayName = person
    ? `${person.preferred_name || person.first_name} ${person.last_name}`
    : user?.email || 'User';

  return (
    <MainLayout title={t('profile.title')} subtitle={t('profile.subtitle')}>
      <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
        <PageHeader
          title={t('profile.title')}
          subtitle={t('profile.subtitle')}
        />

        {/* Profile Header Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-accent/10 text-accent text-2xl font-medium">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-foreground">{displayName}</h2>
                <p className="text-muted-foreground flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4" />
                  {user?.email}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {roles.length > 0 ? (
                    roles.map((role) => (
                      <Badge key={role} variant="outline" className={roleColors[role]}>
                        {roleIcons[role]}
                        <span className="ml-1">{t(`roles.${role}`)}</span>
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="secondary">{t('profile.noRoles')}</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('profile.personalInfo')}
              </CardTitle>
              <CardDescription>{t('profile.personalInfoDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {person ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">{t('profile.firstName')}</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">{t('profile.lastName')}</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preferredName">{t('profile.preferredName')}</Label>
                    <Input
                      id="preferredName"
                      value={preferredName}
                      onChange={(e) => setPreferredName(e.target.value)}
                      placeholder={t('profile.preferredNamePlaceholder')}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">{t('common.email')}</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">{t('common.phone')}</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="callingDescription">{t('profile.calling')}</Label>
                    <Textarea
                      id="callingDescription"
                      value={callingDescription}
                      onChange={(e) => setCallingDescription(e.target.value)}
                      placeholder={t('profile.callingPlaceholder')}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="strengths">{t('profile.strengths')}</Label>
                      <Textarea
                        id="strengths"
                        value={strengths}
                        onChange={(e) => setStrengths(e.target.value)}
                        placeholder={t('profile.strengthsPlaceholder')}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="growthAreas">{t('profile.growthAreas')}</Label>
                      <Textarea
                        id="growthAreas"
                        value={growthAreas}
                        onChange={(e) => setGrowthAreas(e.target.value)}
                        placeholder={t('profile.growthAreasPlaceholder')}
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSaveProfile} disabled={isSaving}>
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {t('common.save')}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">{t('profile.noPersonLinked')}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t('profile.contactAdmin')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settings & Roles */}
          <div className="space-y-6">
            {/* Language Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  {t('profile.language')}
                </CardTitle>
                <CardDescription>{t('profile.languageDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={language === 'en' ? 'font-medium' : 'text-muted-foreground'}>
                      English
                    </span>
                    <Switch
                      checked={language === 'fr'}
                      onCheckedChange={handleLanguageChange}
                    />
                    <span className={language === 'fr' ? 'font-medium' : 'text-muted-foreground'}>
                      Français
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Roles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {t('profile.yourRoles')}
                </CardTitle>
                <CardDescription>{t('profile.rolesDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                {roles.length > 0 ? (
                  <div className="space-y-3">
                    {roles.map((role) => (
                      <div
                        key={role}
                        className="flex items-center gap-3 p-3 rounded-lg border"
                      >
                        <div className={`p-2 rounded-lg ${roleColors[role]}`}>
                          {roleIcons[role]}
                        </div>
                        <div>
                          <p className="font-medium">{t(`roles.${role}`)}</p>
                          <p className="text-xs text-muted-foreground">
                            {t(`profile.role.${role}`)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Shield className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">{t('profile.noRolesDescription')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            {/* Change Password */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  {t('profile.changePassword')}
                </CardTitle>
                <CardDescription>{t('profile.changePasswordDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t('profile.newPassword')}</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('profile.confirmPassword')}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword || !newPassword}
                  className="w-full"
                >
                  {isChangingPassword ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Lock className="h-4 w-4 mr-2" />
                  )}
                  {t('profile.updatePassword')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
