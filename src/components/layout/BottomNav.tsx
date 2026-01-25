import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Target,
  Calendar,
  MoreHorizontal,
} from 'lucide-react';

interface NavItem {
  icon: React.ElementType;
  labelKey: string;
  path: string;
}

const primaryNavItems: NavItem[] = [
  { icon: LayoutDashboard, labelKey: 'nav.dashboard', path: '/dashboard' },
  { icon: Calendar, labelKey: 'nav.meetings', path: '/meetings' },
  { icon: Users, labelKey: 'nav.people', path: '/people' },
  { icon: Target, labelKey: 'nav.goals', path: '/goals' },
];

interface BottomNavProps {
  onMoreClick: () => void;
}

export function BottomNav({ onMoreClick }: BottomNavProps) {
  const { t } = useLanguage();
  const location = useLocation();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border pb-safe">
      <div className="flex items-center justify-around h-16 px-1">
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center gap-1 touch-target px-3 py-2 rounded-xl transition-colors',
                active
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground active:bg-muted'
              )}
            >
              <Icon className={cn('h-6 w-6', active && 'text-primary')} />
              <span className={cn(
                'text-[11px] font-medium leading-none',
                active && 'text-primary'
              )}>
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}

        {/* More button */}
        <button
          onClick={onMoreClick}
          className="flex flex-col items-center justify-center gap-1 touch-target px-3 py-2 rounded-xl text-muted-foreground active:bg-muted transition-colors"
        >
          <MoreHorizontal className="h-6 w-6" />
          <span className="text-[11px] font-medium leading-none">
            {t('common.more') || 'More'}
          </span>
        </button>
      </div>
    </nav>
  );
}
