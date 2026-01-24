import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { AdminUser, AppRole, useAssignRole, useRemoveRole } from '@/hooks/useAdminUsers';
import { AppRoleType } from '@/contexts/AuthContext';
import { Shield, ShieldCheck, UserCog, Users, Heart } from 'lucide-react';

interface UserRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser | null;
  roles: AppRole[];
}

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

export function UserRoleDialog({ open, onOpenChange, user, roles }: UserRoleDialogProps) {
  const { t } = useLanguage();
  const assignRole = useAssignRole();
  const removeRole = useRemoveRole();
  const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({});

  if (!user) return null;

  const userRoleNames = user.roles;

  const handleRoleToggle = async (role: AppRole, checked: boolean) => {
    if (!user) return;
    
    setPendingChanges((prev) => ({ ...prev, [role.id]: true }));
    
    try {
      if (checked) {
        await assignRole.mutateAsync({ userId: user.id, roleId: role.id });
      } else {
        await removeRole.mutateAsync({ userId: user.id, roleId: role.id });
      }
    } finally {
      setPendingChanges((prev) => ({ ...prev, [role.id]: false }));
    }
  };

  const displayName = user.person 
    ? `${user.person.preferred_name || user.person.first_name} ${user.person.last_name}`
    : user.email;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('admin.manageRoles')}</DialogTitle>
          <DialogDescription>
            {t('admin.manageRolesFor')} <strong>{displayName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {userRoleNames.length > 0 ? (
              userRoleNames.map((roleName) => (
                <Badge key={roleName} variant="outline" className={roleColors[roleName]}>
                  {roleIcons[roleName]}
                  <span className="ml-1 capitalize">{roleName.replace('_', ' ')}</span>
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">{t('admin.noRolesAssigned')}</span>
            )}
          </div>

          <div className="border rounded-lg divide-y">
            {roles.map((role) => {
              const isChecked = userRoleNames.includes(role.name);
              const isPending = pendingChanges[role.id];

              return (
                <div key={role.id} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={role.id}
                      checked={isChecked}
                      onCheckedChange={(checked) => handleRoleToggle(role, checked as boolean)}
                      disabled={isPending}
                    />
                    <div>
                      <Label htmlFor={role.id} className="flex items-center gap-2 cursor-pointer">
                        {roleIcons[role.name]}
                        <span className="capitalize font-medium">{role.name.replace('_', ' ')}</span>
                      </Label>
                      {role.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>
                      )}
                    </div>
                  </div>
                  {isPending && <div className="spinner h-4 w-4" />}
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>{t('common.close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
