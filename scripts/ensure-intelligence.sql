-- Intelligence engine columns (run if prisma db push is unavailable)
ALTER TABLE "PolymarketTrader" ADD COLUMN IF NOT EXISTS "edgeScore" DECIMAL(65,30) NOT NULL DEFAULT 0;
ALTER TABLE "PolymarketTrader" ADD COLUMN IF NOT EXISTS "avgTradeSize" DECIMAL(65,30) NOT NULL DEFAULT 0;
ALTER TABLE "PolymarketTrader" ADD COLUMN IF NOT EXISTS "totalVolumeUsd" DECIMAL(65,30) NOT NULL DEFAULT 0;
ALTER TABLE "PolymarketTrader" ADD COLUMN IF NOT EXISTS "timingScore" DECIMAL(65,30) NOT NULL DEFAULT 50;

CREATE TABLE IF NOT EXISTS "IntelligenceRanking" (
  "id" TEXT NOT NULL,
  "board" TEXT NOT NULL,
  "categorySlug" TEXT NOT NULL DEFAULT '',
  "payload" JSONB NOT NULL,
  "traderCount" INTEGER NOT NULL DEFAULT 0,
  "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IntelligenceRanking_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "IntelligenceRanking_board_categorySlug_key"
  ON "IntelligenceRanking"("board", "categorySlug");

CREATE INDEX IF NOT EXISTS "PolymarketTrader_edgeScore_idx" ON "PolymarketTrader"("edgeScore");
