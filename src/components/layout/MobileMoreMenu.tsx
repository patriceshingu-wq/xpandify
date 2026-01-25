import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  UsersRound,
  Church,
  BookOpen,
  GraduationCap,
  MessageSquare,
  ClipboardCheck,
  BarChart3,
  Settings,
  Shield,
  LogOut,
  PieChart,
  User,
  X,
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
  { icon: UsersRound, labelKey: 'nav.team', path: '/team', roles: ['super_admin', 'admin', 'pastor_supervisor'] },
  { icon: Church, labelKey: 'nav.ministries', path: '/ministries' },
];

const developmentNavItems: NavItem[] = [
  { icon: BookOpen, labelKey: 'nav.development', path: '/development' },
  { icon: GraduationCap, labelKey: 'nav.courses', path: '/courses' },
  { icon: MessageSquare, labelKey: 'nav.feedback', path: '/feedback' },
  { icon: ClipboardCheck, labelKey: 'nav.reviews', path: '/reviews' },
  { icon: BarChart3, labelKey: 'nav.surveys', path: '/surveys' },
];

const adminNavItems: NavItem[] = [
  { icon: PieChart, labelKey: 'nav.analytics', path: '/analytics' },
  { icon: Shield, labelKey: 'nav.admin', path: '/admin', roles: ['super_admin', 'admin'] },
  { icon: Settings, labelKey: 'settings.title', path: '/settings', roles: ['super_admin', 'admin'] },
];

interface MobileMoreMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileMoreMenu({ open, onOpenChange }: MobileMoreMenuProps) {
  const { t } = useLanguage();
  const { hasAnyRole, signOut, person } = useAuth();
  const location = useLocation();

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
          'flex items-center gap-4 px-4 py-3 rounded-xl transition-colors min-h-[48px]',
          active
            ? 'bg-primary/10 text-primary'
            : 'text-foreground active:bg-muted'
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <span className="font-medium">{t(item.labelKey)}</span>
      </Link>
    );
  };

  const displayName = person?.preferred_name || person?.first_name || 'User';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl px-0">
        <SheetHeader className="px-6 pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl">Menu</SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-10 w-10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </SheetHeader>

        <div className="overflow-y-auto flex-1 px-4 pb-safe">
          {/* Profile Link */}
          <Link
            to="/profile"
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-4 p-4 mb-4 rounded-xl bg-muted/50 active:bg-muted transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">
                {displayName}
              </p>
              <p className="text-sm text-muted-foreground">{t('profile.title')}</p>
            </div>
          </Link>

          {/* More Navigation */}
          <div className="space-y-1 mb-4">
            <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              More
            </p>
            {moreNavItems.map(renderNavItem)}
          </div>

          <Separator className="my-4" />

          {/* Development */}
          <div className="space-y-1 mb-4">
            <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Development
            </p>
            {developmentNavItems.map(renderNavItem)}
          </div>

          {/* Admin */}
          {hasAnyRole(['super_admin', 'admin']) && (
            <>
              <Separator className="my-4" />
              <div className="space-y-1 mb-4">
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
            className="w-full justify-start gap-4 h-12 px-4 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">{t('nav.logout')}</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
