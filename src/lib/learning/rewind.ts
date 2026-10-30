/** A backward seek only counts after five seconds of continuous, visible replay. */
export function rewindDetector() {
  let previous: number | null = null, lastAt = 0, replayed = 0, pending = false;
  return {
    reset() { previous = null; pending = false; replayed = 0; },
    sample(position: number, now: number, playing: boolean) {
      if (!Number.isFinite(position) || !playing) { previous = null; pending = false; replayed = 0; return false; }
      const delta = previous === null ? 0 : position - previous;
      const elapsed = (now - lastAt) / 1000;
      if (previous !== null && delta <= -10) { pending = true; replayed = 0; }
      else if (pending) {
        if (elapsed > 2 || delta < 0 || delta > elapsed * 2.5 + 1) { pending = false; replayed = 0; }
        else replayed += Math.min(elapsed, Math.max(0, delta));
      }
      previous = position; lastAt = now;
      if (pending && replayed >= 5) { pending = false; replayed = 0; return true; }
      return false;
    },
  };
}
export const rewindWeight = (count: number) => Math.min(1.5, Math.max(0, count) * 0.5);
