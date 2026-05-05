import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOrgMinistries, OrgMinistry } from '@/hooks/useOrgChartAPI';
import {
  useUnlinkedMinistries,
  useApplyMinistryBackfill,
  UnlinkedMinistry,
} from '@/hooks/useOrgchartSync';

type RowSelection = {
  // Local ministry id -> selected orgchart id (or '' / 'skip' for not-linked)
  [localId: string]: string;
};

type RowChecked = {
  [localId: string]: boolean;
};

interface MatchResult {
  candidates: OrgMinistry[];
  autoAcceptId: string | null;
}

function computeMatch(local: UnlinkedMinistry, orgMinistries: OrgMinistry[]): MatchResult {
  const localName = (local.name_en || local.name_fr || '').toLowerCase().trim();
  if (!localName) return { candidates: orgMinistries, autoAcceptId: null };

  const candidates = orgMinistries.filter((om) => {
    const t = om.title.toLowerCase();
    return t.includes(localName) || localName.includes(t);
  });

  let autoAcceptId: string | null = null;
  if (candidates.length === 1) {
    const exact = candidates[0].title.toLowerCase().trim() === localName;
    if (exact) autoAcceptId = candidates[0].id;
  }

  return { candidates, autoAcceptId };
}

export function OrgchartBackfillMinistries() {
  const { t } = useLanguage();
  const { data: unlinked, isLoading: loadingUnlinked } = useUnlinkedMinistries();
  const { data: orgMinistries, isLoading: loadingOrg } = useOrgMinistries();
  const apply = useApplyMinistryBackfill();

  const [selection, setSelection] = useState<RowSelection>({});
  const [checked, setChecked] = useState<RowChecked>({});

  // Initialize selection + checked from auto-accept on first data load.
  useEffect(() => {
    if (!unlinked || !orgMinistries) return;
    const nextSelection: RowSelection = {};
    const nextChecked: RowChecked = {};
    for (const local of unlinked) {
      if (selection[local.id] !== undefined) {
        nextSelection[local.id] = selection[local.id];
        nextChecked[local.id] = checked[local.id] ?? false;
        continue;
      }
      const { autoAcceptId } = computeMatch(local, orgMinistries);
      nextSelection[local.id] = autoAcceptId ?? '';
      nextChecked[local.id] = !!autoAcceptId;
    }
    setSelection(nextSelection);
    setChecked(nextChecked);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlinked, orgMinistries]);

  const checkedRows = useMemo(
    () => Object.entries(checked).filter(([, v]) => v).map(([id]) => id),
    [checked],
  );

  const canSubmit =
    checkedRows.length > 0 &&
    checkedRows.every((id) => selection[id] && selection[id] !== '');

  const handleConfirm = () => {
    const assignments = checkedRows.map((id) => ({
      id,
      orgchart_id: selection[id],
    }));
    apply.mutate(assignments);
  };

  if (loadingUnlinked || loadingOrg) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="spinner" />
        </CardContent>
      </Card>
    );
  }

  if (!unlinked || unlinked.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('orgchartSync.backfillMinistries')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t('orgchartSync.allMinistriesLinked')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {t('orgchartSync.backfillMinistries')}
          <Badge variant="secondary">{unlinked.length}</Badge>
        </CardTitle>
        <CardDescription>{t('orgchartSync.backfillMinistriesDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {unlinked.map((local) => {
          const match = orgMinistries ? computeMatch(local, orgMinistries) : null;
          const localLabel = local.name_en || local.name_fr || local.id;
          return (
            <div
              key={local.id}
              className="flex items-start gap-3 p-3 border rounded-lg"
            >
              <Checkbox
                checked={!!checked[local.id]}
                onCheckedChange={(v) =>
                  setChecked((prev) => ({ ...prev, [local.id]: !!v }))
                }
                className="mt-2"
                aria-label={`Select ${localLabel}`}
              />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{localLabel}</span>
                  {match?.autoAcceptId && (
                    <Badge variant="outline" className="text-xs">
                      {t('orgchartSync.autoMatched')}
                    </Badge>
                  )}
                </div>
                <Select
                  value={selection[local.id] || ''}
                  onValueChange={(v) =>
                    setSelection((prev) => ({ ...prev, [local.id]: v }))
                  }
                >
                  <SelectTrigger
                    className="touch-target"
                    aria-label={t('orgchartSync.selectOrgchartMinistry')}
                  >
                    <SelectValue placeholder={t('orgchartSync.selectOrgchartMinistry')} />
                  </SelectTrigger>
                  <SelectContent>
                    {orgMinistries?.map((om) => (
                      <SelectItem key={om.id} value={om.id}>
                        {om.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          );
        })}
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            {checkedRows.length} {t('orgchartSync.selected')}
          </p>
          <Button
            onClick={handleConfirm}
            disabled={!canSubmit || apply.isPending}
            className="touch-target"
          >
            {apply.isPending ? t('common.saving') : t('orgchartSync.confirmSelected')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
