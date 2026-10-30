/** A backward seek only counts after five seconds of visible replay. */
export function rewindDetector() {
  let previous: number | null = null, lastAt = 0, replayed = 0, pending = false, wasPlaying = false;
  function reset() { previous = null; pending = false; replayed = 0; wasPlaying = false; }
  return {
    reset,
    sample(position: number, now: number, playing: boolean, eligible = true) {
      if (!Number.isFinite(position) || !eligible) { reset(); return false; }
      const delta = previous === null ? 0 : position - previous;
      const elapsed = (now - lastAt) / 1000;
      // The 250ms poll can observe a 10-second button jump as slightly under 10s.
      if (previous !== null && delta <= -9.5) { pending = true; replayed = 0; }
      else if (pending) {
        if (elapsed > 2 || delta < -0.5 || delta > elapsed * 2.5 + 1) { pending = false; replayed = 0; }
        else if (playing && wasPlaying) replayed += Math.min(elapsed, Math.max(0, delta));
      }
      previous = position; lastAt = now; wasPlaying = playing;
      if (pending && replayed >= 5) { pending = false; replayed = 0; return true; }
      return false;
    },
  };
}
export const rewindWeight = (count: number) => Math.min(1.5, Math.max(0, count) * 0.5);
