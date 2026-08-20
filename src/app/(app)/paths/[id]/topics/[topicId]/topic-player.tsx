"use client";

import { useEffect, useRef } from "react";

// Minimal shape of the bits of the YouTube IFrame Player API this component
// actually calls — the full API has no first-party types package, and
// pulling in a community @types package for four methods isn't worth it.
type YTPlayer = {
  getCurrentTime: () => number;
  destroy: () => void;
};

type YTPlayerState = { PLAYING: number; PAUSED: number; ENDED: number };

type YTNamespace = {
  Player: new (
    elementId: string,
    options: {
      videoId: string;
      playerVars?: { start?: number; rel?: 0 | 1; modestbranding?: 0 | 1 };
      events?: {
        onStateChange?: (event: { data: number }) => void;
      };
    },
  ) => YTPlayer;
  PlayerState: YTPlayerState;
};

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytApiPromise: Promise<YTNamespace> | null = null;

function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT!);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
  });
  return ytApiPromise;
}

function sendHeartbeat(topicId: string, watchedSeconds: number, durationSeconds: number, useBeacon: boolean) {
  const payload = JSON.stringify({ topicId, watchedSeconds, durationSeconds });
  if (useBeacon && navigator.sendBeacon) {
    navigator.sendBeacon("/api/v1/progress/watch", new Blob([payload], { type: "application/json" }));
  } else {
    fetch("/api/v1/progress/watch", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true }).catch(
      () => {},
    );
  }
}

const POLL_INTERVAL_MS = 5000;
const HEARTBEAT_INTERVAL_MS = 15000;

/**
 * Embeds the YouTube player and reports real watch progress — the "furthest
 * timestamp reached" heuristic (see recordWatchProgress in progress-service.ts):
 * cheap to implement, resistant to scrubbing-to-the-end, and good enough
 * without needing full watched-range tracking.
 */
export function TopicPlayer({
  topicId,
  youtubeVideoId,
  durationSeconds,
  initialWatchedSeconds,
  onProgress,
}: {
  topicId: string;
  youtubeVideoId: string;
  durationSeconds: number;
  initialWatchedSeconds: number;
  onProgress?: (pct: number) => void;
}) {
  const containerId = `yt-player-${topicId}`;
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  useEffect(() => {
    let destroyed = false;
    let player: YTPlayer | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    let furthest = initialWatchedSeconds;

    function flush(useBeacon = false) {
      const watched = Math.round(furthest);
      if (watched <= 0) return;
      sendHeartbeat(topicId, watched, durationSeconds, useBeacon);
      onProgressRef.current?.(Math.min(100, Math.round((watched / durationSeconds) * 100)));
    }

    function stopTimers() {
      if (pollTimer) clearInterval(pollTimer);
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      pollTimer = null;
      heartbeatTimer = null;
    }

    function startTimers() {
      stopTimers();
      pollTimer = setInterval(() => {
        const current = player?.getCurrentTime() ?? 0;
        if (current > furthest) furthest = current;
      }, POLL_INTERVAL_MS);
      heartbeatTimer = setInterval(() => flush(), HEARTBEAT_INTERVAL_MS);
    }

    function handleVisibility() {
      if (document.visibilityState === "hidden") flush(true);
    }
    function handlePageHide() {
      flush(true);
    }

    loadYouTubeApi().then((YT) => {
      if (destroyed) return;
      player = new YT.Player(containerId, {
        videoId: youtubeVideoId,
        playerVars: { start: Math.max(0, Math.floor(initialWatchedSeconds) - 2), rel: 0, modestbranding: 1 },
        events: {
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.PLAYING) {
              startTimers();
            } else {
              stopTimers();
              if (event.data === YT.PlayerState.ENDED) furthest = durationSeconds;
              flush();
            }
          },
        },
      });
    });

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      destroyed = true;
      stopTimers();
      flush(true);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handlePageHide);
      player?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId, youtubeVideoId, durationSeconds]);

  return <div id={containerId} className="aspect-video w-full overflow-hidden rounded-card bg-black" />;
}
