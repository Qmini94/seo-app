-- CreateTable
CREATE TABLE "Keyword" (
    "id" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "monthlySearch" INTEGER NOT NULL,
    "mobileSearch" INTEGER NOT NULL,
    "pcSearch" INTEGER NOT NULL,
    "competition" TEXT NOT NULL,
    "cpc" INTEGER NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "intent" TEXT NOT NULL,
    "clusterId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Keyword_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeywordTrend" (
    "id" TEXT NOT NULL,
    "keywordId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "ratio" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "KeywordTrend_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Keyword_term_key" ON "Keyword"("term");

-- CreateIndex
CREATE INDEX "Keyword_clusterId_idx" ON "Keyword"("clusterId");

-- CreateIndex
CREATE UNIQUE INDEX "KeywordTrend_keywordId_period_key" ON "KeywordTrend"("keywordId", "period");

-- AddForeignKey
ALTER TABLE "KeywordTrend" ADD CONSTRAINT "KeywordTrend_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "Keyword"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
