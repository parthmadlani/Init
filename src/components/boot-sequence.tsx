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
 * write) — this isn't decorative copy. Reveal timing is staged/simulated
 * rather than server-pushed (the API is one request, not a stream), so
 * lines 1-3 advance on a fixed clock and then hold on "matching resources"
 * — the genuinely slow step, gated on YouTube — until `resolved` flips.
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
  const slug = subjectName.toLowerCase().replace(/\s+/g, "-");

  return (
    <div
      className="rounded-card border border-black/10 bg-brand-dark p-5 font-mono text-[13px] leading-[1.7] text-white/90"
      role="status"
      aria-live="polite"
    >
      <Line show={step >= 0}>
        <span className="text-brand-pink">$</span> init --subject={slug} --level={level.toLowerCase()} --daily=
        {dailyMinutes}m
      </Line>
      <Line show={step >= 1} dim>
        &gt; resolving topic graph<Done show={step >= 1} />
      </Line>
      <Line show={step >= 2} dim>
        &gt; matching resources<Done show={step >= 4} pending={step >= 2 && step < 4} />
      </Line>
      <Line show={step >= 4} dim>
        &gt; writing path<Done show={step >= 4} />
      </Line>
      <Line show={step >= 4}>
        path ready.<Cursor />
      </Line>
    </div>
  );
}

function Line({ show, dim, children }: { show: boolean; dim?: boolean; children: React.ReactNode }) {
  if (!show) return null;
  return <div className={dim ? "text-white/55" : ""}>{children}</div>;
}

function Done({ show, pending }: { show: boolean; pending?: boolean }) {
  if (show) return <span className="text-brand-cyan">... done</span>;
  if (pending) return <span className="text-white/40">...</span>;
  return null;
}

function Cursor() {
  return <span className="ml-1 inline-block h-[13px] w-[7px] translate-y-[1px] animate-pulse bg-brand-pink motion-reduce:animate-none" />;
}
