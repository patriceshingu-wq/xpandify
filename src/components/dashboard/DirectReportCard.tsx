import { format, formatDistanceToNow } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, CheckSquare, Target, Clock, Plus } from 'lucide-react';
import { DirectReportWithStats } from '@/hooks/useDirectReports';

interface DirectReportCardProps {
  report: DirectReportWithStats;
  onSchedule1on1: (personId: string, personName: string) => void;
  onViewProfile: (personId: string) => void;
}

export function DirectReportCard({ report, onSchedule1on1, onViewProfile }: DirectReportCardProps) {
  const initials = `${report.first_name[0]}${report.last_name[0]}`.toUpperCase();
  const displayName = report.preferred_name || `${report.first_name} ${report.last_name}`;
  const totalGoals = report.goalsInProgress + report.goalsCompleted;
  const goalProgress = totalGoals > 0 ? Math.round((report.goalsCompleted / totalGoals) * 100) : 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="h-12 w-12 cursor-pointer" onClick={() => onViewProfile(report.id)}>
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 
                className="font-semibold truncate cursor-pointer hover:text-primary transition-colors"
                onClick={() => onViewProfile(report.id)}
              >
                {displayName}
              </h3>
              {report.person_type && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  {report.person_type}
                </Badge>
              )}
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
              {/* Next 1:1 */}
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {report.nextMeeting ? (
                  <span className="text-foreground">
                    {formatDistanceToNow(new Date(report.nextMeeting.date_time), { addSuffix: true })}
                  </span>
                ) : (
                  <span className="text-warning">No 1:1 scheduled</span>
                )}
              </div>

              {/* Open Actions */}
              <div className="flex items-center gap-1">
                <CheckSquare className="h-3.5 w-3.5" />
                <span className={report.openActionItems > 0 ? 'text-warning font-medium' : ''}>
                  {report.openActionItems} actions
                </span>
              </div>

              {/* Goals */}
              <div className="flex items-center gap-1">
                <Target className="h-3.5 w-3.5" />
                <span>
                  {report.goalsCompleted}/{totalGoals} goals
                </span>
              </div>
            </div>

            {/* Goal Progress Bar */}
            {totalGoals > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Goal completion</span>
                  <span className="font-medium">{goalProgress}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      goalProgress >= 75 ? 'bg-success' :
                      goalProgress >= 50 ? 'bg-accent' :
                      goalProgress >= 25 ? 'bg-info' : 'bg-warning'
                    }`}
                    style={{ width: `${goalProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Next Meeting Details */}
            {report.nextMeeting && (
              <div className="mt-3 p-2 rounded-md bg-muted/50 text-xs">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">{report.nextMeeting.title_en}</span>
                </div>
                <p className="text-muted-foreground mt-0.5 ml-4">
                  {format(new Date(report.nextMeeting.date_time), "EEE, MMM d 'at' h:mm a")}
                </p>
              </div>
            )}
          </div>

          {/* Quick Schedule Button */}
          {!report.nextMeeting && (
            <Button
              size="sm"
              variant="outline"
              className="shrink-0"
              onClick={() => onSchedule1on1(report.id, displayName)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Schedule 1:1
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
