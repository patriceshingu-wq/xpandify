import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCampuses } from '@/hooks/useCampuses';
import { usePeople } from '@/hooks/usePeople';
import { useAppRoles } from '@/hooks/useAdminUsers';
import { useInviteUser } from '@/hooks/useInviteUser';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Mail, User, Briefcase } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const initialFormState = {
  email: '',
  first_name: '',
  last_name: '',
  preferred_name: '',
  phone: '',
  date_of_birth: '',
  gender: '' as 'male' | 'female' | 'other' | 'prefer_not_to_say' | '',
  primary_language: 'en' as 'en' | 'fr',
  person_type: 'staff' as 'staff' | 'volunteer' | 'congregant',
  status: 'active' as 'active' | 'inactive' | 'on_leave',
  supervisor_id: '',
  start_date: '',
  campus_id: '',
  title: '',
  role_id: '',
};

export function InviteUserDialog({ open, onOpenChange }: InviteUserDialogProps) {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const inviteUser = useInviteUser();
  const { data: campuses } = useCampuses();
  const { data: allPeople } = usePeople();
  const { data: roles } = useAppRoles();

  const [formData, setFormData] = useState(initialFormState);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await inviteUser.mutateAsync({
      email: formData.email,
      person: {
        first_name: formData.first_name,
        last_name: formData.last_name,
        preferred_name: formData.preferred_name || undefined,
        phone: formData.phone || undefined,
        date_of_birth: formData.date_of_birth || undefined,
        gender: formData.gender || undefined,
        primary_language: formData.primary_language,
        person_type: formData.person_type,
        status: formData.status,
        supervisor_id: formData.supervisor_id || undefined,
        start_date: formData.start_date || undefined,
        campus_id: formData.campus_id || undefined,
        title: formData.title || undefined,
      },
      role_id: formData.role_id || undefined,
    });

    // Reset form and close dialog on success
    setFormData(initialFormState);
    onOpenChange(false);
  };

  const supervisorOptions = allPeople?.filter(p => p.person_type === 'staff' || p.person_type === 'volunteer') || [];

  const formContent = (
    <form onSubmit={handleSubmit}>
      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="account" className="gap-1.5">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">{t('admin.inviteAccount')}</span>
            <span className="sm:hidden">Account</span>
          </TabsTrigger>
          <TabsTrigger value="person" className="gap-1.5">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{t('admin.invitePerson')}</span>
            <span className="sm:hidden">Person</span>
          </TabsTrigger>
          <TabsTrigger value="role" className="gap-1.5">
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">{t('admin.inviteRole')}</span>
            <span className="sm:hidden">Role</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('common.email')} *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@example.com"
              required
              className="touch-target"
            />
            <p className="text-xs text-muted-foreground">{t('admin.inviteEmailHelp')}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">{t('common.name')} *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="First name"
                required
                className="touch-target"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Last name"
                required
                className="touch-target"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preferred_name">Preferred Name</Label>
              <Input
                id="preferred_name"
                value={formData.preferred_name}
                onChange={(e) => setFormData({ ...formData, preferred_name: e.target.value })}
                placeholder="Preferred name"
                className="touch-target"
              />
            </div>
            <div className="space-y-2">
              <Label>Preferred Language</Label>
              <Select
                value={formData.primary_language}
                onValueChange={(value) => setFormData({ ...formData, primary_language: value as 'en' | 'fr' })}
              >
                <SelectTrigger className="touch-target">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="fr">Fran\u00e7ais</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="person" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('common.phone')}</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 234 567 8900"
                className="touch-target"
              />
            </div>
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="touch-target"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => setFormData({ ...formData, gender: value as typeof formData.gender })}
              >
                <SelectTrigger className="touch-target">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="touch-target"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('people.jobTitle')}</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Worship Pastor, Youth Coordinator"
              className="touch-target"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('people.campus')}</Label>
              <Select
                value={formData.campus_id}
                onValueChange={(value) => setFormData({ ...formData, campus_id: value })}
              >
                <SelectTrigger className="touch-target">
                  <SelectValue placeholder={t('people.selectCampus')} />
                </SelectTrigger>
                <SelectContent>
                  {campuses?.filter(c => c.is_active).map((campus) => (
                    <SelectItem key={campus.id} value={campus.id}>
                      {campus.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Supervisor</Label>
              <Select
                value={formData.supervisor_id}
                onValueChange={(value) => setFormData({ ...formData, supervisor_id: value })}
              >
                <SelectTrigger className="touch-target">
                  <SelectValue placeholder="Select supervisor" />
                </SelectTrigger>
                <SelectContent>
                  {supervisorOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.first_name} {p.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="role" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Person Type *</Label>
              <Select
                value={formData.person_type}
                onValueChange={(value) => setFormData({ ...formData, person_type: value as typeof formData.person_type })}
              >
                <SelectTrigger className="touch-target">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">{t('people.staff')}</SelectItem>
                  <SelectItem value="volunteer">{t('people.volunteer')}</SelectItem>
                  <SelectItem value="congregant">{t('people.congregant')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('common.status')}</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as typeof formData.status })}
              >
                <SelectTrigger className="touch-target">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t('people.active')}</SelectItem>
                  <SelectItem value="inactive">{t('people.inactive')}</SelectItem>
                  <SelectItem value="on_leave">{t('people.onLeave')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('admin.systemRole')}</Label>
            <Select
              value={formData.role_id}
              onValueChange={(value) => setFormData({ ...formData, role_id: value })}
            >
              <SelectTrigger className="touch-target">
                <SelectValue placeholder={t('admin.selectRole')} />
              </SelectTrigger>
              <SelectContent>
                {roles?.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {t(`roles.${role.name}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{t('admin.inviteRoleHelp')}</p>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={inviteUser.isPending}>
          {inviteUser.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('admin.sendInvite')}
        </Button>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="font-serif">{t('admin.inviteUser')}</DrawerTitle>
            <DrawerDescription>{t('admin.inviteUserDescription')}</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4 overflow-y-auto">
            {formContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">{t('admin.inviteUser')}</DialogTitle>
          <DialogDescription>{t('admin.inviteUserDescription')}</DialogDescription>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
