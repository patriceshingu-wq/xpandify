import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import {
  useOrgTree,
  useOrgPeople,
  useOrgPerson,
  useOrgStats,
  useOrgSearch,
  useOrgMinistries,
  OrgTreeNode,
  OrgPerson,
} from '@/hooks/useOrgChartAPI';
import {
  Users,
  Church,
  Building2,
  UserX,
  Search,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ChevronsDownUp,
  ChevronsUpDown,
  LayoutList,
  Network,
  Mail,
  Phone,
  ExternalLink,
  Loader2,
  User,
  MapPin,
} from 'lucide-react';

// ─── Constants ──────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  'senior-leadership': '#F59E0B',
  'executive-leadership': '#3B82F6',
  'ministry-system': '#8B5CF6',
  'department': '#10B981',
  'program': '#F97316',
  'team': '#6B7280',
};

const CATEGORY_BG: Record<string, string> = {
  'senior-leadership': 'bg-amber-900 border-amber-700',
  'executive-leadership': 'bg-blue-900 border-blue-700',
  'ministry-system': 'bg-purple-900 border-purple-700',
};

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(w => /^[a-zA-Z]/.test(w))
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
}

function getCategoryKey(category: string): string {
  const map: Record<string, string> = {
    'senior-leadership': 'orgChart.seniorLeadership',
    'executive-leadership': 'orgChart.executiveLeadership',
    'ministry-system': 'orgChart.ministrySystem',
    'department': 'orgChart.department',
    'program': 'orgChart.program',
    'team': 'orgChart.team',
  };
  return map[category] || 'orgChart.team';
}

const STATUS_COLORS: Record<string, string> = {
  active: '#22C55E',
  vacant: '#F59E0B',
  inactive: '#94A3B8',
};

// ─── Compact Tree Node ──────────────────────────────────────────────────────

interface TreeNodeProps {
  node: OrgTreeNode;
  depth: number;
  expandedNodes: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (node: OrgTreeNode) => void;
  searchHighlight?: string;
  t: (key: string) => string;
}

function TreeNode({ node, depth, expandedNodes, onToggle, onSelect, searchHighlight, t }: TreeNodeProps) {
  const isExpanded = expandedNodes.has(node.id);
  const hasChildren = node.children && node.children.length > 0;
  const isMinistry = node.category === 'ministry-system';
  const isLeadership = node.category === 'senior-leadership' || node.category === 'executive-leadership';
  const isDarkCard = isMinistry || isLeadership;
  const categoryColor = CATEGORY_COLORS[node.category] || CATEGORY_COLORS['team'];

  const isHighlighted = searchHighlight &&
    (node.title?.toLowerCase().includes(searchHighlight.toLowerCase()) ||
     node.personName?.toLowerCase().includes(searchHighlight.toLowerCase()));

  // For dark cards (ministries/leadership), render as a container with embedded children
  if (isDarkCard && hasChildren) {
    return (
      <div className={cn('mb-2', depth > 0 && 'ml-4')}>
        <div
          className={cn(
            'rounded-xl border shadow-sm overflow-hidden transition-all',
            CATEGORY_BG[node.category] || 'bg-slate-800 border-slate-600',
            'text-white',
            isHighlighted && 'ring-2 ring-primary ring-offset-2',
          )}
        >
          {/* Header */}
          <div
            className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-white/5 transition-colors"
            onClick={() => onSelect(node)}
          >
            <div
              className="flex-shrink-0 rounded-full flex items-center justify-center text-white font-bold text-[10px]"
              style={{ width: 28, height: 28, backgroundColor: categoryColor }}
            >
              {node.personName ? getInitials(node.personName) : getInitials(node.title)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold leading-tight truncate">{node.title}</div>
              {node.personName && (
                <div className="text-[10px] text-white/50 truncate mt-0.5">
                  {node.personTitle ? `${node.personTitle} ${node.personName}` : node.personName}
                </div>
              )}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
              className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              aria-label={isExpanded ? t('orgChart.collapseAll') : t('orgChart.expandAll')}
            >
              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Embedded children list */}
          {isExpanded && (
            <div className="bg-black/25 border-t border-white/10">
              {node.children.map(child => {
                const childHasChildren = child.children && child.children.length > 0;
                const childIsContainer = child.category === 'ministry-system' || child.category === 'department';

                // If a child is itself a ministry or dept with children, render it as a nested dark card
                if (childIsContainer && childHasChildren) {
                  return (
                    <div key={child.id} className="px-1 py-0.5">
                      <TreeNode
                        node={child}
                        depth={0}
                        expandedNodes={expandedNodes}
                        onToggle={onToggle}
                        onSelect={onSelect}
                        searchHighlight={searchHighlight}
                        t={t}
                      />
                    </div>
                  );
                }

                // Otherwise, render as a compact embedded row
                return (
                  <EmbeddedRow
                    key={child.id}
                    node={child}
                    onSelect={onSelect}
                    searchHighlight={searchHighlight}
                    expandedNodes={expandedNodes}
                    onToggle={onToggle}
                    t={t}
                    depth={0}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Standard white card for individual roles
  return (
    <div className={cn('mb-1', depth > 0 && 'ml-4')}>
      <div
        className={cn(
          'flex items-center gap-2 px-2.5 py-2 rounded-lg border bg-card cursor-pointer',
          'hover:shadow-sm hover:bg-accent/50 transition-all',
          'border-l-[3px]',
          isHighlighted && 'ring-2 ring-primary ring-offset-1',
        )}
        style={{ borderLeftColor: categoryColor }}
        onClick={() => onSelect(node)}
      >
        {/* Status dot */}
        <span
          className="flex-shrink-0 rounded-full"
          style={{ width: 7, height: 7, backgroundColor: STATUS_COLORS[node.status] || STATUS_COLORS.active }}
        />

        <div className="flex-1 min-w-0">
          {node.personName ? (
            <>
              <div className="text-xs font-medium text-foreground leading-tight truncate">{node.personName}</div>
              <div className="text-[11px] text-muted-foreground truncate">{node.title}</div>
            </>
          ) : (
            <>
              <div className="text-xs font-medium text-foreground leading-tight truncate">{node.title}</div>
              {node.status === 'vacant' && (
                <span className="text-[10px] text-amber-600 font-medium">{t('orgChart.vacant')}</span>
              )}
            </>
          )}
        </div>

        {/* Language badge */}
        <span className="text-[9px] text-muted-foreground font-medium uppercase shrink-0">
          {node.language === 'both' ? 'EN/FR' : node.language === 'french' ? 'FR' : 'EN'}
        </span>

        {/* Expand toggle for nodes with children */}
        {hasChildren && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
            className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors shrink-0"
            aria-label={isExpanded ? t('orgChart.collapseAll') : t('orgChart.expandAll')}
          >
            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="border-l border-border ml-3 pl-0 mt-0.5">
          {node.children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedNodes={expandedNodes}
              onToggle={onToggle}
              onSelect={onSelect}
              searchHighlight={searchHighlight}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Embedded Row (inside dark cards) ───────────────────────────────────────

interface EmbeddedRowProps {
  node: OrgTreeNode;
  onSelect: (node: OrgTreeNode) => void;
  searchHighlight?: string;
  expandedNodes: Set<string>;
  onToggle: (id: string) => void;
  t: (key: string) => string;
  depth: number;
}

function EmbeddedRow({ node, onSelect, searchHighlight, expandedNodes, onToggle, t, depth }: EmbeddedRowProps) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodes.has(node.id);
  const isHighlighted = searchHighlight &&
    (node.title?.toLowerCase().includes(searchHighlight.toLowerCase()) ||
     node.personName?.toLowerCase().includes(searchHighlight.toLowerCase()));

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-1 hover:bg-white/10 rounded mx-1 transition-colors cursor-pointer group/row',
          depth > 0 && 'ml-3',
          isHighlighted && 'bg-white/15',
        )}
        onClick={(e) => { e.stopPropagation(); onSelect(node); }}
      >
        <span
          className="flex-shrink-0 rounded-full"
          style={{ width: depth > 0 ? 5 : 6, height: depth > 0 ? 5 : 6, backgroundColor: STATUS_COLORS[node.status] || STATUS_COLORS.active }}
        />
        <div className="flex-1 min-w-0">
          {node.personName ? (
            <>
              <div className={cn('font-medium text-white/90 truncate', depth > 0 ? 'text-[10px]' : 'text-[11px]')}>
                {node.personName}
              </div>
              <div className={cn('text-white/40 truncate', depth > 0 ? 'text-[8px]' : 'text-[9px]')}>
                {node.title}
              </div>
            </>
          ) : (
            <div className={cn('font-medium text-white/90 truncate', depth > 0 ? 'text-[10px]' : 'text-[11px]')}>
              {node.title}
            </div>
          )}
        </div>
        {node.language && node.language !== 'both' && (
          <span className="text-[8px] text-white/30 font-medium uppercase shrink-0">
            {node.language === 'french' ? 'FR' : 'EN'}
          </span>
        )}
        {hasChildren && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
            className="p-0.5 rounded text-white/40 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            aria-label={isExpanded ? t('orgChart.collapseAll') : t('orgChart.expandAll')}
          >
            {isExpanded ? <ChevronDown className="h-2.5 w-2.5" /> : <ChevronRight className="h-2.5 w-2.5" />}
          </button>
        )}
      </div>

      {/* Nested children inside embedded row */}
      {hasChildren && isExpanded && (
        <div className={cn('border-l border-white/10 ml-4 pl-0')}>
          {node.children.map(child => (
            <EmbeddedRow
              key={child.id}
              node={child}
              onSelect={onSelect}
              searchHighlight={searchHighlight}
              expandedNodes={expandedNodes}
              onToggle={onToggle}
              t={t}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── List View Row ──────────────────────────────────────────────────────────

function ListViewRow({ person, onSelect, t }: { person: OrgPerson; onSelect: (p: OrgPerson) => void; t: (key: string) => string }) {
  const categoryColor = CATEGORY_COLORS[person.category] || CATEGORY_COLORS['team'];

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer',
        'hover:bg-accent/50 transition-colors border-l-[3px]',
      )}
      style={{ borderLeftColor: categoryColor }}
      onClick={() => onSelect(person)}
    >
      <span
        className="flex-shrink-0 rounded-full"
        style={{ width: 7, height: 7, backgroundColor: STATUS_COLORS[person.status] || STATUS_COLORS.active }}
      />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium truncate">{person.personName || person.title}</div>
        {person.personName && (
          <div className="text-[11px] text-muted-foreground truncate">{person.title}</div>
        )}
      </div>
      <div className="hidden sm:flex items-center gap-2 shrink-0">
        {person.ministry && (
          <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">{person.ministry}</span>
        )}
        {person.department && (
          <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">{person.department}</span>
        )}
      </div>
      <span className="text-[9px] text-muted-foreground font-medium uppercase shrink-0">
        {person.language === 'both' ? 'EN/FR' : person.language === 'french' ? 'FR' : 'EN'}
      </span>
    </div>
  );
}

// ─── Detail Sheet ───────────────────────────────────────────────────────────

function PersonDetailSheet({
  node,
  open,
  onOpenChange,
  t,
}: {
  node: OrgTreeNode | OrgPerson | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  t: (key: string) => string;
}) {
  const navigate = useNavigate();
  const { data: personDetail, isLoading } = useOrgPerson(node?.id);
  const categoryColor = node ? CATEGORY_COLORS[node.category] || CATEGORY_COLORS['team'] : '#94A3B8';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[340px] sm:w-[380px] p-0 overflow-y-auto">
        {/* Category color strip */}
        <div className="h-1 shrink-0" style={{ backgroundColor: categoryColor }} />

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : personDetail ? (
          <div className="px-5 py-4 space-y-4">
            {/* Header */}
            <SheetHeader className="p-0">
              <SheetTitle className="text-base">
                {personDetail.personName || personDetail.title}
              </SheetTitle>
              {personDetail.personName && (
                <p className="text-sm text-muted-foreground">{personDetail.title}</p>
              )}
              {personDetail.personTitle && (
                <p className="text-xs text-muted-foreground">{personDetail.personTitle}</p>
              )}
            </SheetHeader>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5">
              <Badge
                variant="secondary"
                className="text-[10px] px-2 py-0.5"
                style={{ borderLeft: `3px solid ${categoryColor}` }}
              >
                {t(getCategoryKey(personDetail.category))}
              </Badge>
              <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                {personDetail.language === 'both' ? 'EN/FR' : personDetail.language === 'french' ? 'FR' : 'EN'}
              </Badge>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">
                <span
                  className="rounded-full inline-block"
                  style={{ width: 6, height: 6, backgroundColor: STATUS_COLORS[personDetail.status] || STATUS_COLORS.active }}
                />
                {personDetail.status}
              </span>
            </div>

            {/* Breadcrumb */}
            {personDetail.breadcrumb && personDetail.breadcrumb.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                    {t('orgChart.breadcrumb')}
                  </p>
                  <div className="flex flex-wrap items-center gap-0.5 text-xs">
                    {personDetail.breadcrumb.map((item, i) => (
                      <span key={i} className="flex items-center gap-0.5">
                        {i > 0 && <ChevronRight className="h-2.5 w-2.5 text-muted-foreground" />}
                        <span className="text-muted-foreground">{item}</span>
                      </span>
                    ))}
                    <ChevronRight className="h-2.5 w-2.5 text-muted-foreground" />
                    <span className="font-medium text-foreground">{personDetail.title}</span>
                  </div>
                </div>
              </>
            )}

            {/* Notes / Description */}
            {personDetail.notes && (
              <>
                <Separator />
                <p className="text-xs text-muted-foreground leading-relaxed">{personDetail.notes}</p>
              </>
            )}

            {/* Contact */}
            {(personDetail.email || personDetail.phone) && (
              <>
                <Separator />
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                    {t('orgChart.contactInfo')}
                  </p>
                  <div className="space-y-1.5">
                    {personDetail.email && (
                      <div className="flex items-center gap-2 text-xs">
                        <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                        <a href={`mailto:${personDetail.email}`} className="text-primary hover:underline truncate">
                          {personDetail.email}
                        </a>
                      </div>
                    )}
                    {personDetail.phone && (
                      <div className="flex items-center gap-2 text-xs">
                        <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                        <a href={`tel:${personDetail.phone}`} className="text-primary hover:underline">
                          {personDetail.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Ministry / Department context */}
            {(personDetail.ministry || personDetail.department) && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-3">
                  {personDetail.ministry && (
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                        {t('orgChart.ministries')}
                      </p>
                      <p className="text-xs font-medium">{personDetail.ministry}</p>
                    </div>
                  )}
                  {personDetail.department && (
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                        {t('orgChart.departments')}
                      </p>
                      <p className="text-xs font-medium">{personDetail.department}</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Direct Reports */}
            <Separator />
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                {t('orgChart.directReports')} ({personDetail.directReports?.length || 0})
              </p>
              {personDetail.directReports && personDetail.directReports.length > 0 ? (
                <div className="flex flex-col gap-0.5">
                  {personDetail.directReports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center gap-2 text-xs px-2 py-1.5 bg-muted/50 hover:bg-muted rounded-md transition-colors"
                    >
                      <span
                        className="flex-shrink-0 rounded-full"
                        style={{ width: 6, height: 6, backgroundColor: STATUS_COLORS[report.status] || STATUS_COLORS.active }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{report.personName || report.title}</div>
                        {report.personName && (
                          <div className="text-[10px] text-muted-foreground truncate">{report.title}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">—</p>
              )}
            </div>
          </div>
        ) : node ? (
          <div className="px-5 py-4">
            <SheetHeader className="p-0">
              <SheetTitle className="text-base">{node.personName || node.title}</SheetTitle>
              {node.personName && <p className="text-sm text-muted-foreground">{node.title}</p>}
            </SheetHeader>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

// ─── Main OrgChart Page ─────────────────────────────────────────────────────

export default function OrgChart() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [languageFilter, setLanguageFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<OrgTreeNode | OrgPerson | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Debounce search
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  // Data
  const { data: stats, isLoading: statsLoading } = useOrgStats();
  const { data: treeData, isLoading: treeLoading } = useOrgTree();
  const { data: peopleData, isLoading: peopleLoading } = useOrgPeople();
  const { data: searchResults } = useOrgSearch(debouncedSearch);

  // Collect all node IDs
  const allNodeIds = useMemo(() => {
    const ids = new Set<string>();
    function collect(nodes: OrgTreeNode[]) {
      for (const n of nodes) {
        ids.add(n.id);
        if (n.children) collect(n.children);
      }
    }
    if (treeData) collect(treeData);
    return ids;
  }, [treeData]);

  // Auto-expand first 2 levels on load
  useEffect(() => {
    if (treeData && expandedNodes.size === 0) {
      const initial = new Set<string>();
      for (const node of treeData) {
        initial.add(node.id);
        if (node.children) {
          for (const child of node.children) {
            initial.add(child.id);
          }
        }
      }
      setExpandedNodes(initial);
    }
  }, [treeData]);

  // Filter tree
  const filteredTree = useMemo(() => {
    if (!treeData) return [];

    function filterNode(node: OrgTreeNode): OrgTreeNode | null {
      const matchesLang = languageFilter === 'all' || node.language === languageFilter;
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && node.status === 'active') ||
        (statusFilter === 'vacant' && node.status === 'vacant');
      const matchesSearch = !debouncedSearch ||
        node.title?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        node.personName?.toLowerCase().includes(debouncedSearch.toLowerCase());

      const filteredChildren = (node.children || []).map(filterNode).filter(Boolean) as OrgTreeNode[];
      const selfMatches = matchesLang && matchesStatus && matchesSearch;

      if (selfMatches || filteredChildren.length > 0) {
        return { ...node, children: filteredChildren };
      }
      return null;
    }

    return treeData.map(filterNode).filter(Boolean) as OrgTreeNode[];
  }, [treeData, languageFilter, statusFilter, debouncedSearch]);

  // Filter people list
  const filteredPeople = useMemo(() => {
    const source = debouncedSearch && searchResults ? searchResults : peopleData;
    if (!source) return [];
    return source.filter(p => {
      const matchesLang = languageFilter === 'all' || p.language === languageFilter;
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesLang && matchesStatus;
    });
  }, [peopleData, searchResults, debouncedSearch, languageFilter, statusFilter]);

  // Handlers
  const handleToggle = useCallback((id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleSelectTreeNode = useCallback((node: OrgTreeNode) => {
    setSelectedNode(node);
    setSheetOpen(true);
  }, []);

  const handleSelectPerson = useCallback((person: OrgPerson) => {
    setSelectedNode(person);
    setSheetOpen(true);
  }, []);

  const handleExpandAll = useCallback(() => setExpandedNodes(new Set(allNodeIds)), [allNodeIds]);
  const handleCollapseAll = useCallback(() => setExpandedNodes(new Set()), []);

  const isAllExpanded = expandedNodes.size >= allNodeIds.size;
  const isLoading = viewMode === 'tree' ? treeLoading : peopleLoading;

  return (
    <MainLayout title={t('orgChart.title')} subtitle={t('orgChart.subtitle')}>
      <div className="space-y-3">
        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { icon: <Users className="h-4 w-4 text-primary" />, label: t('orgChart.totalPeople'), value: stats?.totalPeople },
            { icon: <Church className="h-4 w-4 text-purple-600" />, label: t('orgChart.ministries'), value: stats?.byCategory?.['ministry-system'] },
            { icon: <Building2 className="h-4 w-4 text-emerald-600" />, label: t('orgChart.departments'), value: stats?.byCategory?.['department'] },
            { icon: <UserX className="h-4 w-4 text-amber-600" />, label: t('orgChart.vacantPositions'), value: stats?.vacantPositions },
          ].map(({ icon, label, value }) => (
            <Card key={label} className="flex-1">
              <CardContent className="flex items-center gap-2.5 p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">{icon}</div>
                <div>
                  <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
                  {statsLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin mt-0.5" />
                  ) : (
                    <p className="text-lg font-bold leading-tight">{value ?? 0}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Toolbar */}
        <Card>
          <CardContent className="p-2.5">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder={t('orgChart.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <Select value={languageFilter} onValueChange={setLanguageFilter}>
                  <SelectTrigger className="w-[110px] h-8 text-xs" aria-label={t('orgChart.filterLanguage')}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('orgChart.allLanguages')}</SelectItem>
                    <SelectItem value="english">{t('orgChart.english')}</SelectItem>
                    <SelectItem value="french">{t('orgChart.french')}</SelectItem>
                    <SelectItem value="both">{t('orgChart.bilingual')}</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[100px] h-8 text-xs" aria-label={t('orgChart.filterStatus')}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('orgChart.allStatuses')}</SelectItem>
                    <SelectItem value="active">{t('orgChart.active')}</SelectItem>
                    <SelectItem value="vacant">{t('orgChart.vacant')}</SelectItem>
                  </SelectContent>
                </Select>

                {/* View toggle */}
                <div className="flex border rounded-md overflow-hidden">
                  <Button
                    variant={viewMode === 'tree' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-none h-8 px-2.5 text-xs"
                    onClick={() => setViewMode('tree')}
                    aria-label={t('orgChart.treeView')}
                  >
                    <Network className="h-3.5 w-3.5 mr-1" />
                    <span className="hidden sm:inline">{t('orgChart.treeView')}</span>
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-none h-8 px-2.5 text-xs"
                    onClick={() => setViewMode('list')}
                    aria-label={t('orgChart.listView')}
                  >
                    <LayoutList className="h-3.5 w-3.5 mr-1" />
                    <span className="hidden sm:inline">{t('orgChart.listView')}</span>
                  </Button>
                </div>

                {viewMode === 'tree' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 text-xs"
                    onClick={isAllExpanded ? handleCollapseAll : handleExpandAll}
                    aria-label={isAllExpanded ? t('orgChart.collapseAll') : t('orgChart.expandAll')}
                  >
                    {isAllExpanded ? (
                      <ChevronsDownUp className="h-3.5 w-3.5 mr-1" />
                    ) : (
                      <ChevronsUpDown className="h-3.5 w-3.5 mr-1" />
                    )}
                    <span className="hidden md:inline">
                      {isAllExpanded ? t('orgChart.collapseAll') : t('orgChart.expandAll')}
                    </span>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{t('orgChart.loading')}</p>
          </div>
        ) : viewMode === 'tree' ? (
          filteredTree.length > 0 ? (
            <div className="space-y-0">
              {filteredTree.map(rootNode => (
                <TreeNode
                  key={rootNode.id}
                  node={rootNode}
                  depth={0}
                  expandedNodes={expandedNodes}
                  onToggle={handleToggle}
                  onSelect={handleSelectTreeNode}
                  searchHighlight={debouncedSearch || undefined}
                  t={t}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Network className="h-8 w-8 text-muted-foreground" />}
              title={t('orgChart.noResults')}
            />
          )
        ) : filteredPeople.length > 0 ? (
          <div className="space-y-1">
            {filteredPeople.map(person => (
              <ListViewRow key={person.id} person={person} onSelect={handleSelectPerson} t={t} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Users className="h-8 w-8 text-muted-foreground" />}
            title={t('orgChart.noResults')}
          />
        )}
      </div>

      {/* Detail Sheet */}
      <PersonDetailSheet
        node={selectedNode}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        t={t}
      />
    </MainLayout>
  );
}
