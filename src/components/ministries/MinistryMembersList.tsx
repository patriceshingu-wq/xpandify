import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { MinistryMember, useRemoveMinistryMember } from '@/hooks/useMinistryMembers';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { User, X, Plus, Users, Settings2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { AddMinistryMemberDialog } from './AddMinistryMemberDialog';
import { MemberRolesBadge } from './MemberRolesBadge';
import { ManageMemberRolesDialog } from './ManageMemberRolesDialog';
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
  const [managingRolesMember, setManagingRolesMember] = useState<MinistryMember | null>(null);
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
          {t('ministries.members')} ({members.length})
        </h3>
        {canManage && (
          <Button size="sm" onClick={() => setShowAddDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('ministries.addMember')}
          </Button>
        )}
      </div>

      {members.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {members.map((member) => (
            <Card key={member.id} className="transition-all hover:shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <Link to={`/people/${member.person_id}`} className="flex items-center gap-3 flex-1 min-w-0 group/member">
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm group-hover/member:text-primary group-hover/member:underline transition-colors">
                      {member.person.preferred_name || member.person.first_name} {member.person.last_name}
                    </p>
                    {member.person.person_type && (
                      <p className="text-xs text-muted-foreground capitalize">
                        {member.person.person_type}
                      </p>
                    )}
                    <MemberRolesBadge personId={member.person_id} />
                  </div>
                </Link>
                {canManage && (
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => setManagingRolesMember(member)}
                      title={t('ministries.manageRoles')}
                    >
                      <Settings2 className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <X className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('ministries.removeMember')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('ministries.removeMemberConfirm').replace('{name}', `${member.person.preferred_name || member.person.first_name} ${member.person.last_name}`)}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRemove(member)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {t('common.remove')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title={t('ministries.noMembers')}
          description={t('ministries.noMembersDescription')}
          action={canManage ? {
            label: t('ministries.addMember'),
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

      {managingRolesMember && (
        <ManageMemberRolesDialog
          open={!!managingRolesMember}
          onOpenChange={(open) => !open && setManagingRolesMember(null)}
          personId={managingRolesMember.person_id}
          personName={`${managingRolesMember.person.preferred_name || managingRolesMember.person.first_name} ${managingRolesMember.person.last_name}`}
        />
      )}
    </div>
  );
}
