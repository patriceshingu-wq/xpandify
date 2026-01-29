import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  UsersRound,
  Target,
  Calendar,
  CalendarDays,
  BookOpen,
  GraduationCap,
  MessageSquare,
  ClipboardCheck,
  BarChart3,
  Settings,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Church,
  PieChart,
  Flag,
  CalendarRange,
  Route,
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

const mainNavItems: NavItem[] = [
  { icon: LayoutDashboard, labelKey: 'nav.dashboard', path: '/dashboard' },
  { icon: UsersRound, labelKey: 'nav.team', path: '/team', roles: ['super_admin', 'admin', 'pastor_supervisor'] },
  { icon: Users, labelKey: 'nav.people', path: '/people' },
  { icon: Church, labelKey: 'nav.ministries', path: '/ministries' },
  { icon: Target, labelKey: 'nav.goals', path: '/goals' },
  { icon: Calendar, labelKey: 'nav.meetings', path: '/meetings' },
];

const calendarNavItems: NavItem[] = [
  { icon: CalendarDays, labelKey: 'nav.eventsCalendar', path: '/calendar/events' },
  { icon: CalendarRange, labelKey: 'nav.quarters', path: '/calendar/quarters' },
  { icon: Flag, labelKey: 'nav.programs', path: '/calendar/programs' },
];

const developmentNavItems: NavItem[] = [
  { icon: BookOpen, labelKey: 'nav.development', path: '/development' },
  { icon: GraduationCap, labelKey: 'nav.courses', path: '/courses' },
  { icon: Route, labelKey: 'nav.pathways', path: '/pathways' },
  { icon: GraduationCap, labelKey: 'nav.myLearning', path: '/my-learning' },
  { icon: Users2, labelKey: 'nav.mentorship', path: '/mentorship' },
  { icon: MessageSquare, labelKey: 'nav.feedback', path: '/feedback' },
  { icon: ClipboardCheck, labelKey: 'nav.reviews', path: '/reviews' },
  { icon: BarChart3, labelKey: 'nav.surveys', path: '/surveys' },
];

const adminNavItems: NavItem[] = [
  { icon: PieChart, labelKey: 'nav.analytics', path: '/analytics' },
  { icon: Shield, labelKey: 'nav.admin', path: '/admin', roles: ['super_admin', 'admin'] },
  { icon: Settings, labelKey: 'settings.title', path: '/settings', roles: ['super_admin', 'admin'] },
];

export function Sidebar() {
  const { t } = useLanguage();
  const { hasAnyRole, signOut, person } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

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
        className={cn(
          'nav-item group',
          active && 'active'
        )}
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
              <div className="w-8 h-8 rounded-lg bg-gradient-accent flex items-center justify-center">
                <span className="text-sidebar-primary-foreground font-bold text-lg">X</span>
              </div>
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
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
          {/* Main Navigation */}
          <div className="space-y-1">
            {!isCollapsed && (
              <span className="px-3 text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider">
                Main
              </span>
            )}
            {mainNavItems.map(renderNavItem)}
          </div>

          {/* Calendar & Events */}
          <div className="space-y-1">
            {!isCollapsed && (
              <span className="px-3 text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider">
                Calendar
              </span>
            )}
            {calendarNavItems.map(renderNavItem)}
          </div>

          {/* Development */}
          <div className="space-y-1">
            {!isCollapsed && (
              <span className="px-3 text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider">
                Development
              </span>
            )}
            {developmentNavItems.map(renderNavItem)}
          </div>

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
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">{t('nav.logout')}</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
}
