import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';
import { AdminUser, useLinkPersonToUser } from '@/hooks/useAdminUsers';
import { usePeople } from '@/hooks/usePeople';
import { Search, User, Check } from 'lucide-react';

interface LinkPersonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser | null;
}

export function LinkPersonDialog({ open, onOpenChange, user }: LinkPersonDialogProps) {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const linkPerson = useLinkPersonToUser();

  const { data: people, isLoading } = usePeople({ 
    search: search || undefined,
  });

  // Filter out people already linked to a user
  const availablePeople = people?.filter((p) => !p.user_id) || [];

  const handleLink = async (personId: string) => {
    if (!user) return;
    await linkPerson.mutateAsync({ userId: user.id, personId });
    onOpenChange(false);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('admin.linkPerson')}</DialogTitle>
          <DialogDescription>
            {t('admin.linkPersonTo')} <strong>{user.email}</strong>
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
                    onClick={() => handleLink(person.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {person.preferred_name || person.first_name} {person.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">{person.email || 'No email'}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <User className="h-10 w-10 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {search ? t('common.noResults') : t('admin.noPeopleAvailable')}
                </p>
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
