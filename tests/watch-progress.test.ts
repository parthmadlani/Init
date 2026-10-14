import test from "node:test";
import assert from "node:assert/strict";
import { deriveWatchProgress } from "../src/lib/watch-progress";

test("rewatching does not undo a manually completed lesson", () => {
  assert.deepEqual(deriveWatchProgress({ watchedSeconds: 0, pct: 100, status: "COMPLETE" }, 15, 600),
    { watchedSeconds: 15, pct: 100, status: "COMPLETE" });
});

test("rewinding preserves saved progress", () => {
  assert.deepEqual(deriveWatchProgress({ watchedSeconds: 300, pct: 50, status: "IN_PROGRESS" }, 15, 600),
    { watchedSeconds: 300, pct: 50, status: "IN_PROGRESS" });
});

test("a reset lesson can start fresh and reaches completion at ninety percent", () => {
  assert.equal(deriveWatchProgress({ watchedSeconds: 0, pct: 0, status: "NOT_STARTED" }, 15, 600).pct, 3);
  assert.equal(deriveWatchProgress(null, 540, 600).status, "COMPLETE");
  assert.equal(deriveWatchProgress(null, 530, 600).status, "IN_PROGRESS");
});
