import { useRef, useCallback, useState } from 'react';

interface UseSwipeNavigationOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  disabled?: boolean;
}

interface UseSwipeNavigationReturn {
  swipeOffset: number;
  isSwiping: boolean;
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
}

export function useSwipeNavigation({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  disabled = false,
}: UseSwipeNavigationOptions): UseSwipeNavigationReturn {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;
      
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
      isHorizontalSwipe.current = null;
      setIsSwiping(true);
    },
    [disabled]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isSwiping || disabled) return;
      
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const deltaX = currentX - startX.current;
      const deltaY = currentY - startY.current;

      // Determine swipe direction on first significant movement
      if (isHorizontalSwipe.current === null) {
        if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
          isHorizontalSwipe.current = Math.abs(deltaX) > Math.abs(deltaY);
        }
      }

      // Only track horizontal swipes
      if (isHorizontalSwipe.current) {
        // Apply resistance for visual feedback
        const resistedOffset = deltaX * 0.4;
        setSwipeOffset(resistedOffset);
      }
    },
    [isSwiping, disabled]
  );

  const onTouchEnd = useCallback(() => {
    if (!isSwiping || disabled) return;

    setIsSwiping(false);

    if (isHorizontalSwipe.current) {
      if (swipeOffset < -threshold && onSwipeLeft) {
        onSwipeLeft();
      } else if (swipeOffset > threshold && onSwipeRight) {
        onSwipeRight();
      }
    }

    setSwipeOffset(0);
    isHorizontalSwipe.current = null;
  }, [isSwiping, disabled, swipeOffset, threshold, onSwipeLeft, onSwipeRight]);

  return {
    swipeOffset,
    isSwiping,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  };
}
