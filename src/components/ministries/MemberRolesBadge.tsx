import { useLanguage } from '@/contexts/LanguageContext';
import { usePersonRoles } from '@/hooks/usePersonRoles';
import { Badge } from '@/components/ui/badge';

interface MemberRolesBadgeProps {
  personId: string;
}

export function MemberRolesBadge({ personId }: MemberRolesBadgeProps) {
  const { getLocalizedField } = useLanguage();
  const { data: roles, isLoading } = usePersonRoles(personId);

  if (isLoading || !roles || roles.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {roles.slice(0, 2).map((pr) => (
        <Badge key={pr.id} variant="secondary" className="text-xs">
          {getLocalizedField(pr.role, 'name')}
        </Badge>
      ))}
      {roles.length > 2 && (
        <Badge variant="outline" className="text-xs">
          +{roles.length - 2}
        </Badge>
      )}
    </div>
  );
}
