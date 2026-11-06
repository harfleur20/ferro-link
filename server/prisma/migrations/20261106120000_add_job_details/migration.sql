-- AlterTable
ALTER TABLE "Job" ADD COLUMN "category" TEXT,
ADD COLUMN "experience" TEXT,
ADD COLUMN "salary" TEXT,
ADD COLUMN "imageUrl" TEXT,
ADD COLUMN "imageAlt" TEXT,
ADD COLUMN "missions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "slug" TEXT;

-- Existing rows keep a stable, unique URL
UPDATE "Job" SET "slug" = "id" WHERE "slug" IS NULL;
ALTER TABLE "Job" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Job_slug_key" ON "Job"("slug");
