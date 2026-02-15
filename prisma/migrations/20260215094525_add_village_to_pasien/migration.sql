-- AlterTable
ALTER TABLE "pasien" ADD COLUMN     "village_id" TEXT;

-- AddForeignKey
ALTER TABLE "pasien" ADD CONSTRAINT "pasien_village_id_fkey" FOREIGN KEY ("village_id") REFERENCES "villages"("village_id") ON DELETE SET NULL ON UPDATE CASCADE;
