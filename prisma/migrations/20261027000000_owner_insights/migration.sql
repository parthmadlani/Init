-- CreateTable
CREATE TABLE "insight_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "topicId" TEXT,
    "videoId" TEXT,
    "dedupeKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insight_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learner_presence" (
    "userId" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learner_presence_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "video_ratings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scopeKey" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "topicName" TEXT NOT NULL,
    "subjectName" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "dailyMinutes" INTEGER NOT NULL,
    "reaction" "ReactionType" NOT NULL,
    "reason" TEXT,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rating_changes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scopeKey" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "topicName" TEXT NOT NULL,
    "subjectName" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "dailyMinutes" INTEGER NOT NULL,
    "reaction" "ReactionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rating_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owner_issues" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "occurrences" INTEGER NOT NULL DEFAULT 1,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "owner_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owner_deliveries" (
    "key" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedUntil" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "providerId" TEXT,
    "lastError" TEXT,

    CONSTRAINT "owner_deliveries_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "insight_events_dedupeKey_key" ON "insight_events"("dedupeKey");

-- CreateIndex
CREATE INDEX "insight_events_createdAt_kind_idx" ON "insight_events"("createdAt", "kind");

-- CreateIndex
CREATE INDEX "insight_events_userId_createdAt_idx" ON "insight_events"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "learner_presence_lastSeenAt_idx" ON "learner_presence"("lastSeenAt");

-- CreateIndex
CREATE INDEX "video_ratings_videoId_topicId_idx" ON "video_ratings"("videoId", "topicId");

-- CreateIndex
CREATE UNIQUE INDEX "video_ratings_userId_scopeKey_key" ON "video_ratings"("userId", "scopeKey");

-- CreateIndex
CREATE INDEX "rating_changes_createdAt_idx" ON "rating_changes"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "owner_issues_key_key" ON "owner_issues"("key");

-- CreateIndex
CREATE INDEX "owner_issues_lastSeenAt_idx" ON "owner_issues"("lastSeenAt");

-- CreateIndex
CREATE INDEX "owner_deliveries_createdAt_idx" ON "owner_deliveries"("createdAt");

-- AddForeignKey
ALTER TABLE "insight_events" ADD CONSTRAINT "insight_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_presence" ADD CONSTRAINT "learner_presence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_ratings" ADD CONSTRAINT "video_ratings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rating_changes" ADD CONSTRAINT "rating_changes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
