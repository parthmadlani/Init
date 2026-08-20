"use client";

import { useState } from "react";
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

export function WizardForm({ subjects }: { subjects: Subject[] }) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [subjectId, setSubjectId] = useState<string | null>(null);
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
    setSubmitting(true);
    setResolved(false);
    setError(null);
    const res = await fetch("/api/v1/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjectId, type, level, dailyMinutes, notes: notes || undefined, skipTopicIds }),
    });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error ?? "Something went wrong");
      setSubmitting(false);
      return;
    }
    setResolved(true);
    // Let "path ready." land on screen for a beat before navigating away.
    await new Promise((resolve) => setTimeout(resolve, 650));
    router.push(`/paths/${body.path.id}`);
  }

  // Optional enrichment (Build Spec v2 Phase 06) — only runs when the learner
  // wrote something. Any failure (no AI key, network, empty result) just
  // falls straight through to the unchanged fixed submit path.
  async function handleNotesContinue() {
    if (!notes.trim()) {
      submit();
      return;
    }
    setCheckingNotes(true);
    const suggestions = await fetch("/api/v1/wizard/notes-suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjectId, notes }),
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
                className={`flex cursor-pointer items-center gap-3 rounded-card border-2 p-4 transition duration-150 ${
                  checkedSkipIds.has(s.topicId)
                    ? "border-brand-pink bg-brand-pink-light/40"
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
      <div className="mb-1.5 flex gap-1.5">
        {STEPS.map((s, i) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= stepIndex ? "bg-brand-pink" : "bg-black/10"}`} />
        ))}
      </div>
      <p className="mb-6 font-mono text-[11px] text-black/65">
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
        <StepShell title="Anything else about your goals?" subtitle="Optional — helps future tuning, never required.">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="e.g. I already know basic loops and functions"
            className="w-full rounded-control border border-black/15 p-3.5 text-sm outline-none focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20"
          />
        </StepShell>
      )}
      </div>

      {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}

      <div className="mt-8 flex justify-between">
        <button
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          disabled={stepIndex === 0}
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
  return (
    <div>
      <h1 className="font-serif text-display font-bold text-brand-dark">{title}</h1>
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
      className={`rounded-card border-2 p-4 text-left transition duration-150 ${
        selected
          ? "border-brand-pink bg-brand-pink-light/40"
          : "border-black/10 hover:-translate-y-0.5 hover:border-brand-cyan hover:shadow-[0_8px_20px_-6px_rgba(0,194,209,0.45)]"
      }`}
    >
      <div className="font-semibold text-brand-dark">{label}</div>
      {hint && <div className="text-xs text-black/65">{hint}</div>}
    </button>
  );
}
