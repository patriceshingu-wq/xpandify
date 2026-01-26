import { ReactNode, Children, useState, useEffect } from 'react';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { cn } from '@/lib/utils';

interface SwipeableTabsProps {
  value: string;
  onValueChange: (value: string) => void;
  tabs: string[];
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function SwipeableTabs({
  value,
  onValueChange,
  tabs,
  children,
  className,
  disabled = false,
}: SwipeableTabsProps) {
  const currentIndex = tabs.indexOf(value);

  const goToNext = () => {
    if (currentIndex < tabs.length - 1) {
      onValueChange(tabs[currentIndex + 1]);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      onValueChange(tabs[currentIndex - 1]);
    }
  };

  const { swipeOffset, isSwiping, handlers } = useSwipeNavigation({
    onSwipeLeft: goToNext,
    onSwipeRight: goToPrev,
    disabled: disabled || tabs.length <= 1,
  });

  return (
    <div
      className={cn('touch-pan-y', className)}
      {...handlers}
    >
      <div
        className={cn(
          'transition-transform',
          isSwiping ? 'duration-0' : 'duration-200'
        )}
        style={{
          transform: isSwiping ? `translateX(${swipeOffset}px)` : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
