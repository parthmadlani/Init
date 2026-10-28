"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { requestJson } from "@/lib/client-request";
export function FeedbackDetails({ resourceId, videoId, initialReaction }: { resourceId: string; videoId: string; initialReaction: "HELPFUL" | "NOT_HELPFUL" | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  return <details className="mt-4 rounded-2xl border border-black/10 bg-white p-5">
    <summary className="cursor-pointer text-sm font-medium">Help us improve this lesson</summary>
    <p className="mt-3 text-xs text-black/60">Your feedback goes to Init’s owner with your account name and this video. Please avoid personal or sensitive details.</p>
    <form className="mt-4 grid gap-4" onSubmit={async event => {
      event.preventDefault(); if (busy) return;
      const form = new FormData(event.currentTarget); setBusy(true); setMessage("");
      try { await requestJson("/api/v1/resource-feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resourceId, videoId, reaction: form.get("reaction"), reason: form.get("reason"), comment: form.get("comment") }) }); setMessage("Thank you. Your feedback is saved."); router.refresh(); }
      catch (error) { setMessage(error instanceof Error ? error.message : "Could not save feedback. Please retry."); }
      finally { setBusy(false); }
    }}>
      <label className="grid gap-2 text-sm">Was this video helpful?<select name="reaction" defaultValue={initialReaction ?? "HELPFUL"} className="rounded-xl border border-black/15 bg-white p-3"><option value="HELPFUL">Helpful</option><option value="NOT_HELPFUL">Not helpful</option></select></label>
      <label className="grid gap-2 text-sm">What stood out?<select name="reason" defaultValue="other" className="rounded-xl border border-black/15 bg-white p-3"><option value="clear">Clear explanation</option><option value="too_fast">Too fast</option><option value="too_slow">Too slow</option><option value="off_topic">Doesn’t match the topic</option><option value="outdated">Outdated content</option><option value="playback">Playback problem</option><option value="other">Something else</option></select></label>
      <label className="grid gap-2 text-sm">Anything else? (optional)<textarea name="comment" maxLength={1000} rows={3} className="rounded-xl border border-black/15 p-3" /></label>
      <button disabled={busy} className="justify-self-start rounded-xl bg-brand-dark px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Send feedback"}</button>
      <p role="status" className="text-sm">{message}</p>
    </form>
  </details>;
}
