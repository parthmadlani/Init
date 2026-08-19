import confetti from "canvas-confetti";

const BRAND_COLORS = ["#ff3d8a", "#00c2d1", "#111827"];

/**
 * Fired once, from the roadmap, when the last topic in a path is marked
 * complete — purely decorative, so it's skipped under prefers-reduced-motion
 * rather than gated behind it (nothing about the completion state depends
 * on it firing).
 */
export function fireCompletionConfetti() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  confetti({
    particleCount: 90,
    spread: 70,
    origin: { y: 0.7 },
    colors: BRAND_COLORS,
    ticks: 200,
  });
}
