ALTER TABLE "Session" ADD COLUMN "id" TEXT;
UPDATE "Session" SET "id" = "sid" WHERE "id" IS NULL;
ALTER TABLE "Session" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "Session" DROP CONSTRAINT "Session_pkey";
ALTER TABLE "Session" ADD CONSTRAINT "Session_pkey" PRIMARY KEY ("id");
CREATE UNIQUE INDEX "Session_sid_key" ON "Session"("sid");
