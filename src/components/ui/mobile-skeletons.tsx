import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

// Mobile-optimized card skeleton with proper spacing
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('p-4 md:p-5 rounded-lg border bg-card', className)}>
      <div className="flex flex-col gap-4">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <Skeleton className="h-12 w-12 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        {/* Content rows */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        {/* Action button */}
        <Skeleton className="h-10 w-full sm:w-32" />
      </div>
    </div>
  );
}

// Team member / Direct report card skeleton
export function TeamCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('p-4 md:p-5 rounded-lg border bg-card', className)}>
      <div className="flex flex-col gap-4">
        {/* Avatar and name */}
        <div className="flex items-start gap-3">
          <Skeleton className="h-12 w-12 rounded-full shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex justify-between gap-2">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-5 w-20 shrink-0" />
            </div>
          </div>
        </div>
        {/* Stats - stacked on mobile */}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-24" />
        </div>
        {/* Buttons */}
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-10 flex-1 sm:flex-none sm:w-24" />
          <Skeleton className="h-10 flex-1 sm:flex-none sm:w-28" />
        </div>
      </div>
    </div>
  );
}

// Meeting card skeleton
export function MeetingCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('p-4 rounded-lg border bg-card', className)}>
      <div className="flex items-start gap-3">
        {/* Time block */}
        <div className="shrink-0 text-center">
          <Skeleton className="h-6 w-14" />
          <Skeleton className="h-4 w-10 mt-1 mx-auto" />
        </div>
        {/* Content */}
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Goal card skeleton
export function GoalCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('p-4 rounded-lg border bg-card', className)}>
      <div className="space-y-3">
        <div className="flex justify-between gap-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-8" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}

// Feedback card skeleton
export function FeedbackCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('p-4 rounded-lg border bg-card', className)}>
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
          <Skeleton className="h-5 w-24 rounded-full shrink-0" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  );
}

// Stat card skeleton (for dashboards)
export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('p-3 md:p-4 rounded-lg border bg-card', className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-7 w-12" />
        </div>
        <Skeleton className="h-8 w-8 rounded" />
      </div>
    </div>
  );
}

// Dialog content skeleton
export function DialogContentSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <Skeleton className="h-14 w-14 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
      {/* Tabs */}
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
      </div>
      {/* Content grid */}
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      {/* Card section */}
      <div className="space-y-3 p-4 rounded-lg border">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

// List skeleton - renders multiple items
export function ListSkeleton({
  count = 3,
  ItemComponent = CardSkeleton,
  className,
}: {
  count?: number;
  ItemComponent?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <ItemComponent key={i} />
      ))}
    </div>
  );
}

// Calendar day skeleton
export function CalendarDaySkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('p-1 min-h-[100px]', className)}>
      <Skeleton className="h-6 w-6 rounded-full mb-2" />
      <div className="space-y-1">
        <Skeleton className="h-5 w-full rounded" />
        <Skeleton className="h-5 w-3/4 rounded" />
      </div>
    </div>
  );
}

// Table row skeleton
export function TableRowSkeleton({ columns = 4, className }: { columns?: number; className?: string }) {
  return (
    <div className={cn('flex items-center gap-4 p-4 border-b', className)}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-5 flex-1" />
      ))}
    </div>
  );
}
