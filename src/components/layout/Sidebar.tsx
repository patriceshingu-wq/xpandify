import { Link, useLocation } from 'react-router-dom';
import logo from '@/assets/logo.png';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { FEATURES } from '@/config/features';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { usePrefetch } from '@/hooks/usePrefetch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  Users,
  Target,
  Calendar,
  CalendarDays,
  GraduationCap,
  FileText,
  BarChart3,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Church,
  PieChart,
  Flag,
  CalendarRange,
  Users2,
  Network,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Separator } from '@/components/ui/separator';

interface NavItem {
  icon: React.ElementType;
  labelKey: string;
  path: string;
  roles?: string[];
}

// Core navigation — always visible
const mainNavItems: NavItem[] = [
  { icon: LayoutDashboard, labelKey: 'nav.dashboard', path: '/dashboard' },
  { icon: Users, labelKey: 'nav.people', path: '/people' },
  { icon: Church, labelKey: 'nav.ministries', path: '/ministries' },
  { icon: Network, labelKey: 'nav.orgChart', path: '/org-chart' },
  { icon: Target, labelKey: 'nav.goals', path: '/goals' },
  { icon: Calendar, labelKey: 'nav.meetings', path: '/meetings' },
  { icon: CalendarDays, labelKey: 'nav.calendar', path: '/calendar/events' },
  { icon: FileText, labelKey: 'nav.feedback', path: '/reviews' },
];

// Development nav items will be built dynamically from feature flags
const adminNavItems: NavItem[] = [
  { icon: Shield, labelKey: 'nav.admin', path: '/administration', roles: ['super_admin', 'admin'] },
];

export function Sidebar() {
  const { t, language } = useLanguage();
  const { hasAnyRole, signOut, person } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { data: orgSettings } = useOrganizationSettings();
  const { quarters, programs, courses, mentorship, surveys, analytics } = useFeatureFlags();
  const { prefetchDashboard, prefetchPeople, prefetchGoals, prefetchMeetings, prefetchEvents, prefetchMinistries } = usePrefetch();

  // Map paths to prefetch functions
  const prefetchMap: Record<string, () => void> = {
    '/dashboard': prefetchDashboard,
    '/people': prefetchPeople,
    '/goals': prefetchGoals,
    '/meetings': prefetchMeetings,
    '/calendar/events': prefetchEvents,
    '/ministries': prefetchMinistries,
  };

  // Build calendar nav items based on feature flags (dynamic)
  const calendarNavItems: NavItem[] = [
    ...(quarters ? [{ icon: CalendarRange, labelKey: 'nav.quarters', path: '/calendar/quarters' }] : []),
    ...(programs ? [{ icon: Flag, labelKey: 'nav.programs', path: '/calendar/programs' }] : []),
  ];

  // Phase 2 items — only shown when explicitly enabled in org settings
  const extraNavItems: NavItem[] = [
    ...(courses ? [{ icon: GraduationCap, labelKey: 'nav.learning', path: '/learning' }] : []),
    ...(mentorship ? [{ icon: Users2, labelKey: 'nav.mentorship', path: '/mentorship' }] : []),
    ...(surveys ? [{ icon: BarChart3, labelKey: 'nav.surveys', path: '/surveys' }] : []),
    ...(analytics ? [{ icon: PieChart, labelKey: 'nav.analytics', path: '/analytics' }] : []),
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  const renderNavItem = (item: NavItem) => {
    if (item.roles && !hasAnyRole(item.roles as any)) {
      return null;
    }

    const Icon = item.icon;
    const active = isActive(item.path);
    const prefetchFn = prefetchMap[item.path];

    return (
      <Link
        key={item.path}
        to={item.path}
        className={cn(
          'nav-item group',
          active && 'active'
        )}
        onMouseEnter={prefetchFn}
        onFocus={prefetchFn}
      >
        <Icon className={cn(
          'h-5 w-5 transition-colors',
          active ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
        )} />
        {!isCollapsed && (
          <span className="truncate">{t(item.labelKey)}</span>
        )}
      </Link>
    );
  };

  const displayName = person?.preferred_name || person?.first_name || 'User';

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
          {!isCollapsed && (
            <Link to="/dashboard" className="flex items-center gap-2">
              <img src={logo} alt="Xpandify" className="w-8 h-8" />
              <span className="text-xl font-semibold text-sidebar-foreground">
                Xpandify
              </span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
            aria-label={isCollapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {/* Core Navigation */}
          {mainNavItems.map(renderNavItem)}

          {/* Phase 2 features — only shown when enabled */}
          {(extraNavItems.length > 0 || calendarNavItems.length > 0) && (
            <>
              <Separator className="my-3" />
              {calendarNavItems.map(renderNavItem)}
              {extraNavItems.map(renderNavItem)}
            </>
          )}

          {/* Admin */}
          {hasAnyRole(['super_admin', 'admin']) && (
            <>
              <Separator className="my-3" />
              {adminNavItems.map(renderNavItem)}
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          {!isCollapsed && (
            <Link
              to="/profile"
              className="flex items-center gap-3 mb-3 p-2 -mx-2 rounded-lg hover:bg-sidebar-accent transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                <span className="text-sm font-medium text-foreground">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {displayName}
                </p>
                <p className="text-xs text-muted-foreground">{t('profile.title')}</p>
              </div>
            </Link>
          )}
          <Button
            variant="ghost"
            size={isCollapsed ? 'icon' : 'default'}
            onClick={signOut}
            className={cn(
              'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent',
              !isCollapsed && 'w-full justify-start'
            )}
            aria-label={t('nav.logout')}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">{t('nav.logout')}</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
}
