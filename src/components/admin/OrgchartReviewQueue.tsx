import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLanguage } from '@/contexts/LanguageContext';
import { useReviewQueue, useResolveReviewItem, ReviewQueueItem } from '@/hooks/useOrgchartSync';

function changeTypeLabel(t: (k: string) => string, type: ReviewQueueItem['change_type']): string {
  switch (type) {
    case 'ministry_deleted':
      return t('orgchartSync.changeMinistryDeleted');
    case 'person_deleted':
      return t('orgchartSync.changePersonDeleted');
    case 'ministry_reparented':
      return t('orgchartSync.changeMinistryReparented');
    case 'membership_dropped':
      return t('orgchartSync.changeMembershipDropped');
  }
}

function describeBefore(item: ReviewQueueItem): string {
  const b = item.before as Record<string, unknown>;
  if (typeof b.name_en === 'string') return b.name_en;
  if (typeof b.first_name === 'string' || typeof b.last_name === 'string') {
    return `${b.first_name ?? ''} ${b.last_name ?? ''}`.trim();
  }
  if (typeof b.parent_ministry_id === 'string' || b.parent_ministry_id === null) {
    return `parent: ${b.parent_ministry_id ?? '(top level)'}`;
  }
  return JSON.stringify(b).slice(0, 80);
}

function describeAfter(item: ReviewQueueItem): string {
  if (!item.after) return '—';
  const a = item.after as Record<string, unknown>;
  if (typeof a.parent_ministry_id === 'string' || a.parent_ministry_id === null) {
    return `parent: ${a.parent_ministry_id ?? '(top level)'}`;
  }
  return JSON.stringify(a).slice(0, 80);
}

export function OrgchartReviewQueue() {
  const { t } = useLanguage();
  const [includeSnoozed, setIncludeSnoozed] = useState(false);
  const { data: items, isLoading } = useReviewQueue(includeSnoozed);
  const resolve = useResolveReviewItem();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="spinner" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {t('orgchartSync.reviewQueue')}
          {items && items.length > 0 && <Badge variant="secondary">{items.length}</Badge>}
        </CardTitle>
        <CardDescription>{t('orgchartSync.reviewQueueDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIncludeSnoozed((v) => !v)}
            className="touch-target"
          >
            {includeSnoozed
              ? t('orgchartSync.hideSnoozed')
              : t('orgchartSync.showSnoozed')}
          </Button>
        </div>

        {!items || items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            {t('orgchartSync.noChangesNeedReview')}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('orgchartSync.colChangeType')}</TableHead>
                  <TableHead>{t('orgchartSync.colBefore')}</TableHead>
                  <TableHead>{t('orgchartSync.colAfter')}</TableHead>
                  <TableHead>{t('orgchartSync.colDetected')}</TableHead>
                  <TableHead className="text-right">{t('orgchartSync.colActions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Badge variant="outline">{changeTypeLabel(t, item.change_type)}</Badge>
                      {item.state === 'snoozed' && (
                        <Badge variant="secondary" className="ml-2">
                          {t('orgchartSync.snoozed')}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={describeBefore(item)}>
                      {describeBefore(item)}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={describeAfter(item)}>
                      {describeAfter(item)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(item.detected_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          size="sm"
                          variant="default"
                          disabled={resolve.isPending || item.state !== 'pending'}
                          onClick={() => resolve.mutate({ item, action: 'apply' })}
                          className="touch-target"
                        >
                          {t('orgchartSync.apply')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={resolve.isPending || item.state !== 'pending'}
                          onClick={() => resolve.mutate({ item, action: 'dismiss' })}
                          className="touch-target"
                        >
                          {t('orgchartSync.dismiss')}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={resolve.isPending || item.state !== 'pending'}
                          onClick={() => resolve.mutate({ item, action: 'snooze' })}
                          className="touch-target"
                        >
                          {t('orgchartSync.snooze')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
