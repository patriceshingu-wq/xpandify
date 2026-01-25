import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';
import { AdminUser, AppRole, useUpdateUserStatus } from '@/hooks/useAdminUsers';
import { AppRoleType } from '@/contexts/AuthContext';
import { MoreHorizontal, Shield, UserPlus, Link2, Mail, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { UserRoleDialog } from './UserRoleDialog';
import { LinkPersonDialog } from './LinkPersonDialog';
import { useIsMobile } from '@/hooks/use-mobile';

interface UserManagementTableProps {
  users: AdminUser[];
  roles: AppRole[];
}

const roleColors: Record<AppRoleType, string> = {
  super_admin: 'bg-destructive/10 text-destructive border-destructive/20',
  admin: 'bg-warning/10 text-warning border-warning/20',
  pastor_supervisor: 'bg-info/10 text-info border-info/20',
  staff: 'bg-success/10 text-success border-success/20',
  volunteer: 'bg-accent/10 text-accent border-accent/20',
};

export function UserManagementTable({ users, roles }: UserManagementTableProps) {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const updateStatus = useUpdateUserStatus();
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);

  const handleStatusChange = async (user: AdminUser, isActive: boolean) => {
    await updateStatus.mutateAsync({ userId: user.id, isActive });
  };

  const handleManageRoles = (user: AdminUser) => {
    setSelectedUser(user);
    setIsRoleDialogOpen(true);
  };

  const handleLinkPerson = (user: AdminUser) => {
    setSelectedUser(user);
    setIsLinkDialogOpen(true);
  };

  // Mobile card view
  if (isMobile) {
    return (
      <>
        <div className="space-y-3">
          {users.map((user) => (
            <Card key={user.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {user.person ? (
                      <>
                        <p className="font-medium truncate">
                          {user.person.preferred_name || user.person.first_name} {user.person.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium flex items-center gap-1 truncate">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </p>
                        <p className="text-xs text-warning flex items-center gap-1">
                          <Link2 className="h-3 w-3" />
                          {t('admin.notLinked')}
                        </p>
                      </>
                    )}
                    
                    {/* Roles */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {user.roles.length > 0 ? (
                        user.roles.map((role) => (
                          <Badge key={role} variant="outline" className={`text-xs ${roleColors[role]}`}>
                            {role.replace('_', ' ')}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground italic">{t('admin.noRoles')}</span>
                      )}
                    </div>
                    
                    {/* Joined date */}
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(user.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex flex-col items-end gap-2">
                    <Switch
                      checked={user.is_active}
                      onCheckedChange={(checked) => handleStatusChange(user, checked)}
                      disabled={updateStatus.isPending}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 touch-target">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="z-50 bg-popover">
                        <DropdownMenuItem onClick={() => handleManageRoles(user)} className="touch-target">
                          <Shield className="h-4 w-4 mr-2" />
                          {t('admin.manageRoles')}
                        </DropdownMenuItem>
                        {!user.person && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleLinkPerson(user)} className="touch-target">
                              <UserPlus className="h-4 w-4 mr-2" />
                              {t('admin.linkPerson')}
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <UserRoleDialog
          open={isRoleDialogOpen}
          onOpenChange={setIsRoleDialogOpen}
          user={selectedUser}
          roles={roles}
        />

        <LinkPersonDialog
          open={isLinkDialogOpen}
          onOpenChange={setIsLinkDialogOpen}
          user={selectedUser}
        />
      </>
    );
  }

  // Desktop table view
  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[300px]">{t('admin.user')}</TableHead>
              <TableHead>{t('admin.roles')}</TableHead>
              <TableHead className="w-[150px]">{t('admin.joined')}</TableHead>
              <TableHead className="w-[100px] text-center">{t('admin.status')}</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex flex-col">
                    {user.person ? (
                      <>
                        <span className="font-medium">
                          {user.person.preferred_name || user.person.first_name} {user.person.last_name}
                        </span>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="font-medium flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          {user.email}
                        </span>
                        <span className="text-xs text-warning flex items-center gap-1">
                          <Link2 className="h-3 w-3" />
                          {t('admin.notLinked')}
                        </span>
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {user.roles.length > 0 ? (
                      user.roles.map((role) => (
                        <Badge key={role} variant="outline" className={`text-xs ${roleColors[role]}`}>
                          {role.replace('_', ' ')}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground italic">{t('admin.noRoles')}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(user.created_at), 'MMM d, yyyy')}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={user.is_active}
                    onCheckedChange={(checked) => handleStatusChange(user, checked)}
                    disabled={updateStatus.isPending}
                  />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="z-50 bg-popover">
                      <DropdownMenuItem onClick={() => handleManageRoles(user)}>
                        <Shield className="h-4 w-4 mr-2" />
                        {t('admin.manageRoles')}
                      </DropdownMenuItem>
                      {!user.person && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleLinkPerson(user)}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            {t('admin.linkPerson')}
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <UserRoleDialog
        open={isRoleDialogOpen}
        onOpenChange={setIsRoleDialogOpen}
        user={selectedUser}
        roles={roles}
      />

      <LinkPersonDialog
        open={isLinkDialogOpen}
        onOpenChange={setIsLinkDialogOpen}
        user={selectedUser}
      />
    </>
  );
}
