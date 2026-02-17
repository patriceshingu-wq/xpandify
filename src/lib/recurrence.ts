import { addDays, addWeeks, addMonths, addYears, format, getDay, setDate, startOfMonth, getDate } from 'date-fns';

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval_value: number;
  days_of_week?: number[] | null; // 0=Sun..6=Sat
  day_of_month?: number | null;
  nth_weekday?: number | null; // 1,2,3,4,-1(last)
  weekday_of_month?: number | null; // 0=Sun..6=Sat
  end_type: 'never' | 'after_count' | 'until_date';
  end_count?: number | null;
  end_date?: string | null; // yyyy-MM-dd
}

const MAX_OCCURRENCES = 365;
const MAX_YEARS_OUT = 2;

/**
 * Get the nth weekday of a given month.
 * nth: 1-4 for first through fourth, -1 for last.
 */
function getNthWeekdayOfMonth(year: number, month: number, weekday: number, nth: number): Date | null {
  const start = startOfMonth(new Date(year, month));
  
  if (nth === -1) {
    // Last occurrence: start from end of month and go backward
    const lastDay = new Date(year, month + 1, 0);
    for (let d = lastDay.getDate(); d >= 1; d--) {
      const date = new Date(year, month, d);
      if (getDay(date) === weekday) return date;
    }
    return null;
  }

  let count = 0;
  for (let d = 1; d <= 31; d++) {
    const date = new Date(year, month, d);
    if (date.getMonth() !== month) break;
    if (getDay(date) === weekday) {
      count++;
      if (count === nth) return date;
    }
  }
  return null;
}

/**
 * Generate occurrence dates based on a recurrence rule.
 * Returns an array of date strings in yyyy-MM-dd format.
 */
export function generateOccurrences(
  startDate: string,
  rule: RecurrenceRule,
  exceptionDates: string[] = []
): string[] {
  const dates: string[] = [];
  const start = new Date(startDate + 'T00:00:00');
  const maxDate = addYears(start, MAX_YEARS_OUT);
  const exceptionSet = new Set(exceptionDates);

  let maxCount = MAX_OCCURRENCES;
  if (rule.end_type === 'after_count' && rule.end_count) {
    maxCount = Math.min(rule.end_count, MAX_OCCURRENCES);
  }
  const untilDate = rule.end_type === 'until_date' && rule.end_date
    ? new Date(rule.end_date + 'T23:59:59')
    : maxDate;

  const interval = rule.interval_value || 1;

  if (rule.frequency === 'daily') {
    let current = start;
    while (dates.length < maxCount && current <= untilDate && current <= maxDate) {
      const ds = format(current, 'yyyy-MM-dd');
      if (!exceptionSet.has(ds)) dates.push(ds);
      current = addDays(current, interval);
    }
  } else if (rule.frequency === 'weekly') {
    const daysOfWeek = rule.days_of_week?.length ? rule.days_of_week : [getDay(start)];
    let weekStart = start;
    
    while (dates.length < maxCount && weekStart <= untilDate && weekStart <= maxDate) {
      for (const dow of daysOfWeek.sort((a, b) => a - b)) {
        const currentDow = getDay(weekStart);
        let diff = dow - currentDow;
        if (diff < 0) diff += 7;
        const candidate = addDays(weekStart, diff);
        if (candidate < start) continue;
        if (candidate > untilDate || candidate > maxDate) break;
        if (dates.length >= maxCount) break;
        const ds = format(candidate, 'yyyy-MM-dd');
        if (!exceptionSet.has(ds)) dates.push(ds);
      }
      weekStart = addWeeks(weekStart, interval);
      // Reset to start of week (Sunday)
      const dayOfWeek = getDay(weekStart);
      weekStart = addDays(weekStart, -dayOfWeek);
    }
  } else if (rule.frequency === 'monthly') {
    let current = start;
    let monthCounter = 0;

    while (dates.length < maxCount && current <= untilDate && current <= maxDate) {
      const targetMonth = addMonths(start, monthCounter);
      let candidate: Date | null = null;

      if (rule.nth_weekday != null && rule.weekday_of_month != null) {
        // Nth weekday mode
        candidate = getNthWeekdayOfMonth(
          targetMonth.getFullYear(),
          targetMonth.getMonth(),
          rule.weekday_of_month,
          rule.nth_weekday
        );
      } else {
        // Day of month mode
        const dom = rule.day_of_month || getDate(start);
        const monthStart = startOfMonth(targetMonth);
        const lastDayOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();
        const actualDay = Math.min(dom, lastDayOfMonth);
        candidate = setDate(monthStart, actualDay);
      }

      if (candidate && candidate >= start && candidate <= untilDate && candidate <= maxDate) {
        const ds = format(candidate, 'yyyy-MM-dd');
        if (!exceptionSet.has(ds)) dates.push(ds);
      }

      current = candidate || addMonths(current, interval);
      monthCounter += interval;
    }
  } else if (rule.frequency === 'yearly') {
    let current = start;
    while (dates.length < maxCount && current <= untilDate && current <= maxDate) {
      const ds = format(current, 'yyyy-MM-dd');
      if (!exceptionSet.has(ds)) dates.push(ds);
      current = addYears(current, interval);
    }
  }

  return dates;
}

/**
 * Generate a human-readable description of a recurrence rule.
 */
export function describeRecurrenceRule(rule: RecurrenceRule, lang: 'en' | 'fr' = 'en'): string {
  const dayNames = lang === 'fr'
    ? ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const ordinals = lang === 'fr'
    ? ['', '1er', '2e', '3e', '4e']
    : ['', '1st', '2nd', '3rd', '4th'];

  const interval = rule.interval_value || 1;
  let desc = '';

  if (rule.frequency === 'daily') {
    desc = interval === 1
      ? (lang === 'fr' ? 'Chaque jour' : 'Every day')
      : (lang === 'fr' ? `Tous les ${interval} jours` : `Every ${interval} days`);
  } else if (rule.frequency === 'weekly') {
    const days = (rule.days_of_week || []).map(d => dayNames[d]).join(', ');
    if (interval === 1) {
      desc = lang === 'fr' ? `Chaque semaine` : `Every week`;
    } else {
      desc = lang === 'fr' ? `Toutes les ${interval} semaines` : `Every ${interval} weeks`;
    }
    if (days) desc += ` ${lang === 'fr' ? 'le' : 'on'} ${days}`;
  } else if (rule.frequency === 'monthly') {
    if (rule.nth_weekday != null && rule.weekday_of_month != null) {
      const nthLabel = rule.nth_weekday === -1
        ? (lang === 'fr' ? 'dernier' : 'last')
        : ordinals[rule.nth_weekday] || `${rule.nth_weekday}th`;
      const dayName = dayNames[rule.weekday_of_month];
      if (interval === 1) {
        desc = lang === 'fr'
          ? `Chaque mois le ${nthLabel} ${dayName}`
          : `Every month on the ${nthLabel} ${dayName}`;
      } else {
        desc = lang === 'fr'
          ? `Tous les ${interval} mois le ${nthLabel} ${dayName}`
          : `Every ${interval} months on the ${nthLabel} ${dayName}`;
      }
    } else {
      const dom = rule.day_of_month || '?';
      if (interval === 1) {
        desc = lang === 'fr' ? `Chaque mois le ${dom}` : `Every month on day ${dom}`;
      } else {
        desc = lang === 'fr'
          ? `Tous les ${interval} mois le ${dom}`
          : `Every ${interval} months on day ${dom}`;
      }
    }
  } else if (rule.frequency === 'yearly') {
    desc = interval === 1
      ? (lang === 'fr' ? 'Chaque année' : 'Every year')
      : (lang === 'fr' ? `Tous les ${interval} ans` : `Every ${interval} years`);
  }

  // End condition
  if (rule.end_type === 'after_count' && rule.end_count) {
    desc += lang === 'fr' ? `, ${rule.end_count} fois` : `, ${rule.end_count} times`;
  } else if (rule.end_type === 'until_date' && rule.end_date) {
    desc += lang === 'fr' ? `, jusqu'au ${rule.end_date}` : `, until ${rule.end_date}`;
  }

  return desc;
}
