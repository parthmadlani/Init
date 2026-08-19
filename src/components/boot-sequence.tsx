"use client";

import { useEffect, useState } from "react";

type Props = {
  subjectName: string;
  level: string;
  dailyMinutes: number;
  /** Flips true once the actual request has resolved (success or error). */
  resolved: boolean;
};

const STEP_DELAY_MS = 420;

/**
 * Each line names a real step createGoalWithPath performs (topic graph
 * read, ensureResourcesForPath's SearchCache-backed matching, the path
 * write), just in plain language rather than the CLI-flag syntax this
 * used to show — that read as raw backend output to anyone outside the
 * target dev-portfolio audience. Reveal timing is staged/simulated rather
 * than server-pushed (the API is one request, not a stream), so lines 1-3
 * advance on a fixed clock and then hold on "finding videos" — the
 * genuinely slow step, gated on YouTube — until `resolved` flips.
 *
 * Styled as a white card with the same hard-shadow border as every other
 * elevated surface (hero card, alert-dialog, toast).
 */
export function BootSequence({ subjectName, level, dailyMinutes, resolved }: Props) {
  const [timedStep, setTimedStep] = useState(0);

  useEffect(() => {
    if (timedStep >= 2) return;
    const timer = setTimeout(() => setTimedStep((s) => s + 1), STEP_DELAY_MS);
    return () => clearTimeout(timer);
  }, [timedStep]);

  // Lines 1-2 advance on a fixed clock; the request resolving jumps
  // straight to the end regardless of where the clock had gotten to.
  const step = resolved ? 4 : timedStep;

  return (
    <div
      className="rounded-card border-2 border-brand-dark bg-white p-5 font-mono text-[13px] leading-[1.7] text-brand-dark/80 shadow-[3px_3px_0_#111827]"
      role="status"
      aria-live="polite"
    >
      <Line show={step >= 0}>
        Personalizing your <span className="font-semibold text-brand-pink">{subjectName}</span> path for your{" "}
        {level.toLowerCase()} level…
      </Line>
      <Line show={step >= 1} dim>
        &gt; mapping out your topics<Done show={step >= 1} />
      </Line>
      <Line show={step >= 2} dim>
        &gt; finding videos that fit your {dailyMinutes}-minute days<Done show={step >= 4} pending={step >= 2 && step < 4} />
      </Line>
      <Line show={step >= 4} dim>
        &gt; saving your path<Done show={step >= 4} />
      </Line>
      <Line show={step >= 4}>
        Your path is ready!<Cursor />
      </Line>
    </div>
  );
}

function Line({ show, dim, children }: { show: boolean; dim?: boolean; children: React.ReactNode }) {
  if (!show) return null;
  return <div className={dim ? "text-black/65" : "text-brand-dark"}>{children}</div>;
}

function Done({ show, pending }: { show: boolean; pending?: boolean }) {
  if (show) return <span className="font-semibold text-brand-pink">… done</span>;
  if (pending) return <span className="text-black/65">…</span>;
  return null;
}

function Cursor() {
  return <span className="ml-1 inline-block h-[13px] w-[7px] translate-y-[1px] animate-pulse bg-brand-pink motion-reduce:animate-none" />;
}
