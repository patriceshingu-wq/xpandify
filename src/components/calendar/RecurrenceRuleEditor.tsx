import { useLanguage } from '@/contexts/LanguageContext';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format, parse, getDate, getDay } from 'date-fns';
import { cn } from '@/lib/utils';
import type { RecurrenceRule } from '@/lib/recurrence';

interface RecurrenceRuleEditorProps {
  rule: RecurrenceRule | null;
  onChange: (rule: RecurrenceRule | null) => void;
  eventDate: string; // yyyy-MM-dd, used for defaults
}

const DAY_LABELS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_LABELS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export default function RecurrenceRuleEditor({ rule, onChange, eventDate }: RecurrenceRuleEditorProps) {
  const { t, language } = useLanguage();
  const dayLabels = language === 'fr' ? DAY_LABELS_FR : DAY_LABELS_EN;

  const eventDateObj = parse(eventDate, 'yyyy-MM-dd', new Date());
  const defaultDayOfMonth = getDate(eventDateObj);
  const defaultDayOfWeek = getDay(eventDateObj);

  // Compute nth weekday for the event date
  const computeNthWeekday = () => {
    const day = eventDateObj.getDate();
    return Math.ceil(day / 7);
  };

  const handleFrequencyChange = (freq: string) => {
    if (freq === 'none') {
      onChange(null);
      return;
    }
    const base: RecurrenceRule = {
      frequency: freq as RecurrenceRule['frequency'],
      interval_value: rule?.interval_value || 1,
      end_type: rule?.end_type || 'never',
      end_count: rule?.end_count,
      end_date: rule?.end_date,
      days_of_week: freq === 'weekly' ? [defaultDayOfWeek] : null,
      day_of_month: freq === 'monthly' ? defaultDayOfMonth : null,
      nth_weekday: null,
      weekday_of_month: null,
    };
    onChange(base);
  };

  const updateRule = (patch: Partial<RecurrenceRule>) => {
    if (!rule) return;
    onChange({ ...rule, ...patch });
  };

  const toggleDayOfWeek = (day: number) => {
    if (!rule) return;
    const current = rule.days_of_week || [];
    const updated = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day].sort((a, b) => a - b);
    updateRule({ days_of_week: updated.length > 0 ? updated : [defaultDayOfWeek] });
  };

  const handleMonthlyModeChange = (mode: string) => {
    if (mode === 'day_of_month') {
      updateRule({ day_of_month: defaultDayOfMonth, nth_weekday: null, weekday_of_month: null });
    } else {
      updateRule({ day_of_month: null, nth_weekday: computeNthWeekday(), weekday_of_month: defaultDayOfWeek });
    }
  };

  const currentFreq = rule?.frequency || 'none';
  const monthlyMode = rule?.nth_weekday != null ? 'nth_weekday' : 'day_of_month';

  return (
    <div className="space-y-4">
      {/* Frequency */}
      <div className="space-y-2">
        <Label>{t('calendar.frequency') || 'Frequency'}</Label>
        <Select value={currentFreq} onValueChange={handleFrequencyChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t('common.none') || 'None'}</SelectItem>
            <SelectItem value="daily">{t('calendar.daily') || 'Daily'}</SelectItem>
            <SelectItem value="weekly">{t('calendar.weekly') || 'Weekly'}</SelectItem>
            <SelectItem value="monthly">{t('calendar.monthly') || 'Monthly'}</SelectItem>
            <SelectItem value="yearly">{t('calendar.yearly') || 'Yearly'}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {rule && (
        <>
          {/* Interval */}
          <div className="space-y-2">
            <Label>{t('calendar.repeatEvery') || 'Repeat every'}</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={99}
                value={rule.interval_value}
                onChange={(e) => updateRule({ interval_value: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">
                {rule.frequency === 'daily' && (t('calendar.days') || 'day(s)')}
                {rule.frequency === 'weekly' && (t('calendar.weeks') || 'week(s)')}
                {rule.frequency === 'monthly' && (t('calendar.months') || 'month(s)')}
                {rule.frequency === 'yearly' && (t('calendar.years') || 'year(s)')}
              </span>
            </div>
          </div>

          {/* Weekly: day checkboxes */}
          {rule.frequency === 'weekly' && (
            <div className="space-y-2">
              <Label>{t('calendar.onDays') || 'On days'}</Label>
              <div className="flex flex-wrap gap-2">
                {dayLabels.map((label, i) => (
                  <label key={i} className="flex items-center gap-1.5 cursor-pointer">
                    <Checkbox
                      checked={rule.days_of_week?.includes(i) || false}
                      onCheckedChange={() => toggleDayOfWeek(i)}
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Monthly: mode toggle */}
          {rule.frequency === 'monthly' && (
            <div className="space-y-3">
              <Label>{t('calendar.monthlyOn') || 'Monthly on'}</Label>
              <Select value={monthlyMode} onValueChange={handleMonthlyModeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day_of_month">
                    {t('calendar.dayOfMonth') || `Day ${defaultDayOfMonth}`}
                  </SelectItem>
                  <SelectItem value="nth_weekday">
                    {t('calendar.nthWeekday') || `${computeNthWeekday()}${computeNthWeekday() === 1 ? 'st' : computeNthWeekday() === 2 ? 'nd' : computeNthWeekday() === 3 ? 'rd' : 'th'} ${dayLabels[defaultDayOfWeek]}`}
                  </SelectItem>
                </SelectContent>
              </Select>

              {monthlyMode === 'day_of_month' && (
                <div className="flex items-center gap-2">
                  <Label className="text-sm">{t('calendar.onDay') || 'On day'}</Label>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    value={rule.day_of_month || defaultDayOfMonth}
                    onChange={(e) => updateRule({ day_of_month: Math.min(31, Math.max(1, parseInt(e.target.value) || 1)) })}
                    className="w-20"
                  />
                </div>
              )}

              {monthlyMode === 'nth_weekday' && (
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={String(rule.nth_weekday ?? computeNthWeekday())}
                    onValueChange={(v) => updateRule({ nth_weekday: parseInt(v) })}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">{language === 'fr' ? '1er' : '1st'}</SelectItem>
                      <SelectItem value="2">{language === 'fr' ? '2e' : '2nd'}</SelectItem>
                      <SelectItem value="3">{language === 'fr' ? '3e' : '3rd'}</SelectItem>
                      <SelectItem value="4">{language === 'fr' ? '4e' : '4th'}</SelectItem>
                      <SelectItem value="-1">{language === 'fr' ? 'Dernier' : 'Last'}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={String(rule.weekday_of_month ?? defaultDayOfWeek)}
                    onValueChange={(v) => updateRule({ weekday_of_month: parseInt(v) })}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dayLabels.map((label, i) => (
                        <SelectItem key={i} value={String(i)}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* End condition */}
          <div className="space-y-2">
            <Label>{t('calendar.endCondition') || 'Ends'}</Label>
            <Select
              value={rule.end_type}
              onValueChange={(v) => updateRule({
                end_type: v as RecurrenceRule['end_type'],
                end_count: v === 'after_count' ? (rule.end_count || 10) : null,
                end_date: v === 'until_date' ? (rule.end_date || null) : null,
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">{t('calendar.never') || 'Never'}</SelectItem>
                <SelectItem value="after_count">{t('calendar.afterOccurrences') || 'After N occurrences'}</SelectItem>
                <SelectItem value="until_date">{t('calendar.untilDate') || 'Until date'}</SelectItem>
              </SelectContent>
            </Select>

            {rule.end_type === 'after_count' && (
              <div className="flex items-center gap-2">
                <Label className="text-sm">{t('calendar.occurrences') || 'Occurrences'}</Label>
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={rule.end_count || 10}
                  onChange={(e) => updateRule({ end_count: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-20"
                />
              </div>
            )}

            {rule.end_type === 'until_date' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !rule.end_date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {rule.end_date ? format(parse(rule.end_date, 'yyyy-MM-dd', new Date()), 'MM/dd/yyyy') : (t('calendar.pickDate') || 'Pick a date')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={rule.end_date ? parse(rule.end_date, 'yyyy-MM-dd', new Date()) : undefined}
                    onSelect={(date) => {
                      if (date) updateRule({ end_date: format(date, 'yyyy-MM-dd') });
                    }}
                    disabled={(date) => date < parse(eventDate, 'yyyy-MM-dd', new Date())}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        </>
      )}
    </div>
  );
}
