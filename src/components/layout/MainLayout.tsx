import { ReactNode, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileHeader } from './MobileHeader';
import { BottomNav } from './BottomNav';
import { MobileMoreMenu } from './MobileMoreMenu';
import { useIsMobile } from '@/hooks/use-mobile';

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  onBack?: () => void;
}

// Routes that are in the BottomNav (main navigation)
const bottomNavRoutes = ['/', '/team', '/meetings', '/goals'];

export function MainLayout({ children, title, subtitle, onBack }: MainLayoutProps) {
  const isMobile = useIsMobile();
  const location = useLocation();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  // Show back button for pages not in the main BottomNav
  const showBackButton = !bottomNavRoutes.includes(location.pathname);

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader title={title} subtitle={subtitle} showBackButton={showBackButton} onBack={onBack} />
        <main className="px-4 py-4 pb-24">
          {children}
        </main>
        <BottomNav onMoreClick={() => setMoreMenuOpen(true)} />
        <MobileMoreMenu open={moreMenuOpen} onOpenChange={setMoreMenuOpen} />
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-64">
        <Header title={title} subtitle={subtitle} />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
