-- CreateTable
CREATE TABLE "qna_items" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "courseId" INTEGER NOT NULL,
    "lessonId" INTEGER,
    "parentId" INTEGER,
    "isMarkedAsAnswer" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qna_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "qna_items_userId_idx" ON "qna_items"("userId");

-- CreateIndex
CREATE INDEX "qna_items_courseId_createdAt_idx" ON "qna_items"("courseId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "qna_items_lessonId_createdAt_idx" ON "qna_items"("lessonId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "qna_items_parentId_idx" ON "qna_items"("parentId");

-- AddForeignKey
ALTER TABLE "qna_items" ADD CONSTRAINT "qna_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qna_items" ADD CONSTRAINT "qna_items_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qna_items" ADD CONSTRAINT "qna_items_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qna_items" ADD CONSTRAINT "qna_items_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "qna_items"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
