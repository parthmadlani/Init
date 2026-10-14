"use client";

import { useEffect, useRef, useState } from "react";
import { requestJson } from "@/lib/client-request";
import { useRouter } from "next/navigation";
import { PRIMARY_CTA_CLASS } from "@/lib/ui";
import { BootSequence } from "@/components/boot-sequence";

type Subject = { id: string; name: string; topicCount: number };

const GOAL_TYPES = [
  { value: "PLACEMENT", label: "Placement prep", hint: "Interviews, DSA, core CS" },
  { value: "SEMESTER", label: "Semester exams", hint: "University coursework" },
  { value: "PROJECT", label: "Building a project", hint: "Learn just enough to ship" },
  { value: "SKILL", label: "General skill-up", hint: "No deadline, just learning" },
] as const;

const LEVELS = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
] as const;

const TIME_OPTIONS = [30, 60, 120, 180];

const STEPS = ["subject", "purpose", "level", "time", "notes"] as const;
type Step = (typeof STEPS)[number];

type SkipSuggestion = { topicId: string; name: string };

export function WizardForm({ subjects, initialSubjectId }: { subjects: Subject[]; initialSubjectId?: string }) {
  const router = useRouter();
  const submitLock = useRef(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [subjectId, setSubjectId] = useState<string | null>(subjects.some((subject) => subject.id === initialSubjectId) ? initialSubjectId! : null);
  const [type, setType] = useState<(typeof GOAL_TYPES)[number]["value"] | null>(null);
  const [level, setLevel] = useState<(typeof LEVELS)[number]["value"] | null>(null);
  const [dailyMinutes, setDailyMinutes] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resolved, setResolved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingNotes, setCheckingNotes] = useState(false);
  const [skipSuggestions, setSkipSuggestions] = useState<SkipSuggestion[] | null>(null);
  const [checkedSkipIds, setCheckedSkipIds] = useState<Set<string>>(new Set());

  const step: Step = STEPS[stepIndex];
  const canAdvance =
    (step === "subject" && subjectId) ||
    (step === "purpose" && type) ||
    (step === "level" && level) ||
    (step === "time" && dailyMinutes) ||
    step === "notes";
  const selectedSubject = subjects.find((s) => s.id === subjectId);

  async function submit(skipTopicIds?: string[]) {
    if (submitLock.current) return;
    submitLock.current = true;
    setSubmitting(true);
    setResolved(false);
    setError(null);
    try {
      const body = await requestJson<{ path: { id: string } }>("/api/v1/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId, type, level, dailyMinutes, notes: notes || undefined, skipTopicIds }),
        signal: AbortSignal.timeout(60_000),
      });
      if (!body?.path?.id) throw new Error("Could not confirm your path. Check your dashboard before retrying.");
      setResolved(true);
      router.push(`/paths/${body.path.id}`);
    } catch (error) {
      setError(error instanceof Error && error.name !== "TimeoutError"
        ? error.message : "This is taking longer than expected. Check your dashboard or retry; your choices are still here.");
      setSubmitting(false);
      submitLock.current = false;
    }
  }

  // Optional enrichment (Build Spec v2 Phase 06) — only runs when the learner
  // wrote something. Any failure (no AI key, network, empty result) just
  // falls straight through to the unchanged fixed submit path.
  async function handleNotesContinue() {
    if (checkingNotes || submitLock.current) return;
    if (!notes.trim()) {
      submit();
      return;
    }
    setCheckingNotes(true);
    const suggestions = await fetch("/api/v1/wizard/notes-suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjectId, notes }),
      signal: AbortSignal.timeout(12_000),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => (body?.suggestions as SkipSuggestion[]) ?? [])
      .catch(() => []);
    setCheckingNotes(false);

    if (suggestions.length > 0) {
      setSkipSuggestions(suggestions);
      setCheckedSkipIds(new Set());
    } else {
      submit();
    }
  }

  function toggleSkipId(topicId: string) {
    setCheckedSkipIds((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });
  }

  if (submitting && selectedSubject && level && dailyMinutes) {
    return (
      <BootSequence subjectName={selectedSubject.name} level={level} dailyMinutes={dailyMinutes} resolved={resolved} />
    );
  }

  if (skipSuggestions) {
    return (
      <div className="animate-step-in motion-reduce:animate-none">
        <StepShell
          title="Already know some of this?"
          subtitle="Based on your notes, you might already know these — check any you'd like to skip. Nothing's selected by default."
        >
          <div className="flex flex-col gap-2">
            {skipSuggestions.map((s) => (
              <label
                key={s.topicId}
                className={`flex cursor-pointer items-center gap-3 rounded-control border p-4 transition duration-150 ${
                  checkedSkipIds.has(s.topicId)
                    ? "border-brand-pink bg-brand-pink-light/50"
                    : "border-black/10 hover:border-black/25"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checkedSkipIds.has(s.topicId)}
                  onChange={() => toggleSkipId(s.topicId)}
                  className="h-4 w-4 shrink-0 accent-brand-pink"
                />
                <span className="font-semibold text-brand-dark">{s.name}</span>
              </label>
            ))}
          </div>
        </StepShell>
        {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
        <div className="mt-8 flex justify-between">
          <button
            onClick={() => setSkipSuggestions(null)}
            className="rounded-control px-4 py-2.5 text-sm font-semibold text-black/65"
          >
            Back
          </button>
          <button onClick={() => submit([...checkedSkipIds])} className={`px-5 py-2.5 text-sm ${PRIMARY_CTA_CLASS}`}>
            Build my path →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div role="progressbar" aria-label="Path setup" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={stepIndex + 1} className="mb-1.5 flex gap-1.5">
        {STEPS.map((s, i) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= stepIndex ? "bg-brand-pink" : "bg-black/10"}`} />
        ))}
      </div>
      <p className="mb-6 text-[11px] text-black/65">
        [step {stepIndex + 1}/{STEPS.length}]
      </p>

      <div key={step} className="animate-step-in motion-reduce:animate-none">
      {step === "subject" && (
        <StepShell title="What do you want to learn?">
          <div className="flex flex-col gap-2">
            {subjects.map((s) => (
              <OptionCard
                key={s.id}
                selected={subjectId === s.id}
                onClick={() => setSubjectId(s.id)}
                label={s.name}
                hint={`${s.topicCount} topics`}
              />
            ))}
          </div>
        </StepShell>
      )}

      {step === "purpose" && (
        <StepShell title="What's it for?">
          <div className="flex flex-col gap-2">
            {GOAL_TYPES.map((g) => (
              <OptionCard
                key={g.value}
                selected={type === g.value}
                onClick={() => setType(g.value)}
                label={g.label}
                hint={g.hint}
              />
            ))}
          </div>
        </StepShell>
      )}

      {step === "level" && (
        <StepShell title="Where are you starting from?">
          <div className="flex flex-col gap-2">
            {LEVELS.map((l) => (
              <OptionCard key={l.value} selected={level === l.value} onClick={() => setLevel(l.value)} label={l.label} />
            ))}
          </div>
        </StepShell>
      )}

      {step === "time" && (
        <StepShell title="How much time per day?">
          <div className="grid grid-cols-2 gap-2">
            {TIME_OPTIONS.map((m) => (
              <OptionCard
                key={m}
                selected={dailyMinutes === m}
                onClick={() => setDailyMinutes(m)}
                label={m < 60 ? `${m} min` : `${m / 60} hr${m > 60 ? "s" : ""}`}
              />
            ))}
          </div>
        </StepShell>
      )}

      {step === "notes" && (
        <StepShell title="Anything else about your goals?" subtitle="Optional — describe what you already know. When available, suggestions let you choose topics to skip.">
          <dl className="mb-5 grid grid-cols-2 gap-3 rounded-card bg-white p-4 text-sm">
            <div><dt className="text-black/65">Subject</dt><dd className="font-semibold">{selectedSubject?.name}</dd></div>
            <div><dt className="text-black/65">Goal</dt><dd className="font-semibold">{GOAL_TYPES.find((goal) => goal.value === type)?.label}</dd></div>
            <div><dt className="text-black/65">Level</dt><dd className="font-semibold">{LEVELS.find((item) => item.value === level)?.label}</dd></div>
            <div><dt className="text-black/65">Daily time</dt><dd className="font-semibold">{dailyMinutes} minutes</dd></div>
          </dl>
          <p className="mb-4 text-sm text-black/65">Your level guides video matching. Your daily time includes watching and suggested practice. Short videos are preferred; longer ones are split into blocks that stop automatically. Rebuilding a subject updates its path and keeps your topic progress.</p>
          <label htmlFor="learning-notes" className="mb-2 block text-sm font-semibold">What do you already know? (optional)</label>
          <textarea
            id="learning-notes"
            maxLength={1000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="e.g. I already know basic loops and functions"
            className="w-full rounded-control border border-black/15 p-3.5 text-sm outline-none focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20"
          />
        </StepShell>
      )}
      </div>

      {error && <p role="alert" className="mt-4 text-sm font-medium text-red-600">{error}</p>}

      <div className="mt-8 flex justify-between">
        <button
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          disabled={stepIndex === 0 || checkingNotes}
          className="rounded-control px-4 py-2.5 text-sm font-semibold text-black/65 disabled:opacity-0"
        >
          Back
        </button>
        {step === "notes" ? (
          <button
            onClick={handleNotesContinue}
            disabled={submitting || checkingNotes}
            className={`px-5 py-2.5 text-sm ${PRIMARY_CTA_CLASS}`}
          >
            {checkingNotes ? "Checking your notes…" : submitting ? "Building your path…" : "Build my path →"}
          </button>
        ) : (
          <button
            onClick={() => setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))}
            disabled={!canAdvance}
            className={`px-5 py-2.5 text-sm ${PRIMARY_CTA_CLASS}`}
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}

function StepShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [title]);
  return (
    <div>
      <h1 ref={heading} tabIndex={-1} className="font-serif text-3xl font-medium tracking-tight text-brand-dark focus:outline-none">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-black/65">{subtitle}</p>}
      <div className="mt-5">{children}</div>
    </div>
  );
}

function OptionCard({
  selected,
  onClick,
  label,
  hint,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-control border p-4 text-left transition duration-150 ${
        selected
          ? "border-brand-pink bg-brand-pink-light/50"
          : "border-black/10 hover:border-black/25 hover:bg-black/[0.02]"
      }`}
    >
      <div className="font-semibold text-brand-dark">{label}</div>
      {hint && <div className="text-xs text-black/65">{hint}</div>}
    </button>
  );
}
