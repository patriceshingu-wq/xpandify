import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useUnlinkedCounts,
  useLastSyncRun,
  useRunOrgchartSync,
} from '@/hooks/useOrgchartSync';
import { OrgchartBackfillMinistries } from './OrgchartBackfillMinistries';
import { OrgchartBackfillPeople } from './OrgchartBackfillPeople';
import { OrgchartReviewQueue } from './OrgchartReviewQueue';

export function OrgchartSyncTab() {
  const { t } = useLanguage();
  const { data: counts } = useUnlinkedCounts();
  const { data: lastRun } = useLastSyncRun();
  const runSync = useRunOrgchartSync();

  const backfillComplete = counts ? counts.ministries === 0 && counts.people === 0 : false;
  const isRunning = lastRun?.status === 'running' || runSync.isPending;
  const canRun = backfillComplete && !isRunning;

  return (
    <div className="space-y-4 md:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('orgchartSync.title')}</CardTitle>
          <CardDescription>{t('orgchartSync.description')}</CardDescription>
        </CardHeader>
      </Card>

      <OrgchartBackfillMinistries />
      <OrgchartBackfillPeople />

      <Card>
        <CardHeader>
          <CardTitle>{t('orgchartSync.runSync')}</CardTitle>
          <CardDescription>{t('orgchartSync.runSyncDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => runSync.mutate()}
            disabled={!canRun}
            className="touch-target"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('orgchartSync.runningSync')}
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('orgchartSync.runSyncNow')}
              </>
            )}
          </Button>
          {!backfillComplete && (
            <p className="text-sm text-muted-foreground">
              {t('orgchartSync.availableAfterBackfill')}
            </p>
          )}

          {lastRun && (
            <div className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t('orgchartSync.lastRun')}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(lastRun.started_at).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap text-sm">
                <span className="capitalize">{lastRun.status}</span>
                {lastRun.summary && (
                  <>
                    <span className="text-muted-foreground">·</span>
                    <span>
                      {lastRun.summary.auto_applied} {t('orgchartSync.autoApplied')}
                    </span>
                    <span className="text-muted-foreground">·</span>
                    <span>
                      {lastRun.summary.queued_for_review} {t('orgchartSync.queuedForReview')}
                    </span>
                    {lastRun.summary.errors > 0 && (
                      <>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-destructive">
                          {lastRun.summary.errors} {t('orgchartSync.errors')}
                        </span>
                      </>
                    )}
                  </>
                )}
              </div>
              {lastRun.error_message && (
                <p className="text-sm text-destructive">{lastRun.error_message}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <OrgchartReviewQueue />
    </div>
  );
}
