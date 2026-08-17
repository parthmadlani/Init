-- Drop the plain index and replace it with a unique constraint: one
-- matched Resource per (topic, level), so YouTube results can be upserted
-- in place instead of piling up rows.
DROP INDEX "resources_topicId_idx";

CREATE UNIQUE INDEX "resources_topicId_level_key" ON "resources"("topicId", "level");
