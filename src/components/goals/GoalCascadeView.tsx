import { useMemo, useState } from 'react';
import { Goal } from '@/hooks/useGoals';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/ui/status-badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Building2,
  Church,
  Users,
  User,
  ChevronRight,
  ChevronDown,
  Target,
  ArrowDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GoalCascadeViewProps {
  goals: Goal[];
  onGoalClick?: (goal: Goal) => void;
}

interface GoalNode extends Goal {
  children: GoalNode[];
}

const getLevelConfig = (level: string) => {
  switch (level) {
    case 'church':
      return {
        icon: Church,
        color: 'bg-muted text-foreground',
        borderColor: 'border-l-muted-foreground',
        bgColor: 'bg-muted/30',
        labelKey: 'goals.church'
      };
    case 'ministry':
      return {
        icon: Building2,
        color: 'bg-info text-info-foreground',
        borderColor: 'border-l-info',
        bgColor: 'bg-info/5',
        labelKey: 'goals.ministry'
      };
    case 'department':
      return {
        icon: Users,
        color: 'bg-warning text-warning-foreground',
        borderColor: 'border-l-warning',
        bgColor: 'bg-warning/5',
        labelKey: 'goals.department'
      };
    case 'individual':
      return {
        icon: User,
        color: 'bg-success text-success-foreground',
        borderColor: 'border-l-success',
        bgColor: 'bg-success/5',
        labelKey: 'goals.individual'
      };
    default:
      return {
        icon: Target,
        color: 'bg-muted text-muted-foreground',
        borderColor: 'border-l-muted',
        bgColor: 'bg-muted/5',
        labelKey: 'common.unknown'
      };
  }
};

function GoalTreeNode({
  goal,
  level = 0,
  onGoalClick
}: {
  goal: GoalNode;
  level?: number;
  onGoalClick?: (goal: Goal) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const { t, getLocalizedField } = useLanguage();
  const config = getLevelConfig(goal.goal_level);
  const Icon = config.icon;
  const hasChildren = goal.children.length > 0;

  return (
    <div className="relative">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div 
          className={cn(
            "group rounded-lg border-l-4 transition-all hover:shadow-md cursor-pointer",
            config.borderColor,
            config.bgColor,
            "mb-3"
          )}
          style={{ marginLeft: level * 24 }}
        >
          <div 
            className="p-4"
            onClick={() => onGoalClick?.(goal)}
          >
            <div className="flex items-start gap-3">
              {hasChildren && (
                <CollapsibleTrigger 
                  className="mt-1 p-0.5 hover:bg-muted rounded"
                  onClick={(e) => e.stopPropagation()}
                >
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </CollapsibleTrigger>
              )}
              {!hasChildren && <div className="w-5" />}
              
              <div className={cn("p-2 rounded-lg", config.color)}>
                <Icon className="h-4 w-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Badge variant="outline" className="text-xs">
                    {t(config.labelKey)}
                  </Badge>
                  <StatusBadge status={goal.status} />
                </div>
                <h4 className="font-medium text-foreground truncate">
                  {getLocalizedField(goal, 'title')}
                </h4>
                {getLocalizedField(goal, 'description') && (
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                    {getLocalizedField(goal, 'description')}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  {goal.owner_person && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {goal.owner_person.first_name} {goal.owner_person.last_name}
                    </span>
                  )}
                  {goal.owner_ministry && (
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {goal.owner_ministry.name_en}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="text-right shrink-0">
                <div className="text-lg font-bold text-foreground">
                  {goal.progress_percent}%
                </div>
                <Progress value={goal.progress_percent} className="h-1.5 w-16" />
              </div>
            </div>
          </div>
        </div>

        {hasChildren && (
          <CollapsibleContent>
            <div className="relative">
              {/* Vertical connector line */}
              <div 
                className="absolute left-[11px] top-0 bottom-3 w-0.5 bg-border"
                style={{ marginLeft: level * 24 }}
              />
              {goal.children.map((child, idx) => (
                <div key={child.id} className="relative">
                  {/* Horizontal connector line */}
                  <div 
                    className="absolute top-6 h-0.5 w-4 bg-border"
                    style={{ left: (level * 24) + 11 }}
                  />
                  <GoalTreeNode 
                    goal={child} 
                    level={level + 1} 
                    onGoalClick={onGoalClick}
                  />
                </div>
              ))}
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
}

export function GoalCascadeView({ goals, onGoalClick }: GoalCascadeViewProps) {
  const { t } = useLanguage();
  const { departmentGoals } = useFeatureFlags();

  // Dynamic level order based on feature flags
  const LEVEL_ORDER = useMemo(() => {
    return departmentGoals
      ? (['church', 'ministry', 'department', 'individual'] as const)
      : (['church', 'ministry', 'individual'] as const);
  }, [departmentGoals]);

  // Build tree structure from flat goals list
  const goalTree = useMemo(() => {
    const goalMap = new Map<string, GoalNode>();
    
    // First pass: create nodes
    goals.forEach(goal => {
      goalMap.set(goal.id, { ...goal, children: [] });
    });
    
    // Second pass: link children to parents
    const rootGoals: GoalNode[] = [];
    goalMap.forEach(goal => {
      if (goal.parent_goal_id && goalMap.has(goal.parent_goal_id)) {
        goalMap.get(goal.parent_goal_id)!.children.push(goal);
      } else {
        rootGoals.push(goal);
      }
    });
    
    // Sort by level order, then by title
    const sortGoals = (a: GoalNode, b: GoalNode) => {
      const levelDiff = LEVEL_ORDER.indexOf(a.goal_level as any) - LEVEL_ORDER.indexOf(b.goal_level as any);
      if (levelDiff !== 0) return levelDiff;
      return (a.title_en || '').localeCompare(b.title_en || '');
    };
    
    const sortRecursively = (nodes: GoalNode[]) => {
      nodes.sort(sortGoals);
      nodes.forEach(node => sortRecursively(node.children));
    };
    
    sortRecursively(rootGoals);

    return rootGoals;
  }, [goals, LEVEL_ORDER]);

  // Calculate stats per level
  const levelStats = useMemo(() => {
    const stats = LEVEL_ORDER.map(level => ({
      level,
      config: getLevelConfig(level),
      count: goals.filter(g => g.goal_level === level).length,
      avgProgress: Math.round(
        goals.filter(g => g.goal_level === level)
          .reduce((sum, g) => sum + (g.progress_percent || 0), 0) /
        (goals.filter(g => g.goal_level === level).length || 1)
      ),
    }));
    return stats;
  }, [goals, LEVEL_ORDER]);

  return (
    <div className="space-y-6">
      {/* Cascade Legend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Target className="h-4 w-4" />
            {t('goals.cascadeOverview')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
            {levelStats.map((stat, idx) => {
              const Icon = stat.config.icon;
              return (
                <div key={stat.level} className="flex items-center gap-2">
                  <div className="flex flex-col items-center min-w-[100px]">
                    <div className={cn("p-3 rounded-xl", stat.config.color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium mt-2">{t(stat.config.labelKey)}</span>
                    <span className="text-xs text-muted-foreground">
                      {stat.count} {stat.count !== 1 ? t('goals.goals') : t('goals.goal')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {stat.avgProgress}% {t('goals.avgProgress')}
                    </span>
                  </div>
                  {idx < levelStats.length - 1 && (
                    <ArrowDown className="h-5 w-5 text-muted-foreground rotate-[-90deg] hidden sm:block" />
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            {t('goals.cascadeDescription')}
          </p>
        </CardContent>
      </Card>

      {/* Goal Tree */}
      <div className="space-y-2">
        {goalTree.length > 0 ? (
          goalTree.map(goal => (
            <GoalTreeNode 
              key={goal.id} 
              goal={goal} 
              onGoalClick={onGoalClick}
            />
          ))
        ) : (
          <Card className="p-8 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">{t('goals.noGoalsCascade')}</p>
          </Card>
        )}
      </div>
    </div>
  );
}
