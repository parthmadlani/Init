-- One matched video was previously shared per (topic, level) across every
-- student, regardless of daily time budget: whichever goal was created (or
-- re-created) most recently silently overwrote the row, so a 30-minute
-- learner's video could flip to a 2-hour learner's pick with no warning.
-- Adding dailyMinutes to the unique key gives each time-budget bucket its
-- own row instead. Existing rows default to 60 (the wizard's most common
-- option) since they predate per-budget matching.
ALTER TABLE "resources" ADD COLUMN "dailyMinutes" INTEGER NOT NULL DEFAULT 60;

DROP INDEX "resources_topicId_level_key";

CREATE UNIQUE INDEX "resources_topicId_level_dailyMinutes_key" ON "resources"("topicId", "level", "dailyMinutes");
