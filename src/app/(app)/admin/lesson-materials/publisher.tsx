"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PRIMARY_CTA_CLASS } from "@/lib/ui";
export function MaterialPublisher() {
  const [text, setText] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  async function publish() {
    if (pending) return;
    setPending(true); setMessage("");
    try {
      const parsed = JSON.parse(text);
      const response = await fetch("/api/v1/lesson-packs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed), signal: AbortSignal.timeout(30000) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setMessage(result.message); setText(""); setConfirmed(false); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not publish."); }
    finally { setPending(false); }
  }
  return <section className="surface mt-7 max-w-3xl p-6"><label className="block text-sm font-semibold">Reviewed pack (.json)<input type="file" accept=".json,application/json" className="mt-3 block w-full text-sm" onChange={async e => { const file=e.target.files?.[0]; if (!file) return; if (file.size > 2_000_000) { setMessage("Choose a file smaller than 2 MB."); return; } setText(await file.text()); setConfirmed(false); }} /></label><label className="mt-5 block text-sm font-medium" htmlFor="pack-json">Preview the JSON before publishing</label><textarea id="pack-json" value={text} onChange={e => { setText(e.target.value); setConfirmed(false); }} className="mt-2 min-h-56 w-full rounded-xl border p-4 font-mono text-xs" /><label className="my-5 flex items-start gap-2 text-sm"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} className="mt-1 accent-brand-pink" />I checked permission, the transcript against the video, and all question answers and explanations.</label><button disabled={!confirmed || !text || pending} onClick={publish} className={`px-5 py-3 text-sm ${PRIMARY_CTA_CLASS}`}>{pending ? "Publishing…" : "Publish reviewed version"}</button>{message && <p role="status" className="mt-4 text-sm">{message}</p>}</section>;
}
