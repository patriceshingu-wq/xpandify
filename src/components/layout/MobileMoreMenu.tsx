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

// Core items not in BottomNav
const coreNavItems: NavItem[] = [
  { icon: Church, labelKey: 'nav.ministries', path: '/ministries' },
  { icon: Calendar, labelKey: 'nav.meetings', path: '/meetings' },
  { icon: CalendarDays, labelKey: 'nav.eventsCalendar', path: '/calendar/events' },
  { icon: FileText, labelKey: 'nav.feedback', path: '/reviews' },
];

interface MobileMoreMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileMoreMenu({ open, onOpenChange }: MobileMoreMenuProps) {
  const { t } = useLanguage();
  const { hasAnyRole, signOut, person } = useAuth();
  const location = useLocation();
  const { quarters, programs, courses, mentorship, surveys, analytics } = useFeatureFlags();

  // Phase 2 items — only shown when enabled
  const extraNavItems: NavItem[] = [
    ...(quarters ? [{ icon: Calendar, labelKey: 'nav.quarters', path: '/calendar/quarters' }] : []),
    ...(programs ? [{ icon: Layers, labelKey: 'nav.programs', path: '/calendar/programs' }] : []),
    ...(courses ? [{ icon: GraduationCap, labelKey: 'nav.learning', path: '/learning' }] : []),
    ...(mentorship ? [{ icon: UsersRound, labelKey: 'nav.mentorship', path: '/mentorship' }] : []),
    ...(surveys ? [{ icon: BarChart3, labelKey: 'nav.surveys', path: '/surveys' }] : []),
    ...(analytics ? [{ icon: PieChart, labelKey: 'nav.analytics', path: '/analytics' }] : []),
  ];

  const adminNavItems: NavItem[] = [
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
            ? 'bg-muted text-foreground'
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
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <User className="h-7 w-7 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate text-base">
                {displayName}
              </p>
              <p className="text-sm text-muted-foreground">{t('profile.title')}</p>
            </div>
          </Link>

          {/* Core Navigation */}
          <div className="space-y-1 mb-4">
            {coreNavItems.map(renderNavItem)}
          </div>

          {/* Phase 2 features — only shown when enabled */}
          {extraNavItems.length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="space-y-1 mb-4">
                {extraNavItems.map(renderNavItem)}
              </div>
            </>
          )}

          {/* Admin */}
          {hasAnyRole(['super_admin', 'admin']) && (
            <>
              <Separator className="my-4" />
              <div className="space-y-1 mb-4">
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
