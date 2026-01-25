import { useState, useEffect } from 'react';
import { Campus, CampusInsert, useCreateCampus, useUpdateCampus, useDeleteCampus } from '@/hooks/useCampuses';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface CampusFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campus?: Campus | null;
}

export function CampusFormDialog({ open, onOpenChange, campus }: CampusFormDialogProps) {
  const createCampus = useCreateCampus();
  const updateCampus = useUpdateCampus();
  const deleteCampus = useDeleteCampus();

  const isEditing = !!campus;

  const [formData, setFormData] = useState<CampusInsert>({
    name: '',
    code: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state_province: '',
    postal_code: '',
    country: 'Canada',
    phone: '',
    email: '',
    is_main_campus: false,
    is_active: true,
  });

  useEffect(() => {
    if (campus) {
      setFormData({
        name: campus.name,
        code: campus.code || '',
        address_line1: campus.address_line1 || '',
        address_line2: campus.address_line2 || '',
        city: campus.city || '',
        state_province: campus.state_province || '',
        postal_code: campus.postal_code || '',
        country: campus.country || 'Canada',
        phone: campus.phone || '',
        email: campus.email || '',
        is_main_campus: campus.is_main_campus,
        is_active: campus.is_active,
      });
    } else {
      setFormData({
        name: '',
        code: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state_province: '',
        postal_code: '',
        country: 'Canada',
        phone: '',
        email: '',
        is_main_campus: false,
        is_active: true,
      });
    }
  }, [campus, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      code: formData.code || null,
      address_line1: formData.address_line1 || null,
      address_line2: formData.address_line2 || null,
      city: formData.city || null,
      state_province: formData.state_province || null,
      postal_code: formData.postal_code || null,
      country: formData.country || null,
      phone: formData.phone || null,
      email: formData.email || null,
    };

    if (isEditing && campus) {
      await updateCampus.mutateAsync({ id: campus.id, ...payload });
    } else {
      await createCampus.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (campus) {
      await deleteCampus.mutateAsync(campus.id);
      onOpenChange(false);
    }
  };

  const isLoading = createCampus.isPending || updateCampus.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {isEditing ? `Edit ${campus?.name}` : 'Add Campus'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update campus information' : 'Add a new campus or location'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Main Campus"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="MAIN"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_line1">Address Line 1</Label>
            <Input
              id="address_line1"
              value={formData.address_line1 || ''}
              onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
              placeholder="123 Main Street"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_line2">Address Line 2</Label>
            <Input
              id="address_line2"
              value={formData.address_line2 || ''}
              onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
              placeholder="Suite 100"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city || ''}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Montreal"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state_province">Province/State</Label>
              <Input
                id="state_province"
                value={formData.state_province || ''}
                onChange={(e) => setFormData({ ...formData, state_province: e.target.value })}
                placeholder="Quebec"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input
                id="postal_code"
                value={formData.postal_code || ''}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                placeholder="H1A 1A1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country || ''}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="Canada"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 514 555 0100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="campus@church.org"
              />
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Switch
                id="is_main_campus"
                checked={formData.is_main_campus}
                onCheckedChange={(checked) => setFormData({ ...formData, is_main_campus: checked })}
              />
              <Label htmlFor="is_main_campus">Main Campus</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            {isEditing ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Campus</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {campus?.name}? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
