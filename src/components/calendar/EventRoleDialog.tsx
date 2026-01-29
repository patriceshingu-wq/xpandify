import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePeople } from '@/hooks/usePeople';
import { useCreateEventRole } from '@/hooks/useEventRoles';

interface EventRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
}

const commonRoles = [
  'Preacher',
  'Coordinator',
  'Worship Leader',
  'Tech',
  'Host',
  'Prayer Lead',
  'Translator',
  'Speaker',
  'Facilitator',
  'Other',
];

export default function EventRoleDialog({ open, onOpenChange, eventId }: EventRoleDialogProps) {
  const { t, getLocalizedField } = useLanguage();
  const { data: people } = usePeople();
  const createRole = useCreateEventRole();

  const [formData, setFormData] = useState({
    person_id: '',
    role: '',
    from_country: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await createRole.mutateAsync({
      event_id: eventId,
      person_id: formData.person_id,
      role: formData.role,
      from_country: formData.from_country || null,
      notes: formData.notes || null,
    });

    setFormData({ person_id: '', role: '', from_country: '', notes: '' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('calendar.addAssignment') || 'Add Team Assignment'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="person">{t('calendar.person') || 'Person'} *</Label>
            <Select
              value={formData.person_id}
              onValueChange={(v) => setFormData({ ...formData, person_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('calendar.selectPerson') || 'Select person'} />
              </SelectTrigger>
              <SelectContent>
                {people?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.preferred_name || p.first_name} {p.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">{t('calendar.role') || 'Role'} *</Label>
            <Select
              value={formData.role}
              onValueChange={(v) => setFormData({ ...formData, role: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('calendar.selectRole') || 'Select role'} />
              </SelectTrigger>
              <SelectContent>
                {commonRoles.map((role) => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">{t('calendar.fromCountry') || 'From Country'}</Label>
            <Input
              id="country"
              value={formData.from_country}
              onChange={(e) => setFormData({ ...formData, from_country: e.target.value })}
              placeholder="e.g., USA, DRC, Kenya"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t('calendar.notes') || 'Notes'}</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={createRole.isPending || !formData.person_id || !formData.role}>
              {createRole.isPending ? t('common.saving') || 'Saving...' : t('common.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
