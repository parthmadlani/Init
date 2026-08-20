export type Status = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETE";

export const NEXT_STATUS: Record<Status, Status> = {
  NOT_STARTED: "IN_PROGRESS",
  IN_PROGRESS: "COMPLETE",
  COMPLETE: "NOT_STARTED",
};

export const STATUS_CIRCLE_STYLE: Record<Status, string> = {
  NOT_STARTED: "border-black/20 bg-white",
  IN_PROGRESS: "border-brand-cyan bg-brand-cyan-light",
  COMPLETE: "border-brand-cyan bg-brand-cyan text-white",
};

export const STATUS_LABEL: Record<Status, string> = {
  NOT_STARTED: "not started",
  IN_PROGRESS: "in progress",
  COMPLETE: "complete",
};

export const STATUS_PILL: Record<Status, string> = {
  NOT_STARTED: "bg-black/5 text-black/60",
  IN_PROGRESS: "bg-brand-cyan-light text-brand-cyan",
  COMPLETE: "bg-brand-pink-light text-brand-pink",
};

// A manual status click (no player involved) can't derive a real
// watched-seconds ratio, so it falls back to these fixed checkpoints —
// distinct from the continuous pct the embedded player reports.
export const MANUAL_TOGGLE_PCT: Record<Status, number> = {
  NOT_STARTED: 0,
  IN_PROGRESS: 50,
  COMPLETE: 100,
};
