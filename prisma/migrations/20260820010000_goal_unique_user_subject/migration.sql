-- CreateIndex
CREATE UNIQUE INDEX "goals_userId_subjectId_key" ON "goals"("userId", "subjectId");
