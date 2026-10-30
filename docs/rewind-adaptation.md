# Replay-based practice

Branch: codex/rewind-adaptation. Not deployed.

Visible embedded playback detects backward jumps of at least 10 seconds followed by five seconds of replay. Initial loading, application-controlled transcript seeks, hidden playback, forward seeking and suspended recording do not contribute. Pauses alone do not contribute. Seeking back while paused counts once five seconds replay after playback resumes, however long the pause; this is a conservative signal, not attention measurement.

The authenticated activity endpoint checks path ownership and the current video, limits activity requests, and stores at most one VIDEO_REWIND per learner/topic/video per five-minute bucket. Recording requires INSIGHTS_ENABLED=true. No exact replay positions are persisted.

Personalized quiz creation reads only this learner's last 14 days of replay signals for current course videos. Each contributes 0.5, capped at 1.5 per topic, below one incorrect answer's weight of 2. Unseen questions remain the priority. Within a tier of equally fresh questions, weak topics first receive up to two extra slots (one for any replay signal or unsure answer, two for a mistake or three or more replays), limited to 30% of the quiz, so a 10-question quiz over 10 topics can give a replayed topic two or three questions at the cost of the least weak topics. Remaining slots keep broad coverage, then favor weak topics. Existing attempts do not change. Opting out ignores replay weights. Fixed banks can limit the effect, particularly full-bank quizzes and single-topic checks.

This version adapts lesson-topic frequency, not individual transcript concepts. Retention uses the existing insights cleanup; production scheduler credentials still need configuration. Automated checks cover detection, resets, forward seeking, hidden/paused samples, weight limits, topic allocation and personalization opt-out. Live YouTube playback and production integration have not been verified for this branch.
