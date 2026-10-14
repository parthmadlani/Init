CREATE TABLE "quiz_attempts" (
"id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "pathId" TEXT,
"scopeKey" TEXT NOT NULL, "kind" TEXT NOT NULL, "title" TEXT NOT NULL,
"questions" JSONB NOT NULL, "answers" JSONB NOT NULL DEFAULT '{}', "version" INTEGER NOT NULL DEFAULT 0,
"reviewCount" INTEGER NOT NULL DEFAULT 0, "personalized" BOOLEAN NOT NULL DEFAULT true,
"score" INTEGER, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "completedAt" TIMESTAMP(3),
CONSTRAINT "quiz_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
CONSTRAINT "quiz_attempts_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "paths"("id") ON DELETE SET NULL ON UPDATE CASCADE);
CREATE INDEX "quiz_attempts_userId_createdAt_idx" ON "quiz_attempts"("userId", "createdAt");
CREATE INDEX "quiz_attempts_userId_scopeKey_completedAt_idx" ON "quiz_attempts"("userId", "scopeKey", "completedAt");
CREATE UNIQUE INDEX "quiz_attempts_one_active_scope" ON "quiz_attempts"("userId", "scopeKey") WHERE "completedAt" IS NULL;
CREATE TABLE "lesson_packs" (
"id" TEXT NOT NULL PRIMARY KEY, "youtubeVideoId" TEXT NOT NULL, "version" TEXT NOT NULL,
"language" TEXT NOT NULL, "attribution" TEXT NOT NULL, "permissionBasis" TEXT NOT NULL, "reviewedBy" TEXT NOT NULL,
"cues" JSONB NOT NULL, "questions" JSONB NOT NULL, "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE UNIQUE INDEX "lesson_packs_youtubeVideoId_version_key" ON "lesson_packs"("youtubeVideoId", "version");
CREATE INDEX "lesson_packs_youtubeVideoId_publishedAt_idx" ON "lesson_packs"("youtubeVideoId", "publishedAt");
