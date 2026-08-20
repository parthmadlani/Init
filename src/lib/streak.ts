type DayCount = { date: string; count: number };

/**
 * Consecutive active days ending today. If today has no activity yet, it
 * doesn't break the streak (the day isn't over) — but a gap of two or more
 * days does. `days` must be oldest-first, ending today (as returned by
 * getActivityCalendar).
 */
export function computeCurrentStreak(days: DayCount[]): number {
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) {
      streak++;
    } else if (i === days.length - 1) {
      continue;
    } else {
      break;
    }
  }
  return streak;
}
