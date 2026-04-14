import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Ministry, useCreateMinistry, useUpdateMinistry, useDeleteMinistry, getDescendantIds } from '@/hooks/useMinistries';
import { usePeople } from '@/hooks/usePeople';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface MinistryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ministry?: Ministry | null;
  ministries?: Ministry[];
  defaultParentId?: string;
}

export function MinistryFormDialog({ open, onOpenChange, ministry, ministries = [], defaultParentId }: MinistryFormDialogProps) {
  const { t, getLocalizedField } = useLanguage();
  const createMinistry = useCreateMinistry();
  const updateMinistry = useUpdateMinistry();
  const deleteMinistry = useDeleteMinistry();
  const { data: people } = usePeople();
  
  const isEditing = !!ministry;

  const [formData, setFormData] = useState({
    name_en: '',
    name_fr: '',
    description_en: '',
    description_fr: '',
    leader_id: '',
    parent_ministry_id: '',
  });

  useEffect(() => {
    if (ministry) {
      setFormData({
        name_en: ministry.name_en || '',
        name_fr: ministry.name_fr || '',
        description_en: ministry.description_en || '',
        description_fr: ministry.description_fr || '',
        leader_id: ministry.leader_id || '',
        parent_ministry_id: ministry.parent_ministry_id || '',
      });
    } else {
      setFormData({
        name_en: '',
        name_fr: '',
        description_en: '',
        description_fr: '',
        leader_id: '',
        parent_ministry_id: defaultParentId || '',
      });
    }
  }, [ministry, open, defaultParentId]);

  // Filter out self and descendants to prevent circular references
  const parentOptions = useMemo(() => {
    if (!ministries.length) return [];
    const excludeIds = new Set<string>();
    if (ministry) {
      excludeIds.add(ministry.id);
      for (const id of getDescendantIds(ministries, ministry.id)) {
        excludeIds.add(id);
      }
    }
    return ministries.filter(m => !excludeIds.has(m.id));
  }, [ministries, ministry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      leader_id: formData.leader_id || null,
      parent_ministry_id: formData.parent_ministry_id || null,
    };

    if (isEditing && ministry) {
      await updateMinistry.mutateAsync({ id: ministry.id, ...payload });
    } else {
      await createMinistry.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (ministry) {
      await deleteMinistry.mutateAsync(ministry.id);
      onOpenChange(false);
    }
  };

  const isLoading = createMinistry.isPending || updateMinistry.isPending;
  const leaderOptions = people?.filter(p => p.person_type === 'staff' || p.person_type === 'volunteer') || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('ministries.editMinistry') : t('ministries.addMinistry')}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? t('ministries.updateDetails') : t('ministries.createNew')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Parent Ministry */}
          <div className="space-y-2">
            <Label>{t('ministries.parentMinistry')}</Label>
            <Select
              value={formData.parent_ministry_id}
              onValueChange={(value) => setFormData({ ...formData, parent_ministry_id: value === '__none__' ? '' : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('ministries.noneTopLevel')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t('ministries.noneTopLevel')}</SelectItem>
                {parentOptions.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {getLocalizedField(m, 'name')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name_en">{t('ministries.nameEnglish')} *</Label>
              <Input
                id="name_en"
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                placeholder={t('ministries.ministryName')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name_fr">{t('ministries.nameFrench')}</Label>
              <Input
                id="name_fr"
                value={formData.name_fr}
                onChange={(e) => setFormData({ ...formData, name_fr: e.target.value })}
                placeholder={t('ministries.ministryName')}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>{t('ministries.descriptionEnglish')}</Label>
            <Textarea
              value={formData.description_en}
              onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
              placeholder={t('ministries.ministryDescription')}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('ministries.descriptionFrench')}</Label>
            <Textarea
              value={formData.description_fr}
              onChange={(e) => setFormData({ ...formData, description_fr: e.target.value })}
              placeholder={t('ministries.ministryDescription')}
              rows={3}
            />
          </div>

          {/* Leader */}
          <div className="space-y-2">
            <Label>{t('ministries.ministryLeader')}</Label>
            <Select
              value={formData.leader_id}
              onValueChange={(value) => setFormData({ ...formData, leader_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('ministries.selectLeader')} />
              </SelectTrigger>
              <SelectContent>
                {leaderOptions.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.first_name} {p.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            {isEditing ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('common.delete')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('ministries.deleteMinistry')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('ministries.deleteConfirm')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      {t('common.delete')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('common.save')}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
