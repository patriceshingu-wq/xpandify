import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MinistryMember, useRemoveMinistryMember } from '@/hooks/useMinistryMembers';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { User, X, Plus, Users } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { AddMinistryMemberDialog } from './AddMinistryMemberDialog';
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

interface MinistryMembersListProps {
  ministryId: string;
  members: MinistryMember[];
  isLoading: boolean;
  canManage: boolean;
}

export function MinistryMembersList({ ministryId, members, isLoading, canManage }: MinistryMembersListProps) {
  const { t } = useLanguage();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const removeMember = useRemoveMinistryMember();

  const handleRemove = async (member: MinistryMember) => {
    await removeMember.mutateAsync({ id: member.id, ministryId });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Members ({members.length})
        </h3>
        {canManage && (
          <Button size="sm" onClick={() => setShowAddDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Member
          </Button>
        )}
      </div>

      {members.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {members.map((member) => (
            <Card key={member.id} className="transition-all hover:shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-accent/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {member.person.preferred_name || member.person.first_name} {member.person.last_name}
                    </p>
                    {member.person.person_type && (
                      <p className="text-xs text-muted-foreground capitalize">
                        {member.person.person_type}
                      </p>
                    )}
                  </div>
                </div>
                {canManage && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <X className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Member</AlertDialogTitle>
                        <AlertDialogDescription>
                          Remove {member.person.preferred_name || member.person.first_name} {member.person.last_name} from this ministry?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRemove(member)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title="No members yet"
          description="Add people to this ministry to get started"
          action={canManage ? {
            label: 'Add Member',
            onClick: () => setShowAddDialog(true),
          } : undefined}
        />
      )}

      {canManage && (
        <AddMinistryMemberDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          ministryId={ministryId}
          existingMembers={members}
        />
      )}
    </div>
  );
}
