import { ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function PullToRefresh({
  onRefresh,
  children,
  className,
  disabled = false,
}: PullToRefreshProps) {
  const { pullDistance, isRefreshing, isPulling, handlers } = usePullToRefresh({
    onRefresh,
    disabled,
  });

  const showIndicator = pullDistance > 10 || isRefreshing;
  const rotation = Math.min(pullDistance * 3, 360);
  const opacity = Math.min(pullDistance / 40, 1);

  return (
    <div
      className={cn('relative overflow-auto', className)}
      {...handlers}
    >
      {/* Pull indicator */}
      <div
        className={cn(
          'absolute left-1/2 -translate-x-1/2 z-50 transition-all duration-200 pointer-events-none',
          showIndicator ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          top: Math.max(pullDistance - 40, 8),
        }}
      >
        <div
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-full bg-background border shadow-lg',
            isRefreshing && 'animate-spin'
          )}
          style={{
            opacity: isRefreshing ? 1 : opacity,
            transform: isRefreshing ? undefined : `rotate(${rotation}deg)`,
          }}
        >
          <RefreshCw className="h-5 w-5 text-primary" />
        </div>
      </div>

      {/* Content with pull offset */}
      <div
        className="transition-transform duration-200"
        style={{
          transform: isPulling || isRefreshing ? `translateY(${pullDistance}px)` : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
