# Replay-based practice

Branch: codex/rewind-adaptation. Not deployed.

Visible embedded playback detects backward jumps of at least 10 seconds followed by five seconds of replay. Initial loading, application-controlled transcript seeks, hidden playback, forward seeking and suspended recording do not contribute. Pauses alone do not contribute. Seeking while paused may not register; this is a conservative signal, not attention measurement.

The authenticated activity endpoint checks path ownership and the current video, limits activity requests, and stores at most one VIDEO_REWIND per learner/topic/video per five-minute bucket. Recording requires INSIGHTS_ENABLED=true. No exact replay positions are persisted.

Personalized quiz creation reads only this learner's last 14 days of replay signals for current course videos. Each contributes 0.5, capped at 1.5 per topic, below one incorrect answer's weight of 2. Unseen questions and broad topic coverage remain priorities. Existing attempts do not change. Opting out ignores replay weights. Fixed banks can limit the effect, particularly full-bank quizzes and single-topic checks.

This version adapts lesson-topic frequency, not individual transcript concepts. Retention uses the existing insights cleanup; production scheduler credentials still need configuration. Automated checks cover detection, resets, forward seeking, hidden/paused samples, weight limits, topic allocation and personalization opt-out. Live YouTube playback and production integration have not been verified for this branch.
