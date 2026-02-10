import { Badge } from '@/components/ui/badge';
import type { EventStatus } from '@/hooks/useEvents';

export function getStatusBadgeVariant(status: EventStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'Completed':
      return 'default';
    case 'Confirmed':
      return 'secondary';
    case 'Canceled':
      return 'destructive';
    case 'Postponed':
      return 'secondary';
    case 'Planned':
    default:
      return 'outline';
  }
}

interface EventStatusBadgeProps {
  status: EventStatus;
}

export function EventStatusBadge({ status }: EventStatusBadgeProps) {
  return <Badge variant={getStatusBadgeVariant(status)}>{status}</Badge>;
}
