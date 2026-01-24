import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Ministry, useCreateMinistry, useUpdateMinistry, useDeleteMinistry } from '@/hooks/useMinistries';
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
}

export function MinistryFormDialog({ open, onOpenChange, ministry }: MinistryFormDialogProps) {
  const { t } = useLanguage();
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
  });

  useEffect(() => {
    if (ministry) {
      setFormData({
        name_en: ministry.name_en || '',
        name_fr: ministry.name_fr || '',
        description_en: ministry.description_en || '',
        description_fr: ministry.description_fr || '',
        leader_id: ministry.leader_id || '',
      });
    } else {
      setFormData({
        name_en: '',
        name_fr: '',
        description_en: '',
        description_fr: '',
        leader_id: '',
      });
    }
  }, [ministry, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      leader_id: formData.leader_id || null,
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
          <DialogTitle className="font-serif">
            {isEditing ? 'Edit Ministry' : 'Add Ministry'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update ministry details' : 'Create a new ministry'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name_en">Name (English) *</Label>
              <Input
                id="name_en"
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                placeholder="Ministry name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name_fr">Name (Français)</Label>
              <Input
                id="name_fr"
                value={formData.name_fr}
                onChange={(e) => setFormData({ ...formData, name_fr: e.target.value })}
                placeholder="Nom du ministère"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description (English)</Label>
            <Textarea
              value={formData.description_en}
              onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
              placeholder="Ministry description..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Description (Français)</Label>
            <Textarea
              value={formData.description_fr}
              onChange={(e) => setFormData({ ...formData, description_fr: e.target.value })}
              placeholder="Description du ministère..."
              rows={3}
            />
          </div>

          {/* Leader */}
          <div className="space-y-2">
            <Label>Ministry Leader</Label>
            <Select
              value={formData.leader_id}
              onValueChange={(value) => setFormData({ ...formData, leader_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select leader" />
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
                    <AlertDialogTitle>Delete Ministry</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this ministry? This action cannot be undone.
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
