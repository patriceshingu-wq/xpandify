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
      <CardContent className="p-4 md:p-5">
        <div className="flex flex-col gap-4">
          {/* Header Row - Avatar & Name */}
          <div className="flex items-start gap-3 md:gap-4">
            <Avatar className="h-12 w-12 md:h-14 md:w-14 shrink-0 cursor-pointer" onClick={() => onViewProfile(report.id)}>
              <AvatarFallback className="bg-muted text-foreground font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                <h3 
                  className="font-semibold text-base truncate cursor-pointer hover:text-foreground/70 transition-colors"
                  onClick={() => onViewProfile(report.id)}
                >
                  {displayName}
                </h3>
                {report.person_type && (
                  <Badge variant="secondary" className="text-xs shrink-0 w-fit">
                    {report.person_type}
                  </Badge>
                )}
              </div>

              {/* Stats Row - Stack on mobile */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3 mt-3 text-sm text-muted-foreground">
                {/* Next 1:1 */}
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 shrink-0" />
                  {report.nextMeeting ? (
                    <span className="text-foreground">
                      {formatDistanceToNow(new Date(report.nextMeeting.date_time), { addSuffix: true })}
                    </span>
                  ) : (
                    <span className="text-warning">No 1:1 scheduled</span>
                  )}
                </div>

                {/* Open Actions */}
                <div className="flex items-center gap-1.5">
                  <CheckSquare className="h-4 w-4 shrink-0" />
                  <span className={report.openActionItems > 0 ? 'text-warning font-medium' : ''}>
                    {report.openActionItems} actions
                  </span>
                </div>

                {/* Goals */}
                <div className="flex items-center gap-1.5">
                  <Target className="h-4 w-4 shrink-0" />
                  <span>
                    {report.goalsCompleted}/{totalGoals} goals
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Goal Progress Bar */}
          {totalGoals > 0 && (
            <div className="px-0 sm:pl-16">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Goal completion</span>
                <span className="font-medium">{goalProgress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    goalProgress >= 75 ? 'bg-success' :
                    goalProgress >= 50 ? 'bg-muted-foreground' :
                    goalProgress >= 25 ? 'bg-info' : 'bg-warning'
                  }`}
                  style={{ width: `${goalProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Next Meeting Details */}
          {report.nextMeeting && (
            <div className="p-3 rounded-md bg-muted/50 text-sm sm:ml-16">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-medium leading-relaxed">{report.nextMeeting.title_en}</span>
              </div>
              <p className="text-muted-foreground mt-1 ml-6 leading-relaxed">
                {format(new Date(report.nextMeeting.date_time), "EEE, MMM d 'at' h:mm a")}
              </p>
            </div>
          )}

          {/* Quick Schedule Button - Full width on mobile */}
          {!report.nextMeeting && (
            <Button
              variant="outline"
              className="w-full sm:w-auto sm:self-end touch-target gap-2"
              onClick={() => onSchedule1on1(report.id, displayName)}
            >
              <Plus className="h-4 w-4" />
              Schedule 1:1
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
