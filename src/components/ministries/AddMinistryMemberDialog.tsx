import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePeople } from '@/hooks/usePeople';
import { useAddMinistryMember, MinistryMember } from '@/hooks/useMinistryMembers';
import { Search, User, Plus } from 'lucide-react';

interface AddMinistryMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ministryId: string;
  existingMembers: MinistryMember[];
}

export function AddMinistryMemberDialog({ open, onOpenChange, ministryId, existingMembers }: AddMinistryMemberDialogProps) {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const addMember = useAddMinistryMember();

  const { data: people, isLoading } = usePeople({
    search: search || undefined,
  });

  const existingPersonIds = new Set(existingMembers.map(m => m.person_id));
  const availablePeople = people?.filter(p => !existingPersonIds.has(p.id)) || [];

  const handleAdd = async (personId: string) => {
    await addMember.mutateAsync({ personId, ministryId });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Member</DialogTitle>
          <DialogDescription>
            Search for a person to add to this ministry
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('people.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[300px] border rounded-lg">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="spinner" />
              </div>
            ) : availablePeople.length > 0 ? (
              <div className="divide-y">
                {availablePeople.map((person) => (
                  <div
                    key={person.id}
                    className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleAdd(person.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-accent/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {person.preferred_name || person.first_name} {person.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">{person.email || 'No email'}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" disabled={addMember.isPending}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <User className="h-10 w-10 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {search ? t('common.noResults') : 'No people available to add'}
                </p>
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
