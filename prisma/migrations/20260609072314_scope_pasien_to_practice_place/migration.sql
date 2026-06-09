-- DropIndex
DROP INDEX "users_practice_id_idx";

-- AlterTable
ALTER TABLE "pasien" ADD COLUMN     "practice_id" TEXT;

-- AddForeignKey
ALTER TABLE "pasien" ADD CONSTRAINT "pasien_practice_id_fkey" FOREIGN KEY ("practice_id") REFERENCES "practice_places"("practice_id") ON DELETE SET NULL ON UPDATE CASCADE;
