"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { PRIMARY_CTA_CLASS } from "@/lib/ui";
import type { QuizView } from "@/lib/learning/types";

export function StartQuiz({ pathId, kind, topicId, startSeconds, endSeconds, label, compact = false }: {
  pathId: string; kind: "revision" | "final" | "lesson"; topicId?: string;
  startSeconds?: number; endSeconds?: number; label: string; compact?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [personalized, setPersonalized] = useState(true);
  const [error, setError] = useState("");
  const lock = useRef(false);
  async function start() {
    if (lock.current) return;
    lock.current = true; setPending(true); setError("");
    try {
      const response = await fetch("/api/v1/quizzes", { method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(30000), body: JSON.stringify({ pathId, kind, topicId, startSeconds, endSeconds, personalized }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not start. Please retry.");
      router.push(`/quizzes/${(data as QuizView).id}`);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not start. Please retry."); }
    finally { lock.current = false; setPending(false); }
  }
  return <div>
    {!compact && <label className="mb-4 flex items-start gap-2 text-xs leading-relaxed text-black/65"><input type="checkbox" checked={personalized} onChange={e => setPersonalized(e.target.checked)} className="mt-0.5 accent-brand-pink" />Focus extra revision on topics I missed, felt unsure about, or replayed. Turn off for balanced selection among equally fresh questions.</label>}
    <button onClick={start} disabled={pending} className={`${compact ? "inline-flex min-h-11 items-center gap-2 rounded-control border border-brand-pink/25 bg-white px-4 py-2 text-xs font-semibold text-brand-pink hover:bg-brand-pink-light/30" : `${PRIMARY_CTA_CLASS} w-full px-5 py-3 text-sm`}`}>
      {pending ? <><LoaderCircle size={15} className="animate-spin" />Opening…</> : <>{label}<ArrowRight size={15} /></>}
    </button>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
  </div>;
}
