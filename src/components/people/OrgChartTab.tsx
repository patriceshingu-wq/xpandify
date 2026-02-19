import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePeople, Person } from '@/hooks/usePeople';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Search,
  Network,
  ChevronDown,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrgNode {
  person: Person;
  children: OrgNode[];
}

function buildOrgTree(people: Person[]): OrgNode[] {
  const byId = new Map<string, Person>();
  const childrenMap = new Map<string, Person[]>();

  // Index all people
  for (const person of people) {
    byId.set(person.id, person);
  }

  // Build children map
  for (const person of people) {
    if (person.supervisor_id) {
      const children = childrenMap.get(person.supervisor_id) || [];
      children.push(person);
      childrenMap.set(person.supervisor_id, children);
    }
  }

  // Build tree recursively
  function buildNode(person: Person): OrgNode {
    const children = childrenMap.get(person.id) || [];
    return {
      person,
      children: children
        .sort((a, b) => a.last_name.localeCompare(b.last_name))
        .map(buildNode),
    };
  }

  // Find root nodes (people without supervisors or whose supervisor is not in the list)
  const roots = people.filter(
    (p) => !p.supervisor_id || !byId.has(p.supervisor_id)
  );

  return roots
    .sort((a, b) => a.last_name.localeCompare(b.last_name))
    .map(buildNode);
}

interface OrgNodeCardProps {
  node: OrgNode;
  isExpanded: boolean;
  onToggle: () => void;
  onClick: () => void;
  zoom: number;
}

function OrgNodeCard({ node, isExpanded, onToggle, onClick, zoom }: OrgNodeCardProps) {
  const { person } = node;
  const hasChildren = node.children.length > 0;

  const getInitials = () => {
    return `${person.first_name.charAt(0)}${person.last_name.charAt(0)}`.toUpperCase();
  };

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md border-2",
        "min-w-[180px] max-w-[220px]",
        hasChildren && "border-primary/20"
      )}
      style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarFallback className="bg-accent/10 text-accent font-medium text-sm">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">
              {person.preferred_name || person.first_name} {person.last_name}
            </h4>
            {person.title && (
              <p className="text-xs text-muted-foreground truncate">
                {person.title}
              </p>
            )}
          </div>
          {hasChildren && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <StatusBadge status={person.status} className="text-xs" />
          {hasChildren && (
            <span className="text-xs text-muted-foreground">
              {node.children.length} report{node.children.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface OrgBranchProps {
  node: OrgNode;
  expandedNodes: Set<string>;
  toggleNode: (id: string) => void;
  onPersonClick: (person: Person) => void;
  zoom: number;
  level: number;
}

function OrgBranch({ node, expandedNodes, toggleNode, onPersonClick, zoom, level }: OrgBranchProps) {
  const isExpanded = expandedNodes.has(node.person.id);
  const hasChildren = node.children.length > 0;

  return (
    <div className="flex flex-col items-center">
      <OrgNodeCard
        node={node}
        isExpanded={isExpanded}
        onToggle={() => toggleNode(node.person.id)}
        onClick={() => onPersonClick(node.person)}
        zoom={zoom}
      />

      {hasChildren && isExpanded && (
        <>
          {/* Vertical connector from parent */}
          <div
            className="w-0.5 bg-border"
            style={{ height: `${24 * zoom}px` }}
          />

          {/* Children container */}
          <div className="flex gap-4 relative">
            {/* Horizontal connector line */}
            {node.children.length > 1 && (
              <div
                className="absolute bg-border"
                style={{
                  height: '2px',
                  top: 0,
                  left: `calc(50% - ${((node.children.length - 1) * (200 + 16) * zoom) / 2}px + ${90 * zoom}px)`,
                  right: `calc(50% - ${((node.children.length - 1) * (200 + 16) * zoom) / 2}px + ${90 * zoom}px)`,
                }}
              />
            )}

            {node.children.map((child) => (
              <div key={child.person.id} className="flex flex-col items-center">
                {/* Vertical connector to child */}
                <div
                  className="w-0.5 bg-border"
                  style={{ height: `${16 * zoom}px` }}
                />
                <OrgBranch
                  node={child}
                  expandedNodes={expandedNodes}
                  toggleNode={toggleNode}
                  onPersonClick={onPersonClick}
                  zoom={zoom}
                  level={level + 1}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function OrgChartTab() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [zoom, setZoom] = useState(1);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [expandAll, setExpandAll] = useState(false);

  const { data: people, isLoading } = usePeople({
    status: 'active', // Only show active people in org chart
  });

  const orgTree = useMemo(() => {
    if (!people) return [];
    return buildOrgTree(people);
  }, [people]);

  // Filter tree based on search
  const filteredTree = useMemo(() => {
    if (!search.trim()) return orgTree;

    const searchLower = search.toLowerCase();

    function nodeMatches(node: OrgNode): boolean {
      const person = node.person;
      const nameMatch =
        person.first_name.toLowerCase().includes(searchLower) ||
        person.last_name.toLowerCase().includes(searchLower) ||
        (person.preferred_name?.toLowerCase().includes(searchLower) ?? false);
      const titleMatch = person.title?.toLowerCase().includes(searchLower) ?? false;

      return nameMatch || titleMatch;
    }

    function filterNode(node: OrgNode): OrgNode | null {
      const filteredChildren = node.children
        .map(filterNode)
        .filter((n): n is OrgNode => n !== null);

      if (nodeMatches(node) || filteredChildren.length > 0) {
        return {
          person: node.person,
          children: filteredChildren,
        };
      }

      return null;
    }

    return orgTree
      .map(filterNode)
      .filter((n): n is OrgNode => n !== null);
  }, [orgTree, search]);

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    if (expandAll) {
      setExpandedNodes(new Set());
    } else {
      const allIds = new Set<string>();
      function collectIds(nodes: OrgNode[]) {
        for (const node of nodes) {
          allIds.add(node.person.id);
          collectIds(node.children);
        }
      }
      collectIds(filteredTree);
      setExpandedNodes(allIds);
    }
    setExpandAll(!expandAll);
  };

  const handlePersonClick = (person: Person) => {
    navigate(`/people/${person.id}`);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.1, 1.5));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.5));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner" />
      </div>
    );
  }

  if (!people || people.length === 0) {
    return (
      <EmptyState
        icon={<Network className="h-16 w-16" />}
        title={t('people.noOrgData')}
        description={t('people.noOrgDataDescription')}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('people.searchOrgChart')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 touch-target"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
                className="touch-target"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleZoomIn}
                disabled={zoom >= 1.5}
                className="touch-target"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExpandAll}
                className="gap-2 touch-target"
              >
                {expandAll ? (
                  <>
                    <Minimize2 className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('people.collapseAll')}</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('people.expandAll')}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Org Chart */}
      {filteredTree.length === 0 ? (
        <EmptyState
          icon={<Search className="h-16 w-16" />}
          title={t('common.noResults')}
          description={t('people.noOrgSearchResults')}
        />
      ) : (
        <ScrollArea className="w-full">
          <div className="p-4 min-w-max">
            <div className="flex gap-8 justify-center">
              {filteredTree.map((rootNode) => (
                <OrgBranch
                  key={rootNode.person.id}
                  node={rootNode}
                  expandedNodes={expandedNodes}
                  toggleNode={toggleNode}
                  onPersonClick={handlePersonClick}
                  zoom={zoom}
                  level={0}
                />
              ))}
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </div>
  );
}
