import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import {
  Church,
  UsersRound,
  GraduationCap,
  FileText,
  BarChart3,
  Shield,
  LogOut,
  PieChart,
  User,
  CalendarDays,
  Calendar,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface NavItem {
  icon: React.ElementType;
  labelKey: string;
  path: string;
  roles?: string[];
}

const moreNavItems: NavItem[] = [
  { icon: Church, labelKey: 'nav.ministries', path: '/ministries' },
  { icon: Calendar, labelKey: 'nav.meetings', path: '/meetings' },
];

const calendarNavItems: NavItem[] = [
  { icon: CalendarDays, labelKey: 'nav.eventsCalendar', path: '/calendar/events' },
  { icon: Calendar, labelKey: 'nav.quarters', path: '/calendar/quarters' },
  { icon: Layers, labelKey: 'nav.programs', path: '/calendar/programs' },
];

interface MobileMoreMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileMoreMenu({ open, onOpenChange }: MobileMoreMenuProps) {
  const { t } = useLanguage();
  const { hasAnyRole, signOut, person } = useAuth();
  const location = useLocation();
  const { courses, mentorship, surveys, analytics } = useFeatureFlags();

  const developmentNavItems: NavItem[] = [
    { icon: FileText, labelKey: 'nav.feedback', path: '/reviews' },
    ...(courses ? [{ icon: GraduationCap, labelKey: 'nav.learning', path: '/learning' }] : []),
    ...(mentorship ? [{ icon: UsersRound, labelKey: 'nav.mentorship', path: '/mentorship' }] : []),
    ...(surveys ? [{ icon: BarChart3, labelKey: 'nav.surveys', path: '/surveys' }] : []),
  ];

  const adminNavItems: NavItem[] = [
    ...(analytics ? [{ icon: PieChart, labelKey: 'nav.analytics', path: '/analytics' }] : []),
    { icon: Shield, labelKey: 'nav.admin', path: '/administration', roles: ['super_admin', 'admin'] },
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  const renderNavItem = (item: NavItem) => {
    if (item.roles && !hasAnyRole(item.roles as any)) {
      return null;
    }

    const Icon = item.icon;
    const active = isActive(item.path);

    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={() => onOpenChange(false)}
        className={cn(
          'flex items-center gap-4 px-4 py-3.5 rounded-xl transition-colors touch-target',
          active
            ? 'bg-primary/10 text-primary'
            : 'text-foreground active:bg-muted'
        )}
      >
        <Icon className="h-6 w-6 flex-shrink-0" />
        <span className="font-medium text-base">{t(item.labelKey)}</span>
      </Link>
    );
  };

  const displayName = person?.preferred_name || person?.first_name || 'User';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl px-0 flex flex-col">
        <SheetHeader className="px-6 pb-4 flex-shrink-0">
          <SheetTitle className="text-xl font-semibold">Menu</SheetTitle>
        </SheetHeader>

        <div className="overflow-y-auto flex-1 px-4 pb-safe overscroll-contain">
          {/* Profile Link */}
          <Link
            to="/profile"
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-4 p-4 mb-4 rounded-2xl bg-muted/50 active:bg-muted transition-colors touch-target"
          >
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate text-base">
                {displayName}
              </p>
              <p className="text-sm text-muted-foreground">{t('profile.title')}</p>
            </div>
          </Link>

          {/* More Navigation */}
          <div className="space-y-1 mb-6">
            <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              More
            </p>
            {moreNavItems.map(renderNavItem)}
          </div>

          <Separator className="my-4" />

          {/* Calendar & Events */}
          <div className="space-y-1 mb-6">
            <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('nav.calendar') || 'Calendar'}
            </p>
            {calendarNavItems.map(renderNavItem)}
          </div>

          <Separator className="my-4" />

          {/* Development */}
          {developmentNavItems.length > 0 && (
            <div className="space-y-1 mb-6">
              <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Development
              </p>
              {developmentNavItems.map(renderNavItem)}
            </div>
          )}

          {/* Admin */}
          {hasAnyRole(['super_admin', 'admin']) && (
            <>
              <Separator className="my-4" />
              <div className="space-y-1 mb-6">
                <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  System
                </p>
                {adminNavItems.map(renderNavItem)}
              </div>
            </>
          )}

          <Separator className="my-4" />

          {/* Sign Out */}
          <Button
            variant="ghost"
            onClick={() => {
              onOpenChange(false);
              signOut();
            }}
            className="w-full justify-start gap-4 touch-target px-4 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
          >
            <LogOut className="h-6 w-6" />
            <span className="font-medium text-base">{t('nav.logout')}</span>
          </Button>
          
          {/* Extra bottom padding for safety */}
          <div className="h-8" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
