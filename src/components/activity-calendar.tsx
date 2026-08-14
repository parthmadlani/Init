type DayCount = { date: string; count: number };

function levelFor(count: number) {
  if (count === 0) return "bg-black/[0.06]";
  if (count === 1) return "bg-brand-cyan-light";
  if (count <= 3) return "bg-brand-cyan/60";
  return "bg-brand-cyan";
}

/** GitHub-style contribution calendar — see Build Spec v2 §05 (ActivityLog). */
export function ActivityCalendar({ days }: { days: DayCount[] }) {
  // Pad to a full week grid, Sunday-first, so columns line up.
  const first = days[0];
  const firstDow = first ? new Date(first.date).getUTCDay() : 0;
  const padded: (DayCount | null)[] = [...Array(firstDow).fill(null), ...days];

  const weeks: (DayCount | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }

  const totalActive = days.filter((d) => d.count > 0).length;

  return (
    <div>
      <div className="flex gap-[3px] overflow-x-auto pb-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day, di) =>
              day ? (
                <div
                  key={di}
                  title={`${day.date} — ${day.count} ${day.count === 1 ? "update" : "updates"}`}
                  className={`h-[11px] w-[11px] rounded-[2px] ${levelFor(day.count)}`}
                />
              ) : (
                <div key={di} className="h-[11px] w-[11px]" />
              ),
            )}
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-black/45">{totalActive} active days in the last {days.length}</p>
    </div>
  );
}
