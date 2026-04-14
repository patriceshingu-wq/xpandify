import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMinistryRoles, useCreateMinistryRole, useUpdateMinistryRole, useDeleteMinistryRole, MinistryRole } from '@/hooks/useMinistryRoles';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Plus, Pencil, Trash2, Tag, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const ROLE_CATEGORIES = ['pastoral', 'worship', 'children', 'youth', 'media', 'admin', 'other'] as const;

export function MinistryRolesManagement() {
  const { t, getLocalizedField } = useLanguage();
  const { data: roles, isLoading } = useMinistryRoles();
  const createRole = useCreateMinistryRole();
  const updateRole = useUpdateMinistryRole();
  const deleteRole = useDeleteMinistryRole();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<MinistryRole | null>(null);
  const [formData, setFormData] = useState({
    name_en: '',
    name_fr: '',
    description_en: '',
    description_fr: '',
    category: 'other' as typeof ROLE_CATEGORIES[number],
    is_staff_role: false,
    is_volunteer_role: true,
  });

  const resetForm = () => {
    setFormData({
      name_en: '',
      name_fr: '',
      description_en: '',
      description_fr: '',
      category: 'other',
      is_staff_role: false,
      is_volunteer_role: true,
    });
    setEditingRole(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (role: MinistryRole) => {
    setEditingRole(role);
    setFormData({
      name_en: role.name_en,
      name_fr: role.name_fr || '',
      description_en: role.description_en || '',
      description_fr: role.description_fr || '',
      category: role.category || 'other',
      is_staff_role: role.is_staff_role || false,
      is_volunteer_role: role.is_volunteer_role ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name_en: formData.name_en,
      name_fr: formData.name_fr || null,
      description_en: formData.description_en || null,
      description_fr: formData.description_fr || null,
      category: formData.category,
      is_staff_role: formData.is_staff_role,
      is_volunteer_role: formData.is_volunteer_role,
    };

    if (editingRole) {
      await updateRole.mutateAsync({ id: editingRole.id, ...payload });
    } else {
      await createRole.mutateAsync(payload);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deleteRole.mutateAsync(id);
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

  const isSubmitting = createRole.isPending || updateRole.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>{t('ministries.manageRoles')}</CardTitle>
          <CardDescription>
            {t('admin.ministryRolesDescription')}
          </CardDescription>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('ministries.addRole')}
        </Button>
      </CardHeader>
      <CardContent>
        {roles && roles.length > 0 ? (
          <div className="grid gap-3">
            {roles.map((role) => (
              <div
                key={role.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-2 rounded-lg bg-muted">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{getLocalizedField(role, 'name')}</p>
                      {role.category && (
                        <Badge variant="secondary" className={`text-xs ${getCategoryColor(role.category)}`}>
                          {t(`ministries.category.${role.category}`)}
                        </Badge>
                      )}
                      {role.is_staff_role && (
                        <Badge variant="outline" className="text-xs">
                          {t('ministries.staffRole')}
                        </Badge>
                      )}
                      {role.is_volunteer_role && (
                        <Badge variant="outline" className="text-xs">
                          {t('ministries.volunteerRole')}
                        </Badge>
                      )}
                    </div>
                    {getLocalizedField(role, 'description') && (
                      <p className="text-sm text-muted-foreground mt-0.5 truncate">
                        {getLocalizedField(role, 'description')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(role)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('ministries.deleteRole')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('ministries.deleteRoleConfirm')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(role.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {t('common.delete')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Tag className="h-12 w-12" />}
            title={t('ministries.noRoles')}
            description={t('admin.noMinistryRolesDescription')}
            action={{
              label: t('ministries.addRole'),
              onClick: openCreateDialog,
            }}
          />
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? t('ministries.editRole') : t('ministries.addRole')}
            </DialogTitle>
            <DialogDescription>
              {editingRole ? t('admin.editMinistryRoleDescription') : t('admin.createMinistryRoleDescription')}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name_en">{t('ministries.nameEnglish')} *</Label>
                <Input
                  id="name_en"
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name_fr">{t('ministries.nameFrench')}</Label>
                <Input
                  id="name_fr"
                  value={formData.name_fr}
                  onChange={(e) => setFormData({ ...formData, name_fr: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description_en">{t('ministries.descriptionEnglish')}</Label>
              <Textarea
                id="description_en"
                value={formData.description_en}
                onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description_fr">{t('ministries.descriptionFrench')}</Label>
              <Textarea
                id="description_fr"
                value={formData.description_fr}
                onChange={(e) => setFormData({ ...formData, description_fr: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('ministries.roleCategory')}</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as typeof ROLE_CATEGORIES[number] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {t(`ministries.category.${cat}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_staff_role"
                  checked={formData.is_staff_role}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_staff_role: !!checked })}
                />
                <Label htmlFor="is_staff_role" className="cursor-pointer">
                  {t('ministries.staffRole')}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_volunteer_role"
                  checked={formData.is_volunteer_role}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_volunteer_role: !!checked })}
                />
                <Label htmlFor="is_volunteer_role" className="cursor-pointer">
                  {t('ministries.volunteerRole')}
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('common.save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
