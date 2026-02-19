import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMinistryRoles } from '@/hooks/useMinistryRoles';
import { usePersonRoles, useSyncPersonRoles } from '@/hooks/usePersonRoles';

interface ManageMemberRolesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personId: string;
  personName: string;
}

export function ManageMemberRolesDialog({
  open,
  onOpenChange,
  personId,
  personName,
}: ManageMemberRolesDialogProps) {
  const { t, getLocalizedField } = useLanguage();
  const { data: allRoles, isLoading: rolesLoading } = useMinistryRoles();
  const { data: personRoles, isLoading: personRolesLoading } = usePersonRoles(personId);
  const syncRoles = useSyncPersonRoles();

  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<string>>(new Set());

  // Initialize selected roles when data loads
  useEffect(() => {
    if (personRoles) {
      setSelectedRoleIds(new Set(personRoles.map(pr => pr.role_id)));
    }
  }, [personRoles]);

  const handleToggleRole = (roleId: string) => {
    const newSet = new Set(selectedRoleIds);
    if (newSet.has(roleId)) {
      newSet.delete(roleId);
    } else {
      newSet.add(roleId);
    }
    setSelectedRoleIds(newSet);
  };

  const handleSave = async () => {
    await syncRoles.mutateAsync({
      personId,
      roleIds: Array.from(selectedRoleIds),
    });
    onOpenChange(false);
  };

  const getCategoryColor = (category: string | null) => {
    switch (category) {
      case 'pastoral': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'worship': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'children': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'youth': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'media': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      case 'admin': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
    }
  };

  const isLoading = rolesLoading || personRolesLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('ministries.manageRoles')}</DialogTitle>
          <DialogDescription>
            {t('ministries.selectRoles')} {personName}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="spinner" />
          </div>
        ) : (
          <ScrollArea className="max-h-[300px] border rounded-lg p-4">
            <div className="space-y-3">
              {allRoles?.map((role) => (
                <div
                  key={role.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleToggleRole(role.id)}
                >
                  <Checkbox
                    id={role.id}
                    checked={selectedRoleIds.has(role.id)}
                    onCheckedChange={() => handleToggleRole(role.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <Label
                      htmlFor={role.id}
                      className="font-medium cursor-pointer"
                    >
                      {getLocalizedField(role, 'name')}
                    </Label>
                    {role.category && (
                      <Badge
                        variant="secondary"
                        className={`ml-2 text-xs ${getCategoryColor(role.category)}`}
                      >
                        {t(`ministries.category.${role.category}`)}
                      </Badge>
                    )}
                    {getLocalizedField(role, 'description') && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {getLocalizedField(role, 'description')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {(!allRoles || allRoles.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('ministries.noRoles')}
                </p>
              )}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={syncRoles.isPending}>
            {syncRoles.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
