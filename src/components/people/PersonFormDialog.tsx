import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Person, useCreatePerson, useUpdatePerson, useDeletePerson, usePeople } from '@/hooks/usePeople';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface PersonFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person?: Person | null;
}

export function PersonFormDialog({ open, onOpenChange, person }: PersonFormDialogProps) {
  const { t } = useLanguage();
  const createPerson = useCreatePerson();
  const updatePerson = useUpdatePerson();
  const deletePerson = useDeletePerson();
  const { data: allPeople } = usePeople();
  
  const isEditing = !!person;

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    preferred_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '' as 'male' | 'female' | 'other' | 'prefer_not_to_say' | '',
    primary_language: 'en' as 'en' | 'fr',
    person_type: 'congregant' as 'staff' | 'volunteer' | 'congregant',
    status: 'active' as 'active' | 'inactive' | 'on_leave',
    supervisor_id: '',
    start_date: '',
    campus: '',
    notes: '',
    calling_description: '',
    strengths: '',
    growth_areas: '',
  });

  useEffect(() => {
    if (person) {
      setFormData({
        first_name: person.first_name || '',
        last_name: person.last_name || '',
        preferred_name: person.preferred_name || '',
        email: person.email || '',
        phone: person.phone || '',
        date_of_birth: person.date_of_birth || '',
        gender: person.gender || '',
        primary_language: person.primary_language || 'en',
        person_type: person.person_type || 'congregant',
        status: person.status || 'active',
        supervisor_id: person.supervisor_id || '',
        start_date: person.start_date || '',
        campus: person.campus || '',
        notes: person.notes || '',
        calling_description: person.calling_description || '',
        strengths: person.strengths || '',
        growth_areas: person.growth_areas || '',
      });
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        preferred_name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        gender: '',
        primary_language: 'en',
        person_type: 'congregant',
        status: 'active',
        supervisor_id: '',
        start_date: '',
        campus: '',
        notes: '',
        calling_description: '',
        strengths: '',
        growth_areas: '',
      });
    }
  }, [person, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      gender: formData.gender || null,
      supervisor_id: formData.supervisor_id || null,
      date_of_birth: formData.date_of_birth || null,
      start_date: formData.start_date || null,
    };

    if (isEditing && person) {
      await updatePerson.mutateAsync({ id: person.id, ...payload });
    } else {
      await createPerson.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (person) {
      await deletePerson.mutateAsync(person.id);
      onOpenChange(false);
    }
  };

  const isLoading = createPerson.isPending || updatePerson.isPending;

  const supervisorOptions = allPeople?.filter(p => p.id !== person?.id && (p.person_type === 'staff' || p.person_type === 'volunteer')) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {isEditing ? `Edit ${person?.first_name} ${person?.last_name}` : t('people.addPerson')}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update person information' : 'Add a new person to the system'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="ministry">Ministry</TabsTrigger>
              <TabsTrigger value="development">Development</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">{t('common.name')} *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="First name"
                    required
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('common.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('common.phone')}</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 234 567 8900"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value as any })}
                  >
                    <SelectTrigger>
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
                  <Label>Preferred Language</Label>
                  <Select
                    value={formData.primary_language}
                    onValueChange={(value) => setFormData({ ...formData, primary_language: value as 'en' | 'fr' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ministry" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Person Type</Label>
                  <Select
                    value={formData.person_type}
                    onValueChange={(value) => setFormData({ ...formData, person_type: value as any })}
                  >
                    <SelectTrigger>
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
                    onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                  >
                    <SelectTrigger>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Supervisor</Label>
                  <Select
                    value={formData.supervisor_id}
                    onValueChange={(value) => setFormData({ ...formData, supervisor_id: value })}
                  >
                    <SelectTrigger>
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
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Campus</Label>
                <Input
                  value={formData.campus}
                  onChange={(e) => setFormData({ ...formData, campus: e.target.value })}
                  placeholder="Main Campus"
                />
              </div>

              <div className="space-y-2">
                <Label>{t('common.notes')}</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="General notes about this person..."
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="development" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Calling Description</Label>
                <Textarea
                  value={formData.calling_description}
                  onChange={(e) => setFormData({ ...formData, calling_description: e.target.value })}
                  placeholder="Describe their sense of calling and ministry direction..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Strengths</Label>
                <Textarea
                  value={formData.strengths}
                  onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                  placeholder="Key strengths and gifts..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Growth Areas</Label>
                <Textarea
                  value={formData.growth_areas}
                  onChange={(e) => setFormData({ ...formData, growth_areas: e.target.value })}
                  placeholder="Areas for development and growth..."
                  rows={3}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-between mt-6 pt-4 border-t">
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
                    <AlertDialogTitle>Delete Person</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {person?.first_name} {person?.last_name}? This action cannot be undone.
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
