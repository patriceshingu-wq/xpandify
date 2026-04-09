import { Link, useLocation } from 'react-router-dom';
import logo from '@/assets/logo.png';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { FEATURES } from '@/config/features';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { usePrefetch } from '@/hooks/usePrefetch';
import { Badge } from '@/components/ui/badge';
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

// Simple mode: 6 nav items (Dashboard, People, Ministries, Goals, Meetings, Calendar)
// Advanced mode: Adds Quarters, Programs, and Development section
const mainNavItems: NavItem[] = [
  { icon: LayoutDashboard, labelKey: 'nav.dashboard', path: '/dashboard' },
  { icon: Users, labelKey: 'nav.people', path: '/people' },
  { icon: Church, labelKey: 'nav.ministries', path: '/ministries' },
  { icon: Target, labelKey: 'nav.goals', path: '/goals' },
  { icon: Calendar, labelKey: 'nav.meetings', path: '/meetings' },
  { icon: CalendarDays, labelKey: 'nav.calendar', path: '/calendar/events' },
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
  const { quarters, programs } = useFeatureFlags();
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

  // Check if we're in simple mode (all advanced features off)
  const isInSimpleMode = !quarters && !programs;

  const themeName = language === 'fr'
    ? orgSettings?.yearly_theme_fr || orgSettings?.yearly_theme_en
    : orgSettings?.yearly_theme_en;

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
          active ? 'text-sidebar-primary' : 'text-sidebar-foreground/70 group-hover:text-sidebar-foreground'
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
              <span className="font-serif text-xl font-semibold text-sidebar-foreground">
                Xpandify
              </span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            aria-label={isCollapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
          {/* Main Navigation - includes Calendar in simple mode */}
          <div className="space-y-1">
            {!isCollapsed && (
              <span className="px-3 text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider">
                Main
              </span>
            )}
            {mainNavItems.map(renderNavItem)}
          </div>

          {/* Calendar Sub-Items (Quarters, Programs) - only shown when features enabled */}
          {calendarNavItems.length > 0 && (
            <div className="space-y-1">
              {!isCollapsed && (
                <span className="px-3 text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider">
                  Calendar
                </span>
              )}
              {calendarNavItems.map(renderNavItem)}
            </div>
          )}

          {/* Development - only shown when not in simple mode OR has items beyond Feedback */}
          {!isInSimpleMode && developmentNavItems.length > 0 && (
            <div className="space-y-1">
              {!isCollapsed && (
                <span className="px-3 text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider">
                  Development
                </span>
              )}
              {developmentNavItems.map(renderNavItem)}
            </div>
          )}

          {/* Admin */}
          {hasAnyRole(['super_admin', 'admin']) && (
            <div className="space-y-1">
              {!isCollapsed && (
                <span className="px-3 text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider">
                  System
                </span>
              )}
              {adminNavItems.map(renderNavItem)}
            </div>
          )}
        </nav>

        {/* Theme Badge */}
        {themeName && !isCollapsed && (
          <div className="px-4 pb-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="w-full justify-center border-accent/30 text-accent/80 text-[10px] tracking-wider uppercase py-1 max-w-full truncate">
                    {orgSettings?.theme_year ? `${orgSettings.theme_year} — ` : ''}{themeName}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{orgSettings?.theme_year ? `${orgSettings.theme_year} — ` : ''}{themeName}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          {!isCollapsed && (
            <Link
              to="/profile"
              className="flex items-center gap-3 mb-3 p-2 -mx-2 rounded-lg hover:bg-sidebar-accent transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-sidebar-accent flex items-center justify-center">
                <span className="text-sm font-medium text-sidebar-foreground">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {displayName}
                </p>
                <p className="text-xs text-sidebar-foreground/50">{t('profile.title')}</p>
              </div>
            </Link>
          )}
          <Button
            variant="ghost"
            size={isCollapsed ? 'icon' : 'default'}
            onClick={signOut}
            className={cn(
              'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent',
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
