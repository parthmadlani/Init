import test from "node:test";
import assert from "node:assert/strict";
import { hasNegativeConsensus, matchesTopic, pickBestCandidate } from "../src/lib/resource-ranking";
import { buildStudyPlan, lessonWindow, studyBudget, type StudyTopic } from "../src/lib/study-plan";
import { safeReturnTo } from "../src/lib/safe-redirect";

const candidate = (videoId: string, title: string, durationSeconds = 600, popular = true) => ({
  videoId, title, durationSeconds, channelName: "Test creator", channelId: "test-channel",
  viewCount: popular ? 2_000_000 : 1000, subscriberCount: popular ? 1_000_000 : 100,
});

test("negative consensus excludes rejected matches without treating a tie as rejection", () => {
  assert.equal(hasNegativeConsensus(0, 2), false);
  assert.equal(hasNegativeConsensus(1, 3), true);
  assert.equal(hasNegativeConsensus(3, 3), false);
});

test("fundamentals rejects the exact functions video found in the audit", () => {
  assert.equal(matchesTopic("Functions in Python are easy 📞", "Python Fundamentals", "Python"), false);
  assert.equal(matchesTopic("Python Tutorial for Beginners 8: Functions", "Python Fundamentals", "Python"), false);
});

test("an on-topic smaller channel beats an unrelated popular short video", () => {
  const result = pickBestCandidate([
    candidate("wrong", "Functions in Python are easy", 660),
    candidate("right", "Python for Beginners - Learn Coding with Python in 1 Hour", 3600, false),
  ], "Python Fundamentals", "BEGINNER", 30, null, null, "Python");
  assert.equal(result?.videoId, "right");
});

test("fallback tiers never relax topical relevance", () => {
  assert.equal(pickBestCandidate([candidate("wrong", "Python functions", 10000, false)], "Python Fundamentals", "BEGINNER", 30, null, null, "Python"), null);
});

test("foundations can use a broad introductory course", () => {
  assert.equal(matchesTopic("Python Crash Course for Beginners", "Python Fundamentals", "Python"), true);
  assert.equal(matchesTopic("JavaScript Crash Course for Beginners", "Python Fundamentals", "Python"), false);
});

for (const [topic, title] of [
  ["Variables & Data Types", "Variables and Data Types | Python Tutorial - Day #6"],
  ["Control Flow", "#19 Python Tutorial for Beginners | If Elif Else Statement in Python"],
  ["Functions", "Python Tutorial for Beginners 8: Functions"],
  ["Data Structures", "Data Structures & Algorithms Tutorial in Python"],
  ["Object-Oriented Programming", "Object-Oriented Programming, Simplified"],
  ["File Handling", "Python Tutorial: File Objects - Reading and Writing to Files"],
  ["Exception Handling", "#63 Python Tutorial for Beginners | Exception Handling"],
  ["Modules & Packages", "Import Modules and Exploring The Standard Library"],
  ["Working with APIs", "Create A Python API in 12 Minutes"],
]) test(`topic matching accepts the relevant ${topic} lesson`, () => assert.equal(matchesTopic(title, topic, "Python"), true));

test("shorts and explicitly excluded videos cannot win", () => {
  assert.equal(pickBestCandidate([candidate("short", "Python Fundamentals", 45), candidate("excluded", "Python basics")], "Python Fundamentals", "BEGINNER", 30, null, "excluded", "Python"), null);
});

test("a thirty-minute budget prefers a twenty-minute lesson over a popular ninety-minute video", () => {
  const result = pickBestCandidate([
    candidate("long", "Python Fundamentals for Beginners", 5400),
    candidate("short", "Python Fundamentals for Beginners", 1200, false),
  ], "Python Fundamentals", "BEGINNER", 30, null, null, "Python");
  assert.equal(result?.videoId, "short");
});

test("ranking reserves practice time instead of filling all thirty minutes with video", () => {
  const result = pickBestCandidate([
    candidate("no-practice", "Python Functions for Beginners", 1800),
    candidate("fits", "Python Functions for Beginners", 1380, false),
  ], "Functions", "BEGINNER", 30, null, null, "Python");
  assert.equal(result?.videoId, "fits");
});

test("a ninety-minute fallback is four bounded sessions, never one ninety-minute assignment", () => {
  const plan = buildStudyPlan([topic("long", 5400)], 30);
  assert.deepEqual(plan.sessions.map(s => s.totalMinutes), [30, 30, 30, 28]);
  assert.deepEqual(plan.sessions.map(s => s.lessons[0].endSeconds), [1380, 2760, 4140, 5400]);
  assert.equal(studyBudget(30).practiceMinutes, 7);
});

test("resuming within a watch block retains its original stop boundary", () => {
  assert.deepEqual(lessonWindow(5400, 30, 600), { startSeconds: 600, endSeconds: 1380 });
  assert.deepEqual(lessonWindow(5400, 30, 1380), { startSeconds: 1380, endSeconds: 2760 });
});

test("links cannot override the budget with oversized or invalid playback windows", () => {
  for (const request of [
    { startSeconds: 0, endSeconds: 5400 }, { startSeconds: -1, endSeconds: 10 },
    { startSeconds: 10, endSeconds: 9 }, { startSeconds: NaN, endSeconds: 20 },
    { startSeconds: 0, endSeconds: 1.5 }, { startSeconds: 5000, endSeconds: 6000 },
  ]) assert.deepEqual(lessonWindow(5400, 30, 0, request), { startSeconds: 0, endSeconds: 1380 });
  assert.deepEqual(lessonWindow(5400, 30, 0, { startSeconds: 1380, endSeconds: 2760 }), { startSeconds: 1380, endSeconds: 2760 });
});

test("short lessons stay short rather than adding another video after the block", () => {
  const plan = buildStudyPlan([topic("short", 600), topic("next", 600)], 30);
  assert.equal(plan.sessions.length, 2);
  assert.ok(plan.sessions.every(s => s.lessons.length === 1 && s.totalMinutes === 17));
});

function topic(id: string, seconds: number, watched = 0, status = "NOT_STARTED"): StudyTopic {
  return { id, name: id, resource: { durationSeconds: seconds }, progress: { watchedSeconds: watched, status } };
}
for (const dailyMinutes of [10, 30, 60, 120, 180, 720]) {
  test(`schedule preserves video time and fits a ${dailyMinutes}-minute budget`, () => {
    const { sessions } = buildStudyPlan([topic("first", 3841, 43), topic("second", 1111)], dailyMinutes);
    const seconds = sessions.flatMap((s) => s.lessons).reduce((sum, lesson) => sum + lesson.endSeconds - lesson.startSeconds, 0);
    assert.equal(seconds, 3841 - 43 + 1111);
    assert.equal(sessions[0].lessons[0].startSeconds, 43);
    for (const session of sessions) {
      assert.ok(session.totalMinutes <= dailyMinutes);
      assert.ok(session.practiceMinutes >= 2);
      assert.ok(session.lessons.every((lesson) => lesson.endSeconds > lesson.startSeconds));
    }
  });
}
test("a missing prerequisite blocks scheduling later topics but preserves earlier sessions", () => {
  const plan = buildStudyPlan([topic("first", 600), { id: "missing", name: "Missing prerequisite", resource: null, progress: null }, topic("later", 600)], 30);
  assert.equal(plan.blockedTopic, "Missing prerequisite");
  assert.deepEqual(plan.sessions.flatMap((s) => s.lessons.map((l) => l.topicId)), ["first"]);
});
test("completed topics are not scheduled and an all-complete path has no sessions", () => {
  assert.deepEqual(buildStudyPlan([topic("done", 1000, 900, "COMPLETE")], 30).sessions, []);
});
test("invalid budgets fail instead of entering an unbounded scheduling loop", () => {
  for (const minutes of [0, -1, NaN, Infinity, 1.5, 721]) assert.throws(() => buildStudyPlan([topic("first", 1000)], minutes));
});
test("redirects accept app deep links and reject external or encoded destinations", () => {
  assert.equal(safeReturnTo("/paths/test-path/topics/test-topic"), "/paths/test-path/topics/test-topic");
  for (const value of ["https://evil.example", "//evil.example", "/\\evil.example", "/paths/%2f%2fevil", "/login", "/dashboard/../login", "/dashboard?next=https://evil.example", undefined]) assert.equal(safeReturnTo(value), "/dashboard");
});
