"use client";
import { sendActivity } from "@/lib/insights/client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { requestJson } from "@/lib/client-request";

type YTPlayer = { getCurrentTime: () => number; seekTo: (seconds: number, allowSeekAhead: boolean) => void; pauseVideo: () => void; destroy: () => void };
type YTNamespace = {
  Player: new (element: HTMLElement, options: {
    width?: string; height?: string; videoId: string;
    playerVars?: { start?: number; end?: number; rel?: 0 | 1 };
    events?: { onReady?: () => void; onError?: () => void; onStateChange?: (event: { data: number }) => void };
  }) => YTPlayer;
  PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
};
declare global {
  interface Window { YT?: YTNamespace; onYouTubeIframeAPIReady?: () => void }
}

let ytApiPromise: Promise<YTNamespace> | null = null;
function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise<YTNamespace>((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    const script = document.createElement("script");
    const timeout = setTimeout(() => { script.remove(); reject(new Error("Player timed out")); }, 15_000);
    window.onYouTubeIframeAPIReady = () => {
      clearTimeout(timeout);
      previous?.();
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error("Player unavailable"));
    };
    script.src = "https://www.youtube.com/iframe_api";
    script.onerror = () => { clearTimeout(timeout); script.remove(); reject(new Error("Player unavailable")); };
    document.head.appendChild(script);
  }).catch((error) => { ytApiPromise = null; throw error; });
  return ytApiPromise;
}

/** Saves playback position, not a claim that every preceding second was watched. */
export function TopicPlayer({ topicId, youtubeVideoId, durationSeconds, initialWatchedSeconds, onProgress, suspendRecording = false, startSeconds, endSeconds, practiceMinutes, practice, pathId, seekRequest }: {
  seekRequest?: { seconds: number; nonce: number } | null;
  topicId: string; youtubeVideoId: string; durationSeconds: number; initialWatchedSeconds: number;
  onProgress?: (pct: number) => void; suspendRecording?: boolean;
  startSeconds: number; endSeconds: number; practiceMinutes: number; practice: string; pathId: string;
}) {
  const seekWithinBlock = useRef<((seconds: number) => void) | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const onProgressRef = useRef(onProgress);
  const suspendedRef = useRef(suspendRecording);
  const [error, setError] = useState(false);
  const [blockFinished, setBlockFinished] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => { if (seekRequest) seekWithinBlock.current?.(seekRequest.seconds); }, [seekRequest]);
  useEffect(() => { onProgressRef.current = onProgress; }, [onProgress]);
  useEffect(() => { suspendedRef.current = suspendRecording; }, [suspendRecording]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let destroyed = false;
    let player: YTPlayer | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    let furthest = initialWatchedSeconds;
    let lastSaved = initialWatchedSeconds;
    let saving = false;
    let finished = false;
    let lastFlushAt = 0;
    seekWithinBlock.current = (seconds) => {
      if (!player || destroyed) return;
      finished = false;
      setBlockFinished(false);
      player.seekTo(Math.min(endSeconds - 1, Math.max(startSeconds, seconds)), true);
    };
    const mount = document.createElement("div");
    host.replaceChildren(mount);

    function sample() {
      const current = player?.getCurrentTime() ?? 0;
      furthest = Math.max(furthest, Math.min(durationSeconds, endSeconds, current));
    }
    async function flush(beacon = false) {
      if (suspendedRef.current) return;
      const watchedSeconds = Math.floor(furthest);
      if (watchedSeconds <= lastSaved || watchedSeconds <= 0) return;
      const body = JSON.stringify({ topicId, watchedSeconds, durationSeconds });
      if (beacon) {
        if (!navigator.sendBeacon?.("/api/v1/progress/watch", new Blob([body], { type: "application/json" }))) {
          void fetch("/api/v1/progress/watch", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
        }
        return;
      }
      if (saving || destroyed) return;
      saving = true;
      let saved = false;
      setSaveState("saving");
      try {
        const result = await requestJson<{ progress: { pct: number } }>("/api/v1/progress/watch", {
          method: "POST", headers: { "Content-Type": "application/json" }, body,
        });
        if (typeof result?.progress?.pct !== "number") throw new Error("Invalid progress response");
        lastSaved = watchedSeconds;
        saved = true;
        if (!destroyed && !suspendedRef.current) {
          onProgressRef.current?.(result.progress.pct);
          setSaveState("saved");
        }
      } catch {
        if (!destroyed) setSaveState("error");
      } finally {
        saving = false;
        if (saved && finished && !destroyed && Math.floor(furthest) > lastSaved) void flush();
      }
    }
    function stopTimer() { if (timer) clearInterval(timer); timer = null; }
    function finishBlock() {
      if (finished || destroyed) return;
      finished = true;
      stopTimer();
      sample();
      player?.pauseVideo();
      setBlockFinished(true);
      void flush();
    }
    function tick() {
      sample();
      if ((player?.getCurrentTime() ?? 0) >= endSeconds) { finishBlock(); return; }
      if (Date.now() - lastFlushAt >= 15_000) { lastFlushAt = Date.now(); void flush(); }
    }
    function saveBeforeLeaving() { sample(); void flush(true); }
    function handleVisibility() { if (document.visibilityState === "hidden") saveBeforeLeaving(); }
    function handleOnline() { void flush(); }
    const readyTimeout = setTimeout(() => { if (!destroyed) setError(true); }, 20_000);
    loadYouTubeApi().then((YT) => {
      if (destroyed) return;
      player = new YT.Player(mount, {
        width: "100%", height: "100%", videoId: youtubeVideoId,
        playerVars: { start: startSeconds, end: endSeconds, rel: 0 },
        events: {
          onReady: () => { clearTimeout(readyTimeout); if (!destroyed) setError(false); },
          onError: () => { sendActivity("VIDEO_ERROR", youtubeVideoId); clearTimeout(readyTimeout); stopTimer(); if (!destroyed) setError(true); },
          onStateChange: (event) => {
            if (destroyed) return;
            sample();
            stopTimer();
            if (event.data === YT.PlayerState.PLAYING) {
              sendActivity("VIDEO_PLAY", youtubeVideoId);
              if (finished) { player?.pauseVideo(); return; }
              lastFlushAt = Date.now();
              timer = setInterval(tick, 250);
            } else if (event.data === YT.PlayerState.ENDED) { finishBlock(); }
            else { void flush(); }
          },
        },
      });
    }).catch(() => { clearTimeout(readyTimeout); if (!destroyed) setError(true); });
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", saveBeforeLeaving);
    window.addEventListener("online", handleOnline);
    return () => {
      saveBeforeLeaving(); destroyed = true; stopTimer(); clearTimeout(readyTimeout);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", saveBeforeLeaving);
      window.removeEventListener("online", handleOnline);
      player?.destroy();
      seekWithinBlock.current = null;
      host.replaceChildren();
    };
    // A resume update must not recreate an active player while someone is watching.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId, youtubeVideoId, durationSeconds, startSeconds, endSeconds, attempt]);

  return (
    <div>
      <div className="relative aspect-video w-full overflow-hidden rounded-card bg-black">
        <div ref={hostRef} className="absolute inset-0 [&_iframe]:h-full [&_iframe]:w-full" />
        {error && <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-brand-dark p-4 text-center text-sm text-white">
          <p>The video could not load. Try again or open it on YouTube.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <button type="button" onClick={() => { setError(false); setBlockFinished(false); setAttempt((value) => value + 1); }} className="min-h-11 rounded-control border px-4">Retry player</button>
            <a href={`https://www.youtube.com/watch?v=${youtubeVideoId}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center underline">Open YouTube ↗</a>
          </div>
        </div>}
      </div>
      {blockFinished && <section role="status" className="mt-4 rounded-card border border-brand-cyan/30 bg-white p-4">
        <h3 className="font-semibold">Watch block finished — time to practice</h3>
        <p className="mt-2 text-sm">Spend about {practiceMinutes} minutes: {practice}</p>
        <p className="mt-2 text-xs text-black/65">Practice is suggested; it is not marked complete automatically. You can also open the Video quiz tab below for a reviewed check, when available.</p>
        <Link href={`/paths/${pathId}`} className="mt-3 inline-flex min-h-11 items-center font-semibold text-brand-pink underline">Back to my plan →</Link>
      </section>}
      <p role="status" className="mt-2 text-xs text-black/65">
        {saveState === "error" ? "Progress could not be saved. It will retry during playback or when your connection returns."
          : saveState === "saving" ? "Saving progress…" : saveState === "saved" ? "Progress saved" : "Progress saves while you play."}
      </p>
    </div>
  );
}
