import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEventRoles, useCreateEventRole, useDeleteEventRole, EventRole } from '@/hooks/useEventRoles';
import { useEventRoleRequirements, useCreateEventRoleRequirement, useDeleteEventRoleRequirement, EventRoleRequirement } from '@/hooks/useEventRoleRequirements';
import { usePeople } from '@/hooks/usePeople';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Users, Plus, Trash2, UserPlus, Check } from 'lucide-react';

const commonRoles = ['Preacher', 'Coordinator', 'Worship Leader', 'Tech', 'Host', 'Prayer Lead', 'Translator', 'Speaker', 'Facilitator'];

interface EventRoleBoardProps {
  eventId: string;
  canEdit: boolean;
}

export function EventRoleBoard({ eventId, canEdit }: EventRoleBoardProps) {
  const { t } = useLanguage();
  const { data: roles = [], isLoading: rolesLoading } = useEventRoles(eventId);
  const { data: requirements = [], isLoading: reqsLoading } = useEventRoleRequirements(eventId);
  const { data: people } = usePeople();
  const createRequirement = useCreateEventRoleRequirement();
  const deleteRequirement = useDeleteEventRoleRequirement();
  const createRole = useCreateEventRole();
  const deleteRole = useDeleteEventRole();

  const [newRole, setNewRole] = useState('');
  const [newQty, setNewQty] = useState(1);
  const [assigningRole, setAssigningRole] = useState<string | null>(null);
  const [assignPersonId, setAssignPersonId] = useState('');

  // Calculate fill status
  const getRoleFillStatus = (roleName: string, qtyNeeded: number) => {
    const assigned = roles.filter(r => r.role === roleName);
    return { filled: assigned.length, needed: qtyNeeded, assignments: assigned };
  };

  // Roles without requirements (ad-hoc assignments)
  const reqRoleNames = new Set(requirements.map(r => r.role_name));
  const adHocRoles = roles.filter(r => !reqRoleNames.has(r.role));

  const totalNeeded = requirements.reduce((sum, r) => sum + r.quantity_needed, 0);
  const totalFilled = requirements.reduce((sum, r) => {
    const { filled } = getRoleFillStatus(r.role_name, r.quantity_needed);
    return sum + Math.min(filled, r.quantity_needed);
  }, 0);
  const fillPercent = totalNeeded > 0 ? Math.round((totalFilled / totalNeeded) * 100) : 0;

  const handleAddRequirement = async () => {
    if (!newRole.trim()) return;
    await createRequirement.mutateAsync({ event_id: eventId, role_name: newRole.trim(), quantity_needed: newQty });
    setNewRole('');
    setNewQty(1);
  };

  const handleAssignPerson = async (roleName: string) => {
    if (!assignPersonId) return;
    await createRole.mutateAsync({
      event_id: eventId,
      person_id: assignPersonId,
      role: roleName,
    });
    setAssigningRole(null);
    setAssignPersonId('');
  };

  if (rolesLoading || reqsLoading) return null;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      {requirements.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Role fill status</span>
            <span className="font-medium">{totalFilled}/{totalNeeded} filled</span>
          </div>
          <Progress value={fillPercent} className="h-2" />
        </div>
      )}

      {/* Required roles */}
      {requirements.map((req) => {
        const { filled, needed, assignments } = getRoleFillStatus(req.role_name, req.quantity_needed);
        const isFull = filled >= needed;

        return (
          <Card key={req.id} className={isFull ? 'border-primary/30' : ''}>
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{req.role_name}</span>
                  <Badge variant={isFull ? 'default' : 'outline'} className="text-xs">
                    {filled}/{needed}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  {canEdit && !isFull && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => { setAssigningRole(req.role_name); setAssignPersonId(''); }}
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteRequirement.mutate({ id: req.id, event_id: eventId })}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Assigned people */}
              {assignments.length > 0 && (
                <div className="space-y-1 pl-6">
                  {assignments.map((a) => (
                    <div key={a.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-primary" />
                        <span>{a.person?.first_name} {a.person?.last_name}</span>
                      </div>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteRole.mutate({ id: a.id, event_id: eventId })}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Vacant slots */}
              {!isFull && (
                <div className="pl-6 space-y-1">
                  {Array.from({ length: needed - filled }).map((_, i) => (
                    <div key={i} className="text-sm text-muted-foreground italic flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full border border-dashed border-muted-foreground" />
                      Vacant
                    </div>
                  ))}
                </div>
              )}

              {/* Assign person inline */}
              {assigningRole === req.role_name && (
                <div className="flex items-center gap-2 pl-6">
                  <Select value={assignPersonId} onValueChange={setAssignPersonId}>
                    <SelectTrigger className="h-8 text-sm flex-1">
                      <SelectValue placeholder="Select person..." />
                    </SelectTrigger>
                    <SelectContent>
                      {people?.filter(p => !assignments.some(a => a.person_id === p.id)).map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.first_name} {p.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" className="h-8" onClick={() => handleAssignPerson(req.role_name)} disabled={!assignPersonId}>
                    Assign
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8" onClick={() => setAssigningRole(null)}>
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Ad-hoc role assignments (no requirement defined) */}
      {adHocRoles.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Additional Assignments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {adHocRoles.map((a) => (
              <div key={a.id} className="flex items-center justify-between text-sm p-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{a.role}</Badge>
                  <span>{a.person?.first_name} {a.person?.last_name}</span>
                </div>
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteRole.mutate({ id: a.id, event_id: eventId })}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Add requirement form */}
      {canEdit && (
        <Card className="border-dashed">
          <CardContent className="p-3">
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <label className="text-xs text-muted-foreground">Role needed</label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select role..." />
                  </SelectTrigger>
                  <SelectContent>
                    {commonRoles.filter(r => !requirements.some(req => req.role_name === r)).map((role) => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-20 space-y-1">
                <label className="text-xs text-muted-foreground">Qty</label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={newQty}
                  onChange={(e) => setNewQty(parseInt(e.target.value) || 1)}
                  className="h-8 text-sm"
                />
              </div>
              <Button size="sm" className="h-8" onClick={handleAddRequirement} disabled={!newRole || createRequirement.isPending}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
