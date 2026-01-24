import { cn } from '@/lib/utils';
import { Badge } from './badge';
import { useLanguage } from '@/contexts/LanguageContext';

type StatusType = 'active' | 'inactive' | 'on_leave' | 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled' | 'open' | 'done' | 'dropped';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; labelKey: string }> = {
  active: { variant: 'default', labelKey: 'people.active' },
  inactive: { variant: 'secondary', labelKey: 'people.inactive' },
  on_leave: { variant: 'outline', labelKey: 'people.onLeave' },
  not_started: { variant: 'secondary', labelKey: 'goals.notStarted' },
  in_progress: { variant: 'default', labelKey: 'goals.inProgress' },
  completed: { variant: 'default', labelKey: 'goals.completed' },
  on_hold: { variant: 'outline', labelKey: 'goals.onHold' },
  cancelled: { variant: 'destructive', labelKey: 'goals.cancelled' },
  open: { variant: 'secondary', labelKey: 'goals.notStarted' },
  done: { variant: 'default', labelKey: 'goals.completed' },
  dropped: { variant: 'destructive', labelKey: 'goals.cancelled' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { t } = useLanguage();
  const config = statusConfig[status] || { variant: 'secondary' as const, labelKey: status };

  return (
    <Badge
      variant={config.variant}
      className={cn(
        status === 'active' && 'bg-success/10 text-success border-success/20 hover:bg-success/20',
        status === 'completed' && 'bg-success/10 text-success border-success/20 hover:bg-success/20',
        status === 'done' && 'bg-success/10 text-success border-success/20 hover:bg-success/20',
        status === 'in_progress' && 'bg-info/10 text-info border-info/20 hover:bg-info/20',
        status === 'on_hold' && 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20',
        status === 'on_leave' && 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20',
        className
      )}
    >
      {t(config.labelKey)}
    </Badge>
  );
}
