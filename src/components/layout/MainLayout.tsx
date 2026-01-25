import { ReactNode, useState } from 'react';
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
}

export function MainLayout({ children, title, subtitle }: MainLayoutProps) {
  const isMobile = useIsMobile();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader title={title} subtitle={subtitle} />
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
