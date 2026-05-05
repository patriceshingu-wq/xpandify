import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOrgPeople, OrgPerson } from '@/hooks/useOrgChartAPI';
import {
  useUnlinkedPeople,
  useApplyPeopleBackfill,
  UnlinkedPerson,
} from '@/hooks/useOrgchartSync';

type RowSelection = { [localId: string]: string };
type RowChecked = { [localId: string]: boolean };

interface MatchResult {
  candidates: OrgPerson[];
  autoAcceptId: string | null;
}

function computeMatch(local: UnlinkedPerson, orgPeople: OrgPerson[]): MatchResult {
  const first = local.first_name.toLowerCase();
  const last = local.last_name.toLowerCase();
  const fullName = `${first} ${last}`.trim();
  if (!last && !first) return { candidates: [], autoAcceptId: null };

  const candidates = orgPeople.filter((r) => {
    const n = r.personName?.toLowerCase() ?? '';
    return n.includes(last) && n.includes(first);
  });

  let autoAcceptId: string | null = null;
  if (candidates.length === 1) {
    const exact = candidates[0].personName?.toLowerCase().trim() === fullName;
    if (exact) autoAcceptId = candidates[0].id;
  }

  return { candidates, autoAcceptId };
}

export function OrgchartBackfillPeople() {
  const { t } = useLanguage();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');

  const { data: pageData, isLoading: loadingUnlinked } = useUnlinkedPeople(page, search);
  const { data: orgPeople, isLoading: loadingOrg } = useOrgPeople();
  const apply = useApplyPeopleBackfill();

  const [selection, setSelection] = useState<RowSelection>({});
  const [checked, setChecked] = useState<RowChecked>({});

  useEffect(() => {
    if (!pageData || !orgPeople) return;
    setSelection((prev) => {
      const next = { ...prev };
      for (const local of pageData.items) {
        if (next[local.id] !== undefined) continue;
        const { autoAcceptId } = computeMatch(local, orgPeople);
        next[local.id] = autoAcceptId ?? '';
      }
      return next;
    });
    setChecked((prev) => {
      const next = { ...prev };
      for (const local of pageData.items) {
        if (next[local.id] !== undefined) continue;
        const { autoAcceptId } = computeMatch(local, orgPeople);
        next[local.id] = !!autoAcceptId;
      }
      return next;
    });
  }, [pageData, orgPeople]);

  const checkedRows = useMemo(
    () => Object.entries(checked).filter(([, v]) => v).map(([id]) => id),
    [checked],
  );

  // Restrict submission to rows on the current page (so admin sees what they're confirming).
  const visibleCheckedRows = useMemo(() => {
    if (!pageData) return [];
    const visibleIds = new Set(pageData.items.map((p) => p.id));
    return checkedRows.filter((id) => visibleIds.has(id));
  }, [checkedRows, pageData]);

  const canSubmit =
    visibleCheckedRows.length > 0 &&
    visibleCheckedRows.every((id) => selection[id] && selection[id] !== '');

  const handleConfirm = () => {
    const assignments = visibleCheckedRows.map((id) => ({
      id,
      orgchart_id: selection[id],
    }));
    apply.mutate(assignments, {
      onSuccess: () => {
        // Clear local state for confirmed rows so the next page starts clean.
        setSelection((prev) => {
          const next = { ...prev };
          for (const a of assignments) delete next[a.id];
          return next;
        });
        setChecked((prev) => {
          const next = { ...prev };
          for (const a of assignments) delete next[a.id];
          return next;
        });
      },
    });
  };

  const totalPages = pageData
    ? Math.max(1, Math.ceil(pageData.totalCount / pageData.pageSize))
    : 1;

  if (loadingUnlinked || loadingOrg) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="spinner" />
        </CardContent>
      </Card>
    );
  }

  if (!pageData || pageData.totalCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('orgchartSync.backfillPeople')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t('orgchartSync.allPeopleLinked')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {t('orgchartSync.backfillPeople')}
          <Badge variant="secondary">{pageData.totalCount}</Badge>
        </CardTitle>
        <CardDescription>{t('orgchartSync.backfillPeopleDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('orgchartSync.searchPeople')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="pl-9 touch-target"
          />
        </div>

        {pageData.items.map((local) => {
          const match = orgPeople ? computeMatch(local, orgPeople) : null;
          const localLabel = `${local.first_name} ${local.last_name}`.trim();
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
                    aria-label={t('orgchartSync.selectOrgchartPerson')}
                  >
                    <SelectValue placeholder={t('orgchartSync.selectOrgchartPerson')} />
                  </SelectTrigger>
                  <SelectContent>
                    {(match?.candidates.length ? match.candidates : orgPeople ?? []).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.personName} {p.title ? `— ${p.title}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          );
        })}

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              aria-label={t('common.previous')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages - 1}
              aria-label={t('common.next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button
            onClick={handleConfirm}
            disabled={!canSubmit || apply.isPending}
            className="touch-target"
          >
            {apply.isPending
              ? t('common.saving')
              : `${t('orgchartSync.confirmSelected')} (${visibleCheckedRows.length})`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
